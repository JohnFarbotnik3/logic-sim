#include "../Imports.cpp"

struct SimulationLink {
	u32 data;
	
	SimulationLink() {}
	SimulationLink(u32 ind, u32 tgt) {
		this->data = (ind << 2) | tgt;
	}
	
	u32 get_ind() const { return this->data >> 2; }
	u32 get_tgt() const { return this->data & 0b11; }
	// NOTE: the extra ^const above is to indicate that item contents wont be mutated.
};

