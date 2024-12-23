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

	u32 getCellValue(u32 ind, u32 tgt) {
		const SimulationTask& task = this->tasks[ind / CELLS_PER_TASK];
		return task.cell_buffer[task.toLocalIndex(ind)].values[tgt];
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
				const auto& map = simtree.library.getOutputtingLinks(simblock.templateId)[ItemId::THIS_BLOCK];
				printf("<> gathered_links - map 1: %lu\n", map.size());
				for(const auto& [cellId, list] : map) {
					for(const Link& link : list) {
						const u32 ind = simtree.getCellIndex(simblock, link.dst.bid, link.dst.cid);
						const u32 tgt = link.dst.tgt;
						gathered_links[cellId].emplace_back(ind, tgt);
					}
				}
			}
			// get links in parent which output from a cell in this (child) block.
			printf("<> gathered_links - csimb: %llu\n", simblock.blockId);
			printf("<> gathered_links - ctemp: %llu\n", simblock.templateId);
			if(simblock.parentIndex != SimulationBlock::INDEX_NONE) {
				const SimulationBlock& parentSB = simtree.getParent(simblock);
				const auto& map = simtree.library.getOutputtingLinks(parentSB.templateId)[simblock.blockId];
				auto& supermap = simtree.library.getOutputtingLinks(parentSB.templateId);
				printf("<> gathered_links - map 2: %lu\n", map.size());
				for(const auto& [cellId, list] : map) {
					for(const Link& link : list) {
						printf("<> gathered_links - CID: %llu\n", cellId);
						const u32 ind = simtree.getCellIndex(parentSB, link.dst.bid, link.dst.cid);
						const u32 tgt = link.dst.tgt;
						printf("<> gathered_links - PRE: %llu\n", cellId);
						gathered_links[cellId].emplace_back(ind, tgt);
						printf("<> gathered_links - POST: %llu\n", cellId);
					}
				}
			}
			// add links to buffer and notify simcells.
			printf("<> gathered_links: %lu\n", gathered_links.size());
			for(const auto& [cellId, list] : gathered_links) {
				auto& cell = cell_buffer[simblock.cmap[cellId]];
				cell.links_len = list.size();
				cell.links_ofs = link_buffer.size();
				for(const SimulationLink simlink : list) link_buffer.push_back(simlink);
			}
		}
	}
	
	void generate_tasks(
		const Vector<SimulationCell>& cellbuf,
		const Vector<SimulationLink>& linkbuf
	) {
		this->tasks.clear();
		const u32 N = cellbuf.size();
		for(u32 n=0;n<N;n+=CELLS_PER_TASK) {
			// create task.
			const u32 ibeg = n;
			const u32 iend = std::min(N, ibeg + CELLS_PER_TASK);
			SimulationTask task = SimulationTask(cellbuf, linkbuf, ibeg, iend);
			// initialize and propagate initial cell values.
			for(int i=ibeg;i<iend;i++) task.initializeCellValue(i, cellbuf[i].values[LINK_TARGETS.OUTPUT]);
			tasks.push_back(task);
		}
	}
	
	/* Initialize or rebuild simulation data. */
	void rebuild(BlockTemplateLibrary& library, ItemId rootTemplateId) {
		printf("checkpoint 0\n");
		SimulationTree& oldTree = this->simtree;
		SimulationTree  newTree = SimulationTree(library, rootTemplateId);

		printf("checkpoint 1\n");
		Vector<SimulationCell> cell_buffer;
		cell_buffer.reserve(library.totalCellsInTree(rootTemplateId));
		this->generate_cell_data(newTree, cell_buffer);

		printf("checkpoint 2\n");
		Vector<SimulationLink> link_buffer;
		link_buffer.reserve(library.totalLinksInTree(rootTemplateId));
		this->generate_link_data(newTree, cell_buffer, link_buffer);

		printf("checkpoint 3\n");
		this->generate_tasks(cell_buffer, link_buffer);

		printf("checkpoint 4\n");
		this->simtree = newTree;
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
				//printf("update step 0\n");
				if(Date::now_ms() - curr < max_runtime_ms) {
					this->accumulated_msteps -= 1000;
				} else {
					this->accumulated_msteps = 0;
					break;
				}
				// perform simulation step.
				//printf("update step 1\n");
				for(SimulationTask& task : this->tasks) {
					if(task.shouldUpdate()) task.update();
				}
				// gather and spread outputs.
				//printf("update step 2\n");
				for(SimulationTask& task : this->tasks) {
					for(SimulationUpdate& upd : task.out_buffer) this->pushCellUpdate(upd);
				}
			}
		}
	}
};
