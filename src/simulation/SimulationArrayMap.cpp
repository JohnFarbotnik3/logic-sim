#include "../Imports.cpp"
#include "../Constants.cpp"

struct SimulationArrayMap {
	/* Number of indices in stack. */
	u32		count;
	/* Index-associated Set of booleans for ensuring indices are only added once. */
	bool	added[CELLS_PER_TASK];
	/* List of indices. */
	u32		stack[CELLS_PER_TASK];
	
	SimulationArrayMap() {
		count = 0;
		for(int x=0;x<CELLS_PER_TASK;x++) added[x] = false;
	}
	
	void add(int i) {
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

