#include "./SimulationTree.cpp"

/*
	Shared simulation data will be stored in this struct.
	
	One major optimization that is integral to this simulation is that
	cells are only updated when one of their input-values have changed.
	This is achieved by giving each cell a list of indices of cells it outputs to,
	so they can be added to a list of cells to update during next
	simulation-step when an input-value changes.
*/
class GameSimulation {
	/* The simulation tree created by expanding root block template. */
	SimulationTree simtree;
	/* Array of task objects. */
	SimulationTask tasks;
	/* True if tree should rebuild. */
	bool shouldRebuild;
	/* True if tree should be reset. (i.e. rebuild, but without saving values - NOT YET IMPLEMENTED) */
	bool shouldReset;
	/* True if simulation should update. */
	bool isRunning;
	/* Amount of accumulated simulation steps, based on elapsed time and simulation-speed. */
	u64 previousTime;
	u32 accumulatedSteps;
	
	GameSimulation() {
		this->shouldRebuild	= true;
		this->shouldReset	= true;
		this->isRunning		= true;
		this->previousTime		= 0;
		this->accumulatedSteps	= 0;
		
	}
	
	// ============================================================
	// Helpers.
	// ------------------------------------------------------------
	
	void pushCellUpdate(ind, tgt, val) {
		const t = ind / CELLS_PER_TASK;
		this.tasks[t].pushCellUpdate(ind, tgt, val);
	}
	
	void applyCellOutputChange(ind, val) {
		const t = ind / CELLS_PER_TASK;
		this.tasks[t].applyCellOutputChange(ind, val);
	}
	
	// ============================================================
	// Initialization stages.
	// ------------------------------------------------------------
	
	/* Generate cell data. */
	void rebuild_generateCellData(SimulationTree& simtree, SimulationBlock& simblock, Vector<SimulationCell>& cell_buffer) {
		BlockTemplate btemp = simtree.getTemplate(simblock);
		simblock.cmap.reserve(btemp.cells.length());
		for(const Cell cell : btemp.cells) {
			simblock.cmap[cell.id] = cell_buffer.size();
			cell_buffer.push_back(SimulationCell(cell.value, cell.taskOrder));
		}
		for(const Block block : btemp.blocks) {
			const SimulationBlock childSB = simblock.bmap[block.id];
			this->rebuild_generateCellData(simtree, childSB, cell_buffer);
		}
	}
	
	// TODO: continue from here...
	
	/*
		Recursively generate link data for links that output from given simblock.
	*/
	rebuild_generateSimblockLinks(simblock, parentSB, cell_buffer, link_buffer) {
		// get links in this block which output from a cell in this block.
		const s_data = simblock.template.getOutputtingLinks(ComponentId.THIS_BLOCK);
		// get links in parent which output from a cell in this child-block.
		const p_data = parentSB ? parentSB.template.getOutputtingLinks(simblock.blockId) : null;
		// add links to buffer and set cell link-lists.
		for(const cell of simblock.template.cells) {
			const cid = cell.id;
			const cind = simblock.getCellIndex(cid);
			const s_arr = s_data?.get(cid);
			const p_arr = p_data?.get(cid);
			let len = 0;
			let ofs = link_buffer.count;
			if(s_arr) for(const [bid_dst, cid_dst, tgt_dst] of s_arr) {
				const ind_dst = simblock.getSimblock(bid_dst).getCellIndex(cid_dst);
				link_buffer.set_all(ofs+len, ind_dst, tgt_dst);
				len++;
			}
			if(p_arr) for(const [bid_dst, cid_dst, tgt_dst] of p_arr) {
				const ind_dst = parentSB.getSimblock(bid_dst).getCellIndex(cid_dst);
				link_buffer.set_all(ofs+len, ind_dst, tgt_dst);
				len++;
			}
			cell_buffer.setLinkList(cind, len, ofs);
			link_buffer.count += len;
		}
		// call recursively.
		for(const block of simblock.template.blocks) {
			const sb = simblock.getSimblock(block.id);
			this.rebuild_generateSimblockLinks(sb, simblock, cell_buffer, link_buffer);
		}
	}
	
	/* create new array of task objects. */
	rebuild_createTasks(cellbuf, linkbuf) {
		const tasks = [];
		const N = cellbuf.count;
		for(let ibeg=0; ibeg<N; ibeg+=CELLS_PER_TASK) {
			let iend = Math.min(N, ibeg + CELLS_PER_TASK);
			// get total number of links.
			let link_count = 0;
			for(let i=ibeg;i<iend;i++) link_count += cellbuf.get_links_len(i);
			// create task.
			const task = new SimulationTask(ibeg, iend, link_count);
			tasks.push(task);
			// copy cells to task-local buffer.
			for(let i=ibeg;i<iend;i++) task.cell_buffer.copyFrom(cellbuf, i-ibeg, i);
			// copy links to task-local buffer, and update link-list pointers.
			let newofs = 0;
			for(let i=ibeg;i<iend;i++) {
				const len = cellbuf.get_links_len(i);
				const ofs = cellbuf.get_links_ofs(i);
				task.cell_buffer.set_links_ofs(i-ibeg, newofs);
				for(let x=0;x<len;x++) task.link_buffer.copyFrom(linkbuf, newofs++, ofs+x);
			}
			task.link_buffer.count = newofs;
			// initialize and propagate initial cell values.
			for(let i=ibeg;i<iend;i++) task.initializeCellValue(i, cellbuf.get_value_out(i));
		}
		this.tasks = tasks;
	}
	
	/* Initialize or rebuild simulation data. */
	rebuild() {
		const t0 = Date.now();
		// create buffers.
		const rootTemplate = gameData.rootBlock.template;
		const cell_buffer = new SimulationCellBuffer(rootTemplate.totalCellsInTree());
		const link_buffer = new SimulationLinkBuffer(rootTemplate.totalLinksInTree());
		// build simulation data, as well as new sim-block tree, starting from bottom of tree and finishing with root block.
		const oldTree = this.root_simulation_block;
		const newTree = new SimulationTreeBlock(gameData.rootBlock.template, ComponentId.NONE, 0);
		this.root_simulation_block = newTree;
		this.rebuild_generateCellData(newTree, cell_buffer);
		const numCells = cell_buffer.count = newTree.numCells;
		console.log("numCells", numCells);
		// build simulation links once tree and cell data have been generated.
		this.rebuild_generateSimblockLinks(newTree, null, cell_buffer, link_buffer);
		const numLinks = link_buffer.count;
		console.log("numLinks", numLinks);
		// create new task objects.
		this.rebuild_createTasks(cell_buffer, link_buffer);
		console.log("rebuild_createTasks", this.tasks.length);
		// finishing touches.
		this.shouldRebuild = false;
		this.shouldReset = false;
		const t1 = Date.now();
		console.log("simulation.rebuild", t1-t0, numCells, numLinks);
	}
	
	// ============================================================
	// Update stages.
	// ------------------------------------------------------------
	
	update_gatherAndSpreadBuffers() {
		// gather and spread updates.
		for(const task of this.tasks) {
			const N = task.out_buffer.count;
			for(let x=0;x<N;x++) {
				const ind = task.out_buffer.get_ind(x);
				const tgt = task.out_buffer.get_tgt(x);
				const val = task.out_buffer.get_val(x);
				this.pushCellUpdate(ind, tgt, val);
			}
		}
	}
	
	update_tasks() {
		// TODO: make multi-threaded.
		for(const task of this.tasks) task.update();
	}
	
	update() {
		if(this.previousTime === 0 | !this.isRunning) this.previousTime = Date.now();
		const prev = this.previousTime;
		const curr = Date.now();
		const runlimit = 1000 / 60;// safety: minimum fps target.
		this.accumulatedSteps += (curr - prev) * gameData.simulationSpeed / 1000;
		this.previousTime = curr;
		
		if(this.shouldRebuild | this.shouldReset) this.rebuild();
		if(this.isRunning) {
			while(this.accumulatedSteps > 1) {
				// check if time limit reached
				if(Date.now() - curr < runlimit) { this.accumulatedSteps -= 1.0; }
				else { this.accumulatedSteps = 0.0; break; }
				// perform simulation step.
				const t0 = Date.now();
				this.update_tasks();
				const t1 = Date.now();
				this.update_gatherAndSpreadBuffers();
				const t2 = Date.now();
				Performance.increment_time("simulation.update_tasks  ", t1-t0);
				Performance.increment_time("simulation.update_gth+spr", t2-t1);
				for(const task of this.tasks) {
					Performance.increment_count("simulation.task.perf_n_updates", task.perf_n_updates); task.perf_n_updates=0;
					Performance.increment_count("simulation.task.perf_n_outputs", task.perf_n_outputs); task.perf_n_outputs=0;
				}
				Performance.increment_time("simulation.update        ", t2-t0);
			}
		}
	}
	
	// ============================================================
	// Content change handlers.
	// Note: It is assumed that content is being added to root-block.
	// ------------------------------------------------------------
	onContentChanged_addCell(cell) {
		this.shouldRebuild = true;
		// TODO: add cell to task and rebuild task only.
	}
	onContentChanged_remCell(cell) {
		this.shouldRebuild = true;
		// TODO: remove cell to task and rebuild task only.
	}
	onContentChanged_addLink(link) {
		this.shouldRebuild = true;
		// TODO: add link to task and rebuild task only.
	}
	onContentChanged_remLink(link) {
		this.shouldRebuild = true;
		// TODO: remove link from task and rebuild task only.
	}
	onContentChanged_addBlock() { this.shouldRebuild = true; }
	onContentChanged_remBlock() { this.shouldRebuild = true; }
	
	// ============================================================
	// Rendering Helpers.
	// ------------------------------------------------------------
	
	populateCellValues(simblock, cid, dst) {
		if(simblock?.hasCellIndex(cid)) {
			const cind = simblock.getCellIndex(cid);
			const task = this.tasks[this.getTaskIndex(cind)];
			dst[0] = task.cell_buffer.get_value_out(cind - task.ibeg);
			dst[1] = task.cell_buffer.get_value_ina(cind - task.ibeg);
			dst[2] = task.cell_buffer.get_value_inb(cind - task.ibeg);
		} else {
			dst[0] = cell.value;
			dst[1] = 0x0;
			dst[2] = 0x0;
		}
	}
	
};




