#include <cstdint>
#include <string>
#include <map>
#include "./Colour.cpp"

struct CellType {
	std::string	typecode;
	uint32_t	type;
	Colour 		clr;
	uint32_t	numTargets;
	
	CellType() {}
	CellType(std::string typecode, Colour clr, uint32_t numTargets) {
		this->typecode		= typecode;
		this->type			= 0;
		this->clr			= clr;
		this->numTargets	= numTargets;
		for(int x=0;x<4;x++) this->type = (this->type << 8) | (typecode.length() > x ? typecode[x] : 0);
	}
};

std::map<uint32_t, CellType> CELL_TYPES_MAP;
CellType addCellType(std::string typecode, Colour clr, uint32_t numTargets) {
	CellType ctype(typecode, clr, numTargets);
	CELL_TYPES_MAP[ctype.type] = ctype;
	return ctype;
}

struct CELL_TYPES {
	CellType CONSTANT	= addCellType("CNST", 0x4f7f7fff, 1);
	CellType COPY		= addCellType("COPY", 0x6f6f6fff, 2);
	// bitwise operators
	CellType OR			= addCellType("OR"	, 0xa2e4a2ff, 3);
	CellType XOR		= addCellType("XOR"	, 0xffffffff, 3);
	CellType NOT		= addCellType("NOT"	, 0xe65ce6ff, 2);
	CellType AND		= addCellType("AND"	, 0x7d887dff, 3);
	CellType LSHIFT		= addCellType("LSH"	, 0xffffffff, 3);
	CellType RSHIFT		= addCellType("RSH"	, 0xffffffff, 3);
	// arithmetic & comparison
	CellType ADD		= addCellType("+"	, 0xffffffff, 3);
	CellType SUB		= addCellType("-"	, 0xffffffff, 3);
	CellType MULT		= addCellType("x"	, 0xffffffff, 3);
	CellType DIV		= addCellType("÷"	, 0xffffffff, 3);
	CellType GTH		= addCellType(">"	, 0xffffffff, 3);
	CellType LTH		= addCellType("<"	, 0xffffffff, 3);
	CellType EQUALS		= addCellType("=="	, 0xffffffff, 3);
	CellType GEQ		= addCellType(">="	, 0xffffffff, 3);
	CellType LEQ		= addCellType("<="	, 0xffffffff, 3);
};

