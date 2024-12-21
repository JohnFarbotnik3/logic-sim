#ifndef _Cell
#define _Cell

#include "./CellTypes.cpp"
#include "./ItemDim.cpp"
#include "./ItemId.cpp"

struct Cell {
	ItemDim	dim;
	ItemId	id;
	u32		type;
	u32		value;
	
	Cell() {}
	Cell(u32 type, u32 value) {
		this->dim	= ItemDim(0,0,1,1,0);
		this->id	= ItemId::next();
		this->type	= type;
		this->value	= value;
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
		this->tran			= this->dim.getTransformation();
		this->typecode		= CELL_TYPES_MAP[this->type].typecode;
		this->clr			= CELL_TYPES_MAP[this->type].clr;
		this->numTargets	= CELL_TYPES_MAP[this->type].numTargets;
		this->taskOrder		= CELL_TYPES_MAP[this->type].taskOrder;
	}
};

#endif
