#include "../Imports.cpp"
#include "../Constants.cpp"

struct SimulationArrayMap {
	/* Number of indices in stack. */
	u32 count;
	/* List of indices. */
	Array<u32, CELLS_PER_TASK> stack;
	/* Index-associated Set of booleans for ensuring indices are only added once. */
	Array<bool, CELLS_PER_TASK> added;

	SimulationArrayMap() {
		count = 0;
		for(int x=0;x<CELLS_PER_TASK;x++) added[x] = false;
	}
	
	void add(u32 i) {
		if(!this->added[i]) {
			this->added[i] = true;
			this->stack[this->count++] = i;
		}
	}
	
	void clear() {
		for(int x=0;x<this->count;x++) this->added[this->stack[x]] = false;
		this->count = 0;
	}
};

