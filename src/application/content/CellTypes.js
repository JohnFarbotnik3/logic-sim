
class CellProperties {
	static str_to_u32(str) {
		let val = 0x00000000;
		for(let i=0;i<str.length;i++) val = (val << 8) | (str.charCodeAt(i) & 0xff);
		return val;
	}
	static u32_to_str(val) {
		let arr = [];
		for(let i=0;i<4;i++) { arr.push(val & 0xff); val >>= 8; }
		let str = "";
		for(let i=0;i<4;i++) { str += String.fromCharCode(arr.pop()); }
		return str;
	}
	constructor(typeString, clr, name) {
		this.type	= CellProperties.str_to_u32(typeString);
		this.tstr	= typeString;
		this.clr	= clr;
		this.name	= name;
	}
};

export const CELL_PROPERTIES = ({
	CONSTANT	: new CellProperties("CNST"	, 0x4f7f7fff, "constant value"),
	COPY		: new CellProperties("COPY"	, 0x6f6f6fff, "copy value from input"),
	// bitwise operators
	OR			: new CellProperties("OR"	, 0xa2e4a2ff, "OR"),
	XOR			: new CellProperties("XOR"	, 0xffffffff, "XOR"),
	NOT			: new CellProperties("NOT"	, 0xe65ce6ff, "NOT"),
	AND			: new CellProperties("AND"	, 0x7d887dff, "AND"),
	LSHIFT		: new CellProperties("LSH"	, 0xffffffff, "L-SHIFT"),
	RSHIFT		: new CellProperties("RSH"	, 0xffffffff, "R-SHIFT"),
	// arithmetic & comparison
	ADD			: new CellProperties("+"	, 0xeee8eeff, "+ ADD"),
	SUB			: new CellProperties("-"	, 0xffffffff, "- SUB"),
	MULT		: new CellProperties("x"	, 0xffffffff, "x MUL"),
	DIV			: new CellProperties(String.fromCharCode(247)/*chrome doesnt support ÷*/, 0xffffffff, "÷ DIV"),
	GTH			: new CellProperties(">"	, 0xffffffff, "> GTH"),
	LTH			: new CellProperties("<"	, 0xffffffff, "< LTH"),
	EQUALS		: new CellProperties("=="	, 0xffffffff, "== EQUALS"),
	GEQ			: new CellProperties(">="	, 0xffffffff, ">= GEQ"),
	LEQ			: new CellProperties("<="	, 0xffffffff, "<= LEQ"),
});

export const CELL_PROPERTIES_MAP = new Map();// Map<type, CellProperties>
for(const [k,v] of Object.entries(CELL_PROPERTIES)) {
	CELL_PROPERTIES_MAP.set(v.type, v);
}



