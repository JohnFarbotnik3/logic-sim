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
	/* Amount of accumulated simulation steps, based on elapsed time and simulation-speed. */
	u64 prev_time_ms;
	u64 curr_time_ms;
	u32 accumulated_msteps;
	
	GameSimulation() {
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

	u32 getCellValue(String cellId, u32 sb, u32 tgt) {
		if(sb == SimulationTree::INDEX_NONE) return 0x0;
		const u32 ind = this->simtree.simblocks[sb].cmap[cellId];
		const SimulationTask& task = this->tasks[ind / CELLS_PER_TASK];
		return task.cell_buffer[task.toLocalIndex(ind)].values[tgt];
	}

	u32 getChildSimblock(String blockId, u32 sb) {
		if(sb == SimulationTree::INDEX_NONE) return SimulationTree::INDEX_NONE;
		return this->simtree.simblocks[sb].bmap[blockId];
	}

	/* Call this to initialize cell value in root simblock, or one of its immediate children. */
	void modifyCellValue(ItemId blockId, ItemId cellId, u32 val) {
		const SimulationBlock& rootSB = simtree.simblocks[SimulationTree::INDEX_ROOT];
		const u32 ind = (blockId == ItemId::THIS_BLOCK) ? rootSB.cmap.at(cellId) : simtree.simblocks[rootSB.bmap.at(blockId)].cmap[cellId];
		this->tasks[ind / CELLS_PER_TASK].modifyCellValue(ind, val);
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
			u32 index = cell_buffer.size();
			for(const Cell& cell : btmp.cells) {
				cell_buffer.push_back(SimulationCell(cell.value, cell.taskOrder));
				const auto order = cell_buffer[index].task_order;
				assert(order < NUM_CELL_TYPES);
				simblock.cmap[cell.id] = index++;
			}
		}
	}

	void transfer_cell_values(
		SimulationTree& newtree,
		SimulationTree& oldtree,
		Vector<SimulationTask>& oldTasks,
		Vector<SimulationCell>& newCellbuf,
		const u32 n_newcells,
		const u32 n_oldcells
	) {
		// gather cell values from old tasks.
		u32* olddata = new u32[n_oldcells];// use heap to avoid stack overflow on large simulations.
		for(u32 i=0;i<n_oldcells;i++) {
			const SimulationTask& task = oldTasks[i / CELLS_PER_TASK];
			olddata[i] = task.cell_buffer[i - task.cell_ibeg].values[LINK_TARGETS.OUTPUT];
		}
		// transfer values to new cell buffer.
		SimulationTree::transferCellValues(newtree, oldtree, newCellbuf, olddata);
		delete[] olddata;
	}
	
	bool has_outputting_links(const Map<ItemId, Map<ItemId, Map<ItemId, Vector<Link>>>>& linkmap, ItemId tid, ItemId bid) {
		return linkmap.contains(tid) && linkmap.at(tid).contains(bid);
	}

	void generate_link_data(
		SimulationTree& simtree,
		Vector<SimulationCell>& cell_buffer,
		Vector<SimulationLink>& link_buffer
	) {
		// get map of all outputting links in template library.
		// format: Map[templateId][blockId][cellId] = Vector<Link>
		const auto linkmap = simtree.library.getOutputtingLinks();
		// add link lists to link buffer.
		for(SimulationBlock& simblock : simtree.simblocks) {
			const BlockTemplate& btmp = simtree.getTemplate(simblock);
			Map<ItemId, Vector<SimulationLink>> gathered_links;
			// get links in this block which output from a cell in this block.
			{
				const ItemId tid = simblock.templateId;
				const ItemId bid = ItemId::THIS_BLOCK;
				if(has_outputting_links(linkmap, tid, bid)) {
					const auto& map = linkmap.at(tid).at(bid);
					for(const auto& [cellId, list] : map) {
						for(const Link& link : list) {
							const u32 ind = simtree.getCellIndex(simblock, link.dst.bid, link.dst.cid);
							const u32 tgt = link.dst.tgt;
							gathered_links[cellId].emplace_back(ind, tgt);
						}
					}
				}
			}
			// get links in parent which output from a cell in this (child) block.
			if(simblock.parentIndex != SimulationTree::INDEX_NONE) {
				const SimulationBlock& parentSB = simtree.getParent(simblock);
				const ItemId tid = parentSB.templateId;
				const ItemId bid = simblock.blockId;
				if(has_outputting_links(linkmap, tid, bid)) {
					const auto& map = linkmap.at(tid).at(bid);
					for(const auto& [cellId, list] : map) {
						for(const Link& link : list) {
							const u32 ind = simtree.getCellIndex(parentSB, link.dst.bid, link.dst.cid);
							const u32 tgt = link.dst.tgt;
							gathered_links[cellId].emplace_back(ind, tgt);
						}
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
	void rebuild(BlockTemplateLibrary& library, ItemId rootTemplateId, bool keepCellValues) {
		printf("checkpoint 0\n");
		SimulationTree& oldTree = this->simtree;
		SimulationTree  newTree = SimulationTree(library, rootTemplateId);

		printf("checkpoint 1\n");
		Vector<SimulationCell> cell_buffer;
		cell_buffer.reserve(library.totalCellsInTree(rootTemplateId));
		this->generate_cell_data(newTree, cell_buffer);

		if(keepCellValues & (newTree.rootTemplateId == oldTree.rootTemplateId)) {
			printf("checkpoint 1.5\n");
			const u32 n_newcells = newTree.library.totalCellsInTree(newTree.rootTemplateId);
			const u32 n_oldcells = oldTree.library.totalCellsInTree(oldTree.rootTemplateId);
			transfer_cell_values(newTree, oldTree, tasks, cell_buffer, n_newcells, n_oldcells);
		}

		printf("checkpoint 2\n");
		Vector<SimulationLink> link_buffer;
		link_buffer.reserve(library.totalLinksInTree(rootTemplateId));
		this->generate_link_data(newTree, cell_buffer, link_buffer);

		printf("checkpoint 3\n");
		this->generate_tasks(cell_buffer, link_buffer);

		printf("checkpoint 4\n");
		this->simtree = newTree;
	}
	
	// ============================================================
	// Update
	// ------------------------------------------------------------
	void update(float simulationRate) {
		const u64 max_runtime_ms = 1000 / 60;
		u64 prev = this->prev_time_ms = this->curr_time_ms;
		u64 curr = this->curr_time_ms = Date::now_ms();
		if(prev == 0) prev = curr;
		this->accumulated_msteps += (curr - prev) * simulationRate;
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
};
