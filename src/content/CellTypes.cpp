#include "../Imports.cpp"
#include "./Colour.cpp"

struct CellType {
	String		typecode;
	u32			type;
	u32			numTargets;
	Colour 		clr;
	
	CellType() {}
	CellType(std::string typecode, uint32_t numTargets, Colour clr) {
		this->typecode		= typecode;
		this->type			= 0;
		this->clr			= clr;
		this->numTargets	= numTargets;
		for(int x=0;x<4;x++) this->type = (this->type << 8) | (typecode.length() > x ? typecode[x] : 0);
	}
};

Map<uint32_t, CellType> CELL_TYPES_MAP;
CellType addCellType(std::string typecode, Colour clr, uint32_t numTargets) {
	CellType ctype(typecode, clr, numTargets);
	CELL_TYPES_MAP[ctype.type] = ctype;
	return ctype;
}

struct CELL_TYPES {
	CellType CONSTANT	= addCellType("CNST", 1, 0x4f7f7fff);
	CellType COPY		= addCellType("COPY", 2, 0x6f6f6fff);
	// bitwise operators
	CellType OR			= addCellType("OR"	, 3, 0xa2e4a2ff);
	CellType XOR		= addCellType("XOR"	, 3, 0xffffffff);
	CellType NOT		= addCellType("NOT"	, 2, 0xe65ce6ff);
	CellType AND		= addCellType("AND"	, 3, 0x7d887dff);
	CellType LSHIFT		= addCellType("LSH"	, 3, 0xffffffff);
	CellType RSHIFT		= addCellType("RSH"	, 3, 0xffffffff);
	// arithmetic & comparison
	// TODO: add NOTEQUALS
	CellType ADD		= addCellType("+"	, 3, 0xffffffff);
	CellType SUB		= addCellType("-"	, 3, 0xffffffff);
	CellType MULT		= addCellType("x"	, 3, 0xffffffff);
	CellType DIV		= addCellType("÷"	, 3, 0xffffffff);
	CellType GTH		= addCellType(">"	, 3, 0xffffffff);
	CellType LTH		= addCellType("<"	, 3, 0xffffffff);
	CellType EQUALS		= addCellType("=="	, 3, 0xffffffff);
	CellType GEQ		= addCellType(">="	, 3, 0xffffffff);
	CellType LEQ		= addCellType("<="	, 3, 0xffffffff);
};

