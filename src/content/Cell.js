
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



