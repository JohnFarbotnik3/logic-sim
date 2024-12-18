
struct SimulationCell {
	/* Cell values. */
	u32 value_out;
	u32 value_ina;
	u32 value_inb;
	/* Cell type/order is used for sorting cells into intervals of common cell-type. */
	u32 task_order;
	/* Length and offset of output-link list in shared link data. */
	u32 links_len;
	u32 links_ofs;
	
	SimulationCell() {}
	SimulationCell(u32 value, u32 order) {
		this->value_out = value;
		this->value_ina = 0;
		this->value_inb = 0;
		this->task_order = order;
		this->links_len = 0;
		this->links_ofs = 0;
	}
};

