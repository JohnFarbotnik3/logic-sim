#include "./CellTypes.cpp"
#include "./ComponentDimensions.cpp"
#include "./ComponentId.cpp"

struct Cell {
	ComponentDimensions	dimensions;
	ComponentId			id;
	u32					type;
	u32					value;
	
	Cell() {
		this->dimensions	= ComponentDimensions(0,0,1,1,0);
		this->id			= ComponentId::NONE;
		this->type			= 0;
		this->value			= 0;
	}
	Cell(u32 type, u32 value) {
		this->dimensions	= ComponentDimensions(0,0,1,1,0);
		this->id			= ComponentId::next();
		this->type			= type;
		this->value			= value;
	}
	
	// ============================================================
	// Extra cell properties
	// ------------------------------------------------------------
	Colour 	clr;
	String	typecode;
	u32 	numTargets;
	
	void initProperties() {
		this->clr			= CELL_TYPES_MAP[this->type].clr;
		this->typecode		= CELL_TYPES_MAP[this->type].typecode;
		this->numTargets	= CELL_TYPES_MAP[this->type].numTargets;
	}
};

