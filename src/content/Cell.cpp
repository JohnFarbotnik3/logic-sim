#include "./CellTypes.cpp"
#include "./ComponentDimensions.cpp"
#include "./ComponentId.cpp"

struct Cell {
	ComponentDimensions	dimensions;
	ComponentId			id;
	uint32_t			type;
	uint32_t			value;
	
	Cell() {
		this->dimensions	= ComponentDimensions(0,0,1,1,0);
		this->id			= ComponentId::NONE;
		this->type			= 0;
		this->value			= 0;
	}
	Cell(uint32_t type, uint32_t value) {
		this->dimensions	= ComponentDimensions(0,0,1,1,0);
		this->id			= ComponentId::next();
		this->type			= type;
		this->value			= value;
	}
	
	Colour clr() {
		return CELL_TYPES_MAP[this->type].clr;
	}
	std::string typecode() {
		return CELL_TYPES_MAP[this->type].typecode;
	}
	uint32_t numTargets() {
		return CELL_TYPES_MAP[this->type].numTargets;
	}
};

