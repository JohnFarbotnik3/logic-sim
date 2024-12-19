
/*
	Simulation data is split into batches, i.e. "Tasks",
	where threads can update a small group of cells independently,
	and then produce some output data that the parent thread gathers
	when all tasks are complete. 
*/
struct SimulationTask {
	/* Cells that belong to this task. */
	Vector<SimulationCell>		cell_buffer;
	/* Link lists that belong to cells, gathered into a single array. */
	Vector<SimulationLink>		link_buffer;
	/* List of updates to send to cells outside of this task. */
	Vector<SimulationUpdate>	out_buffer;
	/* List of internal indices to update during next update cycle. */
	SimulationArrayMap			update_map;
	/* First index in shared cell data. */
	u32		cell_ibeg;
	u32 	cell_iend;
	/* Performance metrics. */
	u32		perf_n_updates;
	u32		perf_n_outputs;
	
	SimulationTask(u32 cell_ibeg, u32 cell_iend, u32 link_ibeg, u32 link_iend) {
		const u32 cell_count = cell_iend - cell_ibeg;
		const u32 link_count = link_iend - link_ibeg;
		this->cell_ibeg = cell_ibeg;
		this->cell_iend = cell_iend;
		this->cell_buffer.reserve(cell_count);
		this->link_buffer.reserve(link_count);
		this-> out_buffer.reserve(link_count);
		this->update_map.clear();
		this->perf_n_updates = 0;
		this->perf_n_outputs = 0;
	}
	
	bool shouldUpdate() { return this->update_map.count > 0; }
	u32 toLocalIndex(u32 ind) { return ind - this->cell_ibeg; }
	u32 toGlobalIndex(u32 ind) { return ind + this->cell_ibeg; }
	
	/* Update cell value and add to list of cells to update during next cycle. */
	void pushCellUpdate(u32 ind, u32 tgt, u32 val) {
		const u32 x = toLocalIndex(ind);
		this->cell_buffer[x].setValue(tgt, val);
		this->update_map.add(x);
	}
	
	/* Set the new output value of a cell, and notify output targets. */
	void applyCellOutputChange(cellInd, val) {
		const u32 len = this->cell_buffer[cellInd].links_len;
		const u32 ofs = this->cell_buffer[cellInd].links_ofs;
		// write changed value to cell.
		this->cell_buffer[cellInd].setValue(LINK_TARGETS::OUTPUT, val);
		// push update-values for output targets.
		for(u32 k=0;k<len;k++) {
			const u32 ind = this.link_buffer[ofs+k].get_ind();
			const u32 tgt = this.link_buffer[ofs+k].get_tgt();
			const bool isLocal = (this->cell_ibeg <= ind) & (ind < this->cell_iend);
			if(isLocal)	this->pushCellUpdate(ind, tgt, val);
			else		this->out_buffer.emplace_back(ind, tgt, val);
		}
	}
	
	/* Initialize and propagate cell value. */
	void initializeCellValue(u32 ind, u32 val) {
		// push cell update containing initial value.
		this->pushCellUpdate(ind, LINK_TARGETS::OUTPUT, val);
		// special handling for constants: manually propagate (since constants do not update normally).
		const u32 x = toLocalIndex(ind);
		if(this->cell_buffer[x].task_order == CELL_TYPES::CONSTANT.taskOrder) {
			this->applyCellOutputChange(x, val);
		}
	}
	
	/* Macro for setting loop interval for given cell type. */
	void loopConfig((const int*)& offsets, (const int*)& counts, int& beg, int& end, int& order) {
		beg = offsets[order];
		end = offsets[order] + counts[order];
	} 
	
	/* Perform an update cycle. */
	void update() {
		
		// TODO: move this check to caller instead.
		if(!this->shouldUpdate()) return;
		
		// ============================================================
		// Sort inputs.
		// ------------------------------------------------------------
		
		// bucket-sort local cell indices based on cell type.
		const int NUM_TYPES = Cell::NEXT_TASK_ORDER;
		int offsets[NUM_TYPES];
		int counts [NUM_TYPES];
		for(int i=0;i<NUM_TYPES;i++) offsets[i] = 0;
		for(int i=0;i<NUM_TYPES;i++) counts [i] = 0;
		
		const int num = this->update_map.count;
		int sorted_inds[num];
		
		for(int i=0;i<num;i++) {
			const x = this->update_map.stack[i];
			const bucket = cell_buffer[x].task_order;
			counts[bucket]++;
		}
		
		int sum=0;
		for(int x=0;x<NUM_TYPES;x++) { offsets[x]=sum; sum+=counts[x]; }
		
		for(int i=0;i<num;i++) {
			const x = this->update_map.stack[i];
			const bucket = cell_buffer[x].task_order;
			sorted_inds[offsets[bucket]++] = x;
		}
		
		// reset offsets for later use.
		for(int x=0;x<NUM_TYPES;x++) { offsets[x] -= counts[x]; }
		
		// ============================================================
		// Compute values.
		// ------------------------------------------------------------
		// gather input values.
		const u32 out_prev[num];
		const u32 out[num];
		const u32 ina[num];
		const u32 inb[num];
		for(int i=0;i<num;i++) {
			const SimulationCell& cell = cell_buffer[sorted_inds[i]];
			out_prev[i]	= cell.values[0];
			ina[i]		= cell.values[1];
			inb[i]		= cell.values[2];
		}
		
		// compute output values.
		{
		int b=0;
		int e=0;
		loopConfig(offsets, counts, b, e, CELL_TYPES::CONSTANT.taskOrder];	for(int x=b;x<e;x++) { out[x] = out_prev[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::COPY	.taskOrder];	for(int x=b;x<e;x++) { out[x] = ina[x]; }
		// bitwise operators
		loopConfig(offsets, counts, b, e, CELL_TYPES::OR	.taskOrder];	for(int x=b;x<e;x++) { out[x] =   ina[x] |  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::XOR	.taskOrder];	for(int x=b;x<e;x++) { out[x] =   ina[x] ^  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::NOT	.taskOrder];	for(int x=b;x<e;x++) { out[x] = ~(ina[x]); }
		loopConfig(offsets, counts, b, e, CELL_TYPES::AND	.taskOrder];	for(int x=b;x<e;x++) { out[x] =   ina[x] &  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::LSHIFT.taskOrder];	for(int x=b;x<e;x++) { out[x] =   ina[x] << inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::RSHIFT.taskOrder];	for(int x=b;x<e;x++) { out[x] =   ina[x] >> inb[x]; }
		// arithmetic & comparison
		loopConfig(offsets, counts, b, e, CELL_TYPES::ADD	.taskOrder];	for(int x=b;x<e;x++) { out[x] =  ina[x] +  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::SUB	.taskOrder];	for(int x=b;x<e;x++) { out[x] =  ina[x] -  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::MULT	.taskOrder];	for(int x=b;x<e;x++) { out[x] =  ina[x] *  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::DIV	.taskOrder];	for(int x=b;x<e;x++) { out[x] =  ina[x] /  std::max(inb[x], 0x1); }
		loopConfig(offsets, counts, b, e, CELL_TYPES::GTH	.taskOrder];	for(int x=b;x<e;x++) { out[x] = (ina[x] >  inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::LTH	.taskOrder];	for(int x=b;x<e;x++) { out[x] = (ina[x] <  inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::EQUALS.taskOrder];	for(int x=b;x<e;x++) { out[x] = (ina[x] == inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::GEQ	.taskOrder];	for(int x=b;x<e;x++) { out[x] = (ina[x] >= inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES::LEQ	.taskOrder];	for(int x=b;x<e;x++) { out[x] = (ina[x] <= inb[x]) ? 0xffffffff : 0x0; }
		}
		
		// ============================================================
		// Collect outputs.
		// ------------------------------------------------------------
		// collect changed outputs.
		this->update_map.clear();
		this->out_buffer.clear();
		for(int i=0;i<num;i++) if(out[i] != out_prev[i]) this->applyCellOutputChange(sorted_inds[i], out[i]);
		
		// gather remaining performance metrics.
		this->perf_n_updates += num;
		this->perf_n_outputs += out_buffer.size();
	}
};



