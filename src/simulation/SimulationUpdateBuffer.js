
class SimulationUpdateBuffer {
	// ============================================================
	// Direct accessors.
	// ------------------------------------------------------------
	
	/*
	static ITEM_LENGTH =          3;
	get    ITEM_LENGTH() { return 3; }
	get_ind(i) { return this.data[i*this.ITEM_LENGTH + 0]; }
	get_tgt(i) { return this.data[i*this.ITEM_LENGTH + 1]; }
	get_val(i) { return this.data[i*this.ITEM_LENGTH + 2]; }
	set_all(i, ind, tgt, val) {
		this.data[i*this.ITEM_LENGTH + 0] = ind;
		this.data[i*this.ITEM_LENGTH + 1] = tgt;
		this.data[i*this.ITEM_LENGTH + 2] = val;
	}
	//*/
	///*
	static ITEM_LENGTH =          2;
	get    ITEM_LENGTH() { return 2; }
	get_ind(i) { return this.data[i*this.ITEM_LENGTH + 0] >>> 2; }
	get_tgt(i) { return this.data[i*this.ITEM_LENGTH + 0] & 0b11; }
	get_val(i) { return this.data[i*this.ITEM_LENGTH + 1]; }
	set_all(i, ind, tgt, val) {
		this.data[i*this.ITEM_LENGTH + 0] = (ind << 2) | (tgt & 0b11);
		this.data[i*this.ITEM_LENGTH + 1] = val;
	}
	//*/
	
	// ============================================================
	// Standard features.
	// ------------------------------------------------------------
	
	clear() {
		this.count = 0;
	}
	
	// ============================================================
	// Structors.
	// ------------------------------------------------------------
	
	constructor(capacity) {
		this.data		= new Uint32Array(capacity * this.ITEM_LENGTH);
		this.capacity	= capacity;
		this.count		= 0;// current number of items.
	}
	
	// ============================================================
	// Application specific functions.
	// ------------------------------------------------------------
	
	push_fast(ind, tgt, val) {
		this.set_all(this.count++, ind, tgt, val);
	}
	
	applyUpdates(cell_buffer) {
		for(let i=0;i<this.count;i++) {
			cell_buffer.setCellValue(this.get_ind(i), this.get_tgt(i), this.get_val(i));
		}
	}
};



