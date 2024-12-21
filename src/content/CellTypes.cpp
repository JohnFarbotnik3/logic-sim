#ifndef _CellTypes
#define _CellTypes

#include "../Imports.cpp"
#include "./Colour.cpp"

struct CellType {
	String		typecode;
	u32			type;
	u32			numTargets;
	Colour 		clr;
	u32			taskOrder;
	
	static u32	NEXT_TASK_ORDER;
	
	CellType() {}
	CellType(std::string typecode, uint32_t numTargets, Colour clr) {
		this->typecode		= typecode;
		this->type			= 0;
		this->clr			= clr;
		this->numTargets	= numTargets;
		this->taskOrder		= CellType::NEXT_TASK_ORDER++;
		for(int x=0;x<4;x++) this->type = (this->type << 8) | (typecode.length() > x ? typecode[x] : 0);
	}
};

u32 CellType::NEXT_TASK_ORDER = 0;

Map<uint32_t, CellType> CELL_TYPES_MAP;
CellType addCellType(std::string typecode, Colour clr, uint32_t numTargets) {
	CellType ctype(typecode, numTargets, clr);
	CELL_TYPES_MAP[ctype.type] = ctype;
	return ctype;
}

struct _CELL_TYPES {
	const CellType CONSTANT	= addCellType("CNST", 1, 0x4f7f7fff);
	const CellType COPY		= addCellType("COPY", 2, 0x6f6f6fff);
	// bitwise operators
	const CellType OR		= addCellType("OR"	, 3, 0xa2e4a2ff);
	const CellType XOR		= addCellType("XOR"	, 3, 0xffffffff);
	const CellType NOT		= addCellType("NOT"	, 2, 0xe65ce6ff);
	const CellType AND		= addCellType("AND"	, 3, 0x7d887dff);
	const CellType LSHIFT	= addCellType("LSH"	, 3, 0xffffffff);
	const CellType RSHIFT	= addCellType("RSH"	, 3, 0xffffffff);
	// arithmetic & comparison
	// TODO: add NOTEQUALS
	const CellType ADD		= addCellType("+"	, 3, 0xffffffff);
	const CellType SUB		= addCellType("-"	, 3, 0xffffffff);
	const CellType MULT		= addCellType("x"	, 3, 0xffffffff);
	const CellType DIV		= addCellType("÷"	, 3, 0xffffffff);
	const CellType GTH		= addCellType(">"	, 3, 0xffffffff);
	const CellType LTH		= addCellType("<"	, 3, 0xffffffff);
	const CellType EQUALS	= addCellType("=="	, 3, 0xffffffff);
	const CellType GEQ		= addCellType(">="	, 3, 0xffffffff);
	const CellType LEQ		= addCellType("<="	, 3, 0xffffffff);
};
static const _CELL_TYPES CELL_TYPES;

#endif
