
struct SimulationLink {
	u32 data;
	
	SimulationLink() {}
	SimulationLink(u32 ind, u32 tgt) {
		this->data = (ind << 2) | tgt;
	}
	
	get_ind() { return this.data >> 2; }
	get_tgt() { return this.data & 0b11; }
};

