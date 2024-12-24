#include "./SimulationCell.cpp"
#include "./SimulationLink.cpp"
#include "./SimulationUpdate.cpp"
#include "./SimulationArrayMap.cpp"
#include "../content/Link.cpp"
#include "../content/CellTypes.cpp"
#include <cassert>

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
	
	SimulationTask(
		const Vector<SimulationCell>& cellbuf,
		const Vector<SimulationLink>& linkbuf,
		u32 cell_ibeg,
		u32 cell_iend
	) {
		// count total number of items.
		u32 cell_count = cell_iend - cell_ibeg;
		u32 link_count = 0;
		for(u32 i=cell_ibeg;i<cell_iend;i++) link_count += cellbuf[i].links_len;
		// initialize buffers.
		this->cell_ibeg = cell_ibeg;
		this->cell_iend = cell_iend;
		this->cell_buffer.reserve(cell_count);
		this->link_buffer.reserve(link_count);
		this-> out_buffer.reserve(link_count);
		this->update_map.clear();
		this->perf_n_updates = 0;
		this->perf_n_outputs = 0;
		// copy cells to task-local buffer.
		for(u32 i=cell_ibeg;i<cell_iend;i++) {
			this->cell_buffer.push_back(cellbuf[i]);
			assert(cell_buffer[i-cell_ibeg].task_order < NUM_CELL_TYPES);
			//printf("INIT ORDER: %u\n", this->cell_buffer[i-cell_ibeg].task_order);
		}
		// copy links to task-local buffer, and update cell list pointers.
		for(u32 i=cell_ibeg;i<cell_iend;i++)  {
			const u32 len = cellbuf[i].links_len;
			const u32 ofs = cellbuf[i].links_ofs;
			const u32 x = i - cell_ibeg;
			this->cell_buffer[x].links_ofs = this->link_buffer.size();
			for(int k=0;k<len;k++) {
				this->link_buffer.push_back(linkbuf[ofs + k]);
			}
		}
	}
	
	bool shouldUpdate() { return this->update_map.count > 0; }
	u32  toLocalIndex(u32 ind) const { return ind - this->cell_ibeg; }
	u32 toGlobalIndex(u32 ind) const { return ind + this->cell_ibeg; }
	
	/* Update cell value and add to list of cells to update during next cycle. */
	void pushCellUpdate(u32 ind, u32 tgt, u32 val) {
		const u32 x = toLocalIndex(ind);
		this->cell_buffer[x].setValue(tgt, val);
		this->update_map.add(x);
	}
	void pushCellUpdate(SimulationUpdate& upd) {
		const u32 x = toLocalIndex(upd.get_ind());
		this->cell_buffer[x].setValue(upd.get_tgt(), upd.val);
		this->update_map.add(x);
	}

	void propagateOutputChange(u32 x, u32 val) {
		const u32 len = this->cell_buffer[x].links_len;
		const u32 ofs = this->cell_buffer[x].links_ofs;
		for(u32 k=0;k<len;k++) {
			const u32 ind = this->link_buffer[ofs+k].get_ind();
			const u32 tgt = this->link_buffer[ofs+k].get_tgt();
			const bool isLocal = (this->cell_ibeg <= ind) & (ind < this->cell_iend);
			if(isLocal)	this->pushCellUpdate(ind, tgt, val);
			else		this->out_buffer.emplace_back(ind, tgt, val);
		}
	}
	
	/* Initialize and propagate cell value. */
	void initializeCellValue(u32 ind, u32 val) {
		const u32 x = toLocalIndex(ind);
		if(this->cell_buffer[x].task_order == CELL_TYPES.CONSTANT.taskOrder) {
			this->cell_buffer[x].setValue(LINK_TARGETS.OUTPUT, val);
			this->propagateOutputChange(x, val);
		} else {
			this->pushCellUpdate(ind, LINK_TARGETS.OUTPUT, val);
			this->propagateOutputChange(x, val);
		}
	}

	/* Modify cell value post-initialization. */
	void modifyCellValue(u32 ind, u32 val) {
		const u32 x = toLocalIndex(ind);
		this->cell_buffer[x].setValue(LINK_TARGETS.OUTPUT, val);
		this->propagateOutputChange(x, val);
	}

	
	/* Macro for setting loop interval for given cell type. */
	void loopConfig(int offsets[], int counts[], int& beg, int& end, const int& order) {
		beg = offsets[order];
		end = offsets[order] + counts[order];
	} 
	
	/* Perform an update cycle. */
	void update() {
		// ============================================================
		// Sort inputs.
		// ------------------------------------------------------------
		//printf("task sort\n");

		// bucket-sort local cell indices based on cell type.
		int offsets[NUM_CELL_TYPES];
		int counts [NUM_CELL_TYPES];
		for(int i=0;i<NUM_CELL_TYPES;i++) offsets[i] = 0;
		for(int i=0;i<NUM_CELL_TYPES;i++) counts [i] = 0;
		
		const int num = this->update_map.count;
		int sorted_inds[num];
		
		//for(int i=0;i<num;i++) printf("stack: %i\n", update_map.stack[i]);
		//for(int i=0;i<cell_buffer.size();i++) printf("order: %i\n", cell_buffer[i].task_order);

		for(int i=0;i<num;i++) {
			const u32 x = this->update_map.stack[i];
			const u32 bucket = cell_buffer[x].task_order;
			assert(bucket <NUM_CELL_TYPES);
			counts[bucket]++;
		}
		
		int sum=0;
		for(int x=0;x<NUM_CELL_TYPES;x++) { offsets[x]=sum; sum+=counts[x]; }
		
		for(int i=0;i<num;i++) {
			const u32 x = this->update_map.stack[i];
			const u32 bucket = cell_buffer[x].task_order;
			sorted_inds[offsets[bucket]++] = x;
		}
		
		// reset offsets for later use.
		for(int x=0;x<NUM_CELL_TYPES;x++) { offsets[x] -= counts[x]; }
		
		// ============================================================
		// Compute values.
		// ------------------------------------------------------------
		// gather input values.
		u32 out_prev[num];
		u32 out[num];
		u32 ina[num];
		u32 inb[num];
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
		loopConfig(offsets, counts, b, e, CELL_TYPES.CONSTANT.taskOrder);	for(int x=b;x<e;x++) { out[x] = out_prev[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.COPY	.taskOrder);	for(int x=b;x<e;x++) { out[x] = ina[x]; }
		// bitwise operators
		loopConfig(offsets, counts, b, e, CELL_TYPES.OR		.taskOrder);	for(int x=b;x<e;x++) { out[x] =   ina[x] |  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.XOR	.taskOrder);	for(int x=b;x<e;x++) { out[x] =   ina[x] ^  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.NOT	.taskOrder);	for(int x=b;x<e;x++) { out[x] = ~(ina[x]); }
		loopConfig(offsets, counts, b, e, CELL_TYPES.AND	.taskOrder);	for(int x=b;x<e;x++) { out[x] =   ina[x] &  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.LSHIFT	.taskOrder);	for(int x=b;x<e;x++) { out[x] =   ina[x] << inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.RSHIFT	.taskOrder);	for(int x=b;x<e;x++) { out[x] =   ina[x] >> inb[x]; }
		// arithmetic & comparison
		loopConfig(offsets, counts, b, e, CELL_TYPES.ADD	.taskOrder);	for(int x=b;x<e;x++) { out[x] =  ina[x] +  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.SUB	.taskOrder);	for(int x=b;x<e;x++) { out[x] =  ina[x] -  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.MULT	.taskOrder);	for(int x=b;x<e;x++) { out[x] =  ina[x] *  inb[x]; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.DIV	.taskOrder);	for(int x=b;x<e;x++) { out[x] =  ina[x] /  std::max<u32>(inb[x], 0x1); }
		loopConfig(offsets, counts, b, e, CELL_TYPES.GTH	.taskOrder);	for(int x=b;x<e;x++) { out[x] = (ina[x] >  inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.LTH	.taskOrder);	for(int x=b;x<e;x++) { out[x] = (ina[x] <  inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.EQUALS	.taskOrder);	for(int x=b;x<e;x++) { out[x] = (ina[x] == inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.GEQ	.taskOrder);	for(int x=b;x<e;x++) { out[x] = (ina[x] >= inb[x]) ? 0xffffffff : 0x0; }
		loopConfig(offsets, counts, b, e, CELL_TYPES.LEQ	.taskOrder);	for(int x=b;x<e;x++) { out[x] = (ina[x] <= inb[x]) ? 0xffffffff : 0x0; }
		}
		
		// ============================================================
		// Collect outputs.
		// ------------------------------------------------------------
		//printf("task collect\n");

		// collect changed outputs.
		this->update_map.clear();
		this->out_buffer.clear();
		for(int i=0;i<num;i++) if(out[i] != out_prev[i]) {
			const u32 x = sorted_inds[i];
			const u32 val = out[i];
			this->cell_buffer[x].setValue(LINK_TARGETS.OUTPUT, val);
			this->propagateOutputChange(x, val);
		}
		
		// gather remaining performance metrics.
		this->perf_n_updates += num;
		this->perf_n_outputs += out_buffer.size();
		//printf("<> task updates: %i \n", num);
		//printf("<> task outputs: %lu\n", out_buffer.size());
		//printf("<> task uinputs: %i \n", this->update_map.count);
	}
};



