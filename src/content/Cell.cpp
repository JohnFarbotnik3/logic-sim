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
	// Extra properties
	// ------------------------------------------------------------
	Transformation2D	tran;
	String				typecode;
	Colour 				clr;
	u32 				numTargets;
	u32					taskOrder;
	
	void initProperties() {
		this->tran			= this->dimensions.getTransformation();
		this->typecode		= CELL_TYPES_MAP[this->type].typecode;
		this->clr			= CELL_TYPES_MAP[this->type].clr;
		this->numTargets	= CELL_TYPES_MAP[this->type].numTargets;
		this->taskOrder		= TASK_CELL_TYPE_ORDER_MAP[this->type];
	}
};



