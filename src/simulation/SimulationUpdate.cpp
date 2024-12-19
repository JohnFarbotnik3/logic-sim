
struct SimulationUpdate {
	u32 data;
	u32 val;
	
	SimulationLink() {}
	SimulationLink(u32 ind, u32 tgt, u32 val) {
		this->data = (ind << 2) | tgt;
		this->val = val;
	}
	
	get_ind() { return this.data >> 2; }
	get_tgt() { return this.data & 0b11; }
};

