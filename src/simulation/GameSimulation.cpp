#include "../lib/Date.cpp"
#include "./SimulationTree.cpp"
#include "./SimulationTask.cpp"

/*
	Shared simulation data will be stored in this struct.
	
	One major optimization that is integral to this simulation is that
	cells are only updated when one of their input-values have changed.
	This is achieved by giving each cell a list of indices of cells it outputs to,
	so they can be added to a list of cells to update during next
	simulation-step when an input-value changes.
*/
struct GameSimulation {
	/* The simulation tree created by expanding root block template. */
	SimulationTree simtree;
	/* List of task objects. */
	Vector<SimulationTask> tasks;
	/* True if tree should rebuild. */
	bool shouldRebuild;
	/* True if tree should be reset. (i.e. rebuild, but without saving values - NOT YET IMPLEMENTED) */
	bool shouldReset;
	/* True if simulation should update. */
	bool isRunning;
	/* Amount of accumulated simulation steps, based on elapsed time and simulation-speed. */
	u64 prev_time_ms;
	u64 curr_time_ms;
	u32 accumulated_msteps;
	
	GameSimulation() {
		this->shouldRebuild	= true;
		this->shouldReset	= true;
		this->isRunning		= true;
		this->prev_time_ms			= 0;
		this->curr_time_ms			= 0;
		this->accumulated_msteps	= 0;
	}
	
	// ============================================================
	// Helpers.
	// ------------------------------------------------------------
	
	void pushCellUpdate(u32 ind, u32 tgt, u32 val) {
		this->tasks[ind / CELLS_PER_TASK].pushCellUpdate(ind, tgt, val);
	}
	void pushCellUpdate(SimulationUpdate& upd) {
		this->tasks[upd.get_ind() / CELLS_PER_TASK].pushCellUpdate(upd);
	}
	
	void applyCellOutputChange(u32 ind, u32 val) {
		this->tasks[ind / CELLS_PER_TASK].applyCellOutputChange(ind, val);
	}
	
	// ============================================================
	// Initialization stages.
	// ------------------------------------------------------------
	
	void generate_cell_data(
		SimulationTree& simtree,
		Vector<SimulationCell>& cell_buffer
	) {
		for(SimulationBlock& simblock : simtree.simblocks) {
			const BlockTemplate& btmp = simtree.getTemplate(simblock);
			for(const Cell& cell : btmp.cells) {
				const int index = cell_buffer.size();
				simblock.cmap[cell.id] = index;
				cell_buffer.push_back(SimulationCell(cell.value, cell.taskOrder));
			}
		}
	}
	
	void generate_link_data(
		SimulationTree& simtree,
		Vector<SimulationCell>& cell_buffer,
		Vector<SimulationLink>& link_buffer
	) {
		for(SimulationBlock& simblock : simtree.simblocks) {
			const BlockTemplate& btmp = simtree.getTemplate(simblock);
			Map<ItemId, Vector<SimulationLink>> gathered_links;
			// get links in this block which output from a cell in this block.
			{
				const auto& map = simtree.library.getOutputtingLinks(simblock.templateId)[simblock.blockId];
				for(const auto& [cellId, list] : map) {
					for(const Link& link : list) {
						const u32 ind = simtree.getCellIndex(simblock, link.dst.bid, link.dst.cid);
						const u32 tgt = link.dst.tgt;
						gathered_links[cellId].emplace_back(ind, tgt);
					}
				}
			}
			// get links in parent which output from a cell in this (child) block.
			if(simblock.parent != nullptr) {
				const SimulationBlock& parentSB = *(simblock.parent);
				const auto& map = simtree.library.getOutputtingLinks(parentSB.templateId)[simblock.blockId];
				for(const auto& [cellId, list] : map) {
					for(const Link& link : list) {
						const u32 ind = simtree.getCellIndex(parentSB, link.dst.bid, link.dst.cid);
						const u32 tgt = link.dst.tgt;
						gathered_links[cellId].emplace_back(ind, tgt);
					}
				}
			}
			// add links to buffer and notify simcells.
			for(const auto& [cellId, list] : gathered_links) {
				auto& cell = cell_buffer[simblock.cmap[cellId]];
				cell.links_len = list.size();
				cell.links_ofs = link_buffer.size();
				for(const SimulationLink simlink : list) link_buffer.push_back(simlink);
			}
		}
	}
	
	void generate_tasks(
		Vector<SimulationCell>& cellbuf,
		Vector<SimulationLink>& linkbuf
	) {
		this->tasks.clear();
		const u32 N = cellbuf.size();
		for(u32 n=0;n<N;n+=CELLS_PER_TASK) {
			// create task.
			const u32 ibeg = n;
			const u32 iend = std::min(N, ibeg + CELLS_PER_TASK);
			SimulationTask& task = tasks.emplace_back(cellbuf, linkbuf, ibeg, iend);
			// initialize and propagate initial cell values.
			for(int i=ibeg;i<iend;i++) task.initializeCellValue(i, cellbuf[i].values[LINK_TARGETS.OUTPUT]);
		}
	}
	
	/* Initialize or rebuild simulation data. */
	void rebuild(BlockTemplateLibrary& library) {
		const ItemId& rootTemplateId = library.rootTemplateId;
		SimulationTree  oldTree = this->simtree;
		SimulationTree& newTree = this->simtree = SimulationTree(library);
		
		Vector<SimulationCell> cell_buffer;
		cell_buffer.reserve(library.totalCellsInTree(rootTemplateId));
		this->generate_cell_data(newTree, cell_buffer);

		Vector<SimulationLink> link_buffer;
		link_buffer.reserve(library.totalLinksInTree(rootTemplateId));
		this->generate_link_data(newTree, cell_buffer, link_buffer);

		this->generate_tasks(cell_buffer, link_buffer);

		this->shouldRebuild = false;
		this->shouldReset = false;
	}
	
	// ============================================================
	// Update
	// ------------------------------------------------------------
	void update(float simulationRate) {
		const u64 max_runtime_ms = 1000 / 60;
		u64 prev = this->prev_time_ms = this->curr_time_ms;
		u64 curr = this->curr_time_ms = Date::now_ms();
		if((prev == 0) | !this->isRunning) prev = curr;
		this->accumulated_msteps += (curr - prev) * simulationRate;
		if(this->isRunning) {
			while(this->accumulated_msteps > 1000) {
				// check if time limit reached
				if(Date::now_ms() - curr < max_runtime_ms) {
					this->accumulated_msteps -= 1000;
				} else {
					this->accumulated_msteps = 0;
					break;
				}
				// perform simulation step.
				for(SimulationTask& task : this->tasks) {
					if(task.shouldUpdate()) task.update();
				}
				// gather and spread outputs.
				for(SimulationTask& task : this->tasks) {
					for(SimulationUpdate& upd : task.out_buffer) this->pushCellUpdate(upd);
				}
			}
		}
	}
};
