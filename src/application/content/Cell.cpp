#ifndef _Cell
#define _Cell

#include "./CellTypes.cpp"
#include "./ItemId.cpp"
#include "./ItemDim.cpp"
#include "./ItemClr.cpp"

struct Cell {
	ItemDim	dim;
	ItemId	id;
	u32		type;
	u32		value;

	// type properties.
	String	typeString;
	ItemClr clr;
	u32 	numTargets;
	u32		taskOrder;
	void initTypeProperties() {
		assert(CELL_TYPES_MAP.contains(this->type));
		const CellType ctype = CELL_TYPES_MAP.at(this->type);
		this->typeString	= ctype.typeString;
		this->clr			= ctype.clr;
		this->numTargets	= ctype.numTargets;
		this->taskOrder		= ctype.taskOrder;
		assert(ctype.taskOrder < NUM_CELL_TYPES);
		assert(this->taskOrder < NUM_CELL_TYPES);
	}
	
	Cell() = default;
	Cell(u32 type, u32 value) {
		this->id	= ItemId::next();
		this->dim	= ItemDim(0,0,1,1,0);
		this->type	= type;
		this->value	= value;
		initTypeProperties();
	}
	Cell(ItemId id, u32 type, u32 value, ItemDim dim) {
		this->id	= id;
		this->dim	= dim;
		this->type	= type;
		this->value	= value;
		initTypeProperties();
	}
	
	// ============================================================
	// Extra properties
	// ------------------------------------------------------------


};

#endif
