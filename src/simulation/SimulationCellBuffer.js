
class SimulationCellBuffer {
	// ============================================================
	// Direct accessors.
	// ------------------------------------------------------------
	
	static ITEM_LENGTH =          6;
	get    ITEM_LENGTH() { return 6; }
	/* Cell values. */
	get_value_out(i) { return this.data[i*this.ITEM_LENGTH + 0]; }
	set_value_out(i, value) { this.data[i*this.ITEM_LENGTH + 0] = value; }
	get_value_ina(i) { return this.data[i*this.ITEM_LENGTH + 1]; }
	get_value_inb(i) { return this.data[i*this.ITEM_LENGTH + 2]; }
	/* Cell type/order is used for sorting cells into intervals of common cell-type. */
	get_cell_order(i) { return this.data[i*this.ITEM_LENGTH + 3]; }
	/* Length and offset of output-link list in shared link data. */
	get_links_len(i) { return this.data[i*this.ITEM_LENGTH + 4]; }
	set_links_len(i, value) { this.data[i*this.ITEM_LENGTH + 4] = value; }
	get_links_ofs(i) { return this.data[i*this.ITEM_LENGTH + 5]; }
	set_links_ofs(i, value) { this.data[i*this.ITEM_LENGTH + 5] = value; }
	/* Initialize cell. */
	set_all(i, vo, va, vb, ct, ll, lo) {
		const ofs = i*this.ITEM_LENGTH;
		this.data[ofs + 0] = vo;
		this.data[ofs + 1] = va;
		this.data[ofs + 2] = vb;
		this.data[ofs + 3] = ct;
		this.data[ofs + 4] = ll;
		this.data[ofs + 5] = lo;
	}
	
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
	
	/* Access cell value directly using value-pointer. */
	setCellValue(ind, tgt, value) { this.data[ind * this.ITEM_LENGTH + tgt] = value; }
	getCellValue(ind, tgt) { return this.data[ind * this.ITEM_LENGTH + tgt]; }
	
	/* Set length and location of link list. */
	setLinkList(i, len, ofs) {
		this.set_links_len(i, len);
		this.set_links_ofs(i, ofs);
	}
	
};



