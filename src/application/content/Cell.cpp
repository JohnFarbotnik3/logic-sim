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
		//printf("CTYPE: %u\n", this->type);
		assert(CELL_TYPES_MAP.contains(this->type));
		const CellType ctype = CELL_TYPES_MAP.at(this->type);
		this->tran			= this->dim.getTransformation();
		this->typecode		= ctype.typecode;
		this->clr			= ctype.clr;
		this->numTargets	= ctype.numTargets;
		this->taskOrder		= ctype.taskOrder;
		assert(ctype.taskOrder < NUM_CELL_TYPES);
		assert(this->taskOrder < NUM_CELL_TYPES);
	}
};

#endif
