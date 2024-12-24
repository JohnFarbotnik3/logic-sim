#ifndef _CellTypes
#define _CellTypes

#include "../Imports.cpp"
#include "./Colour.cpp"
#include <cassert>

struct CellType {
	String		typecode;
	u32			type;
	u32			numTargets;
	u32			taskOrder;
	Colour 		clr;

	CellType() {}
	CellType(std::string typecode, u32 type, u32 numTargets, u32 taskOrder, Colour clr) {
		this->typecode		= typecode;
		this->type			= type;
		this->clr			= clr;
		this->numTargets	= numTargets;
		this->taskOrder		= taskOrder;
		printf("CREATED CELL TYPE: %u\n", this->type);
		assert(taskOrder < 30);
		// TODO: verify that these typecodes match typecodes in javascript-side.
	}
};

static Map<u32, CellType> CELL_TYPES_MAP;
CellType addCellType(std::string typecode, u32 type, u32 numTargets, u32 taskOrder, Colour clr) {
	return CELL_TYPES_MAP[type] = CellType(typecode, type, numTargets, taskOrder, clr);
}
CellType addCellType(std::string typecode, u32 numTargets, u32 taskOrder, Colour clr) {
	u32 type = 0;
	for(int x=0;x<typecode.length();x++) type = (type << 8) | typecode[x];
	return addCellType(typecode, type, numTargets, taskOrder, clr);
}

static u32 NEXT_TASK_ORDER = 0;

struct _CELL_TYPES {
	const CellType CONSTANT	= addCellType("CNST", 1, NEXT_TASK_ORDER++, 0x4f7f7fff);
	const CellType COPY		= addCellType("COPY", 2, NEXT_TASK_ORDER++, 0x6f6f6fff);
	// bitwise operators
	const CellType OR		= addCellType("OR"	, 3, NEXT_TASK_ORDER++, 0xa2e4a2ff);
	const CellType XOR		= addCellType("XOR"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType NOT		= addCellType("NOT"	, 2, NEXT_TASK_ORDER++, 0xe65ce6ff);
	const CellType AND		= addCellType("AND"	, 3, NEXT_TASK_ORDER++, 0x7d887dff);
	const CellType LSHIFT	= addCellType("LSH"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType RSHIFT	= addCellType("RSH"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	// arithmetic & comparison
	// TODO: add NOTEQUALS
	const CellType ADD		= addCellType("+"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType SUB		= addCellType("-"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType MULT		= addCellType("x"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType DIV		= addCellType("÷",247,3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType GTH		= addCellType(">"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType LTH		= addCellType("<"	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType EQUALS	= addCellType("=="	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType GEQ		= addCellType(">="	, 3, NEXT_TASK_ORDER++, 0xffffffff);
	const CellType LEQ		= addCellType("<="	, 3, NEXT_TASK_ORDER++, 0xffffffff);
};
static const _CELL_TYPES CELL_TYPES;

static const u32 NUM_CELL_TYPES = NEXT_TASK_ORDER;

#endif
