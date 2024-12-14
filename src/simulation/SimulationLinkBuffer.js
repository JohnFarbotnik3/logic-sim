
class SimulationLinkBuffer {
	// ============================================================
	// Direct accessors.
	// ------------------------------------------------------------
	/*
	static ITEM_LENGTH =          2;
	get    ITEM_LENGTH() { return 2; }
	get_ind(i) { return this.data[i*this.ITEM_LENGTH + 0]; }
	get_tgt(i) { return this.data[i*this.ITEM_LENGTH + 1]; }
	set_all(i, ind, tgt) {
		this.data[i*this.ITEM_LENGTH + 0] = ind;
		this.data[i*this.ITEM_LENGTH + 1] = tgt;
	}
	//*/
	///*
	static ITEM_LENGTH =          1;
	get    ITEM_LENGTH() { return 1; }
	get_ind(i) { return this.data[i*this.ITEM_LENGTH + 0] >>> 2; }
	get_tgt(i) { return this.data[i*this.ITEM_LENGTH + 0] & 0b11; }
	set_all(i, ind, tgt) {
		this.data[i*this.ITEM_LENGTH + 0] = (ind << 2) | (tgt & 0b11);
	}
	//*/
	
	// ============================================================
	// Standard features.
	// ------------------------------------------------------------
	
	clear() {
		this.count = 0;
	}
	copyFrom(other, idst, isrc) {
		const LEN = this.ITEM_LENGTH;
		for(let x=0;x<LEN;x++) this.data[idst*LEN + x] = other.data[isrc*LEN + x];
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
	
	isMatch(i, ind, tgt) {
		return (this.get_ind(i) === ind) & (this.get_tgt(i) === tgt);
	}
	
};



