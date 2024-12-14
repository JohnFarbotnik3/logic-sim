
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

const CELL_PROPERTIES = ({
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
const CELL_PROPERTIES_MAP = new Map();// Map<type, CellProperties>
for(const [k,v] of Object.entries(CELL_PROPERTIES)) {
	CELL_PROPERTIES_MAP.set(v.type, v);
}

class Cell {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(...args) {
		this.dimensions	= null;	// ComponentDimensions.
		this.id			= ComponentId.NONE;// ComponentId.
		this.type		= 0x0;	// u32	cell type & behaviour.
		this.value		= 0x0;	// u32	default output value of this cell.
		// constructor overloads.
		const _INDEX = VerificationUtil.getConstructorOverloadIndex_throw(args, [
			[],
			[Number, Number],
		]);
		if(_INDEX === 1) {
			const [type, value] = args;
			this.dimensions	= new ComponentDimensions(0,0,1,1,0);
			this.id			= ComponentId.next();
			this.type		= type;
			this.value		= value;
		}
	}
	
	get clr() {
		return CELL_PROPERTIES_MAP.get(this.type).clr;
	}
	get typeString() {
		return CELL_PROPERTIES_MAP.get(this.type).tstr;
	}
	get numTargets() {
		if(this.type === CELL_PROPERTIES.CONSTANT	.type) return 1;
		if(this.type === CELL_PROPERTIES.COPY		.type) return 2;
		if(this.type === CELL_PROPERTIES.NOT		.type) return 2;
		return 3;
	}
	
	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	
	save() {
		const { dimensions, id, type, value } = this;
		return {
			dimensions: dimensions.save(),
			id, type, value,
		};
	}
	static load(obj) {
		const newobj = new Cell();
		Object.assign(newobj, obj);
		newobj.dimensions = ComponentDimensions.load(obj.dimensions);
		return newobj;
	}
	clone() {
		const newobj = new Cell();
		Object.assign(newobj, this);
		newobj.dimensions = this.dimensions.clone();
		return newobj;
	}
	
	// ============================================================
	// Link helpers
	// ------------------------------------------------------------
	
	static LINK_TARGET = ({
		OUTPUT		: 0,
		INPUT_A		: 1,
		INPUT_B		: 2,
		NONE		: 7,
	});
	get LINK_TARGET() { return Cell.LINK_TARGET; }
	static canLinkTargets(tgtA, tgtB) {
		const code = (0x1 << tgtA) | (0x1 << tgtB);
		return (code === /*OUT -> INA*/ 0b011) | (code === /*OUT -> INB*/ 0b101);
	}
	
}



