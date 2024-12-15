
const CELLS_PER_TASK = 16*1024;// Default: 16*1024

const TASK_CELL_TYPE_ORDER_ARR = [
	CELL_PROPERTIES.CONSTANT,
	CELL_PROPERTIES.COPY,
	// bitwise operators
	CELL_PROPERTIES.OR,
	CELL_PROPERTIES.XOR,
	CELL_PROPERTIES.NOT,
	CELL_PROPERTIES.AND,
	CELL_PROPERTIES.LSHIFT,
	CELL_PROPERTIES.RSHIFT,
	// arithmetic & comparison
	CELL_PROPERTIES.ADD,
	CELL_PROPERTIES.SUB,
	CELL_PROPERTIES.MULT,
	CELL_PROPERTIES.DIV,
	CELL_PROPERTIES.GTH,
	CELL_PROPERTIES.LTH,
	CELL_PROPERTIES.EQUALS,
	CELL_PROPERTIES.GEQ,
	CELL_PROPERTIES.LEQ,
];
const TASK_CELL_TYPE_ORDER_MAP = new Map(TASK_CELL_TYPE_ORDER_ARR.map((props, i) => [props.type, i]));


/*
	Simulation data is split into batches, i.e. "Tasks",
	where threads can update a small group of cells independently,
	and then produce some output data that the parent thread gathers
	when all tasks are complete. 
*/
class SimulationTask {
	// ==================================================
	// Structors
	// --------------------------------------------------
	
	constructor(ibeg, iend, link_count) {
		/* Cell index range */
		this.ibeg = ibeg;
		this.iend = iend;
		const cell_count = iend - ibeg;
		/* Cells that belong to this task. */
		this.cell_buffer = new SimulationCellBuffer(cell_count);
		/* Variable-length link lists that belong to cells, gathered into a single array. */
		this.link_buffer = new SimulationLinkBuffer(link_count);
		/* List of updates to send to cells outside of this task. */
		this.out_buffer = new SimulationUpdateBuffer(link_count);
		/* Index-associated Set of booleans for ensuring update-indices are only added once. */
		this.update_added = new Uint8Array(cell_count).fill(0);
		/* List of (local) cell indices to update. */
		this.update_stack = new Uint32Array(cell_count);
		/* Number of cells to update during next cycle. */
		this.update_count = 0;
		/* Performance metrics. */
		this.perf_n_updates = 0;
		this.perf_n_outputs = 0;
	}
	
	// ==================================================
	// Helpers.
	// --------------------------------------------------
	
	/* Update cell value and add to list of cells to update during next cycle. */
	pushCellUpdate(ind, tgt, val) {
		const x = ind - this.ibeg;// convert to local index.
		this.cell_buffer.setCellValue(x, tgt, val);
		if(this.update_added[x] !== 1) {
			this.update_added[x] = 1;
			this.update_stack[this.update_count++] = x;
		}
	}
	
	/* Set the new output value of a cell, and notify output targets. */
	applyCellOutputChange(cellInd, val) {
		const len = this.cell_buffer.get_links_len(cellInd);
		const ofs = this.cell_buffer.get_links_ofs(cellInd);
		// write changed value to cell.
		this.cell_buffer.setCellValue(cellInd, 0x0/*Cell.LINK_TARGET.OUTPUT*/, val);
		// push update-values for output targets.
		for(let k=0;k<len;k++) {
			const ind = this.link_buffer.get_ind(ofs+k);
			const tgt = this.link_buffer.get_tgt(ofs+k);
			if((this.ibeg <= ind) & (ind < this.iend))
					this.pushCellUpdate(ind, tgt, val);
			else	this.out_buffer.push_fast(ind, tgt, val);
		}
	}
	
	/* Initialize and propagate cell value. */
	initializeCellValue(ind, val) {
		// push cell update containing initial value.
		this.pushCellUpdate(ind, Cell.LINK_TARGET.OUTPUT, val);
		// special handling for constants: manually propagate (since constants do not update normally).
		const x = ind - this.ibeg;
		if(this.cell_buffer.get_cell_order(x) === TASK_CELL_TYPE_ORDER_MAP.get(CELL_PROPERTIES.CONSTANT.type)) {
			this.applyCellOutputChange(x, val);
		}
	}
	
	/* Empty out list of update-indices. */
	clearCellUpdateList() {
		// NOTE: per-update is O(N) whereas array.fill is O(LENGTH >= N).
		for(let x=0;x<this.update_count;x++) this.update_added[this.update_stack[x]] = 0;
		this.update_count = 0;
	}
	
	// ==================================================
	// Update Cycle.
	// --------------------------------------------------
	
	/* Perform an update cycle. */
	update() {
		
		if(this.update_count <= 0) return;
		
		const cell_buffer = this.cell_buffer;
		const link_buffer = this.link_buffer;
		const out_buffer = this.out_buffer;
		
		// ============================================================
		// Sort inputs.
		// ------------------------------------------------------------
		// sort update indices into buckets based on cell type (bucket sort).
		const num = this.update_count;
		const counts  = new Uint32Array(TASK_CELL_TYPE_ORDER_ARR.length);
		const offsets = new Uint32Array(TASK_CELL_TYPE_ORDER_ARR.length);
		const sorted_inds = new Uint32Array(num);
		
		for(let x=0;x<num;x++) {
			const ind = this.update_stack[x];
			const bucket = cell_buffer.get_cell_order(ind);
			counts[bucket]++;
		}
		
		let sum=0;
		for(let x=0;x<TASK_CELL_TYPE_ORDER_ARR.length;x++) { offsets[x]=sum; sum+=counts[x]; }
		
		for(let x=0;x<num;x++) {
			const ind = this.update_stack[x];
			const bucket = cell_buffer.get_cell_order(ind);
			sorted_inds[offsets[bucket]++] = ind;
		}
		
		// ============================================================
		// Compute values.
		// ------------------------------------------------------------
		// gather input values.
		const inputA_values = new Uint32Array(num);
		const inputB_values = new Uint32Array(num);
		const old_outputs   = new Uint32Array(num);
		const new_outputs   = new Uint32Array(num);
		for(let x=0;x<num;x++) {
			const ci = sorted_inds[x];
			old_outputs[x]   = cell_buffer.get_value_out(ci);
			inputA_values[x] = cell_buffer.get_value_ina(ci);
			inputB_values[x] = cell_buffer.get_value_inb(ci);
		}
		
		// compute output values.
		let x=0;
		let X=0;
		X+=counts[ 0];
		X+=counts[ 1];	for(;x<X;x++) { new_outputs[x] = inputA_values[x]; }
		
		X+=counts[ 2];	for(;x<X;x++) { new_outputs[x] =   inputA_values[x] |  inputB_values[x]; }
		X+=counts[ 3];	for(;x<X;x++) { new_outputs[x] =   inputA_values[x] ^  inputB_values[x]; }
		X+=counts[ 4];	for(;x<X;x++) { new_outputs[x] = ~(inputA_values[x]); }
		X+=counts[ 5];	for(;x<X;x++) { new_outputs[x] =   inputA_values[x] &  inputB_values[x]; }
		X+=counts[ 6];	for(;x<X;x++) { new_outputs[x] =   inputA_values[x] << inputB_values[x]; }
		X+=counts[ 7];	for(;x<X;x++) { new_outputs[x] =   inputA_values[x] >> inputB_values[x]; }
		
		X+=counts[ 8];	for(;x<X;x++) { new_outputs[x] =  inputA_values[x] +  inputB_values[x]; }
		X+=counts[ 9];	for(;x<X;x++) { new_outputs[x] =  inputA_values[x] -  inputB_values[x]; }
		X+=counts[10];	for(;x<X;x++) { new_outputs[x] =  inputA_values[x] *  inputB_values[x]; }
		X+=counts[11];	for(;x<X;x++) { new_outputs[x] =  inputA_values[x] /  Math.max(inputB_values[x], 0x1); }
		X+=counts[12];	for(;x<X;x++) { new_outputs[x] = (inputA_values[x] >  inputB_values[x]) * 0xffffffff; }
		X+=counts[13];	for(;x<X;x++) { new_outputs[x] = (inputA_values[x] <  inputB_values[x]) * 0xffffffff; }
		X+=counts[14];	for(;x<X;x++) { new_outputs[x] = (inputA_values[x] == inputB_values[x]) * 0xffffffff; }
		X+=counts[15];	for(;x<X;x++) { new_outputs[x] = (inputA_values[x] >= inputB_values[x]) * 0xffffffff; }
		X+=counts[16];	for(;x<X;x++) { new_outputs[x] = (inputA_values[x] <= inputB_values[x]) * 0xffffffff; }
		
		// ============================================================
		// Collect outputs.
		// ------------------------------------------------------------
		// collect changed outputs.
		this.clearCellUpdateList();
		out_buffer.clear();
		for(let i=counts[0];i<num;i++) {
			if(new_outputs[i] !== old_outputs[i]) {
				this.applyCellOutputChange(sorted_inds[i], new_outputs[i]);
			}
		}
		
		// gather remaining performance metrics.
		this.perf_n_updates += num;
		this.perf_n_outputs += out_buffer.count;
	}
	
};



