#include "../Imports.cpp"

struct SimulationUpdate {
	u32 data;
	u32 val;
	
	SimulationUpdate() {}
	SimulationUpdate(u32 ind, u32 tgt, u32 val) {
		this->data = (ind << 2) | tgt;
		this->val = val;
	}
	
	u32 get_ind() { return this->data >> 2; }
	u32 get_tgt() { return this->data & 0b11; }
};

