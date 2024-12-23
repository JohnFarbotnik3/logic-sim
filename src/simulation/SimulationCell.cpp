#include "../Imports.cpp"
#include "../content/CellTypes.cpp"

struct SimulationCell {
	/* Cell values. */
	u32 values[3];
	/* Cell type/order is used for sorting cells into intervals of common cell-type. */
	u32 task_order;
	/* Length and offset of output-link list in shared link data. */
	u32 links_len;
	u32 links_ofs;
	
	SimulationCell() {}
	SimulationCell(u32 value, u32 order) {
		this->values[0] = value;
		this->values[1] = 0;
		this->values[2] = 0;
		this->task_order = order;
		this->links_len = 0;
		this->links_ofs = 0;
		assert(order < NUM_CELL_TYPES);
	}
	
	void setValue(u32 tgt, u32 val) {
		this->values[tgt] = val;
	}
};

