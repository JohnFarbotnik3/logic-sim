
class Text {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(...args) {
		this.id			= ComponentId.NONE;	// ComponentId.
		this.dimensions	= null;			// ComponentDimensions.
		this.str		= null;			// String
		this.fhgt		= 1.0;			// float			font height.
		this.fclr		= 0x000000ff;	// u32:Colour		foreground colour.
		this.bclr		= 0xffffffff;	// u32:Colour		background colour.
		this.oclr		= 0x000000ff;	// u32:Colour		outline colour.
		// constructor overloads.
		const _INDEX = VerificationUtil.getConstructorOverloadIndex_throw(args, [
			[],
			[ComponentDimensions, Number, Number, Number, Number, String],
		]);
		if(_INDEX === 1) {
			const [dim, fhgt, fclr, bclr, oclr, str] = args;
			this.id = ComponentId.next();
			this.dimensions = dim;
			this.str = str;
			this.fhgt = fhgt;
			this.fclr = fclr;
			this.bclr = bclr;
			this.oclr = oclr;
		}
	}
	
	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	
	save() {
		const {
			dimensions,
			id, str, fhgt, fclr, bclr, oclr
		} = this;
		return {
			dimensions: dimensions.save(),
			id, str, fhgt, fclr, bclr, oclr
		};
	}
	static load(obj) {
		const newobj = new Text();
		Object.assign(newobj, obj);
		newobj.dimensions = ComponentDimensions.load(obj.dimensions);
		return newobj;
	}
	clone() {
		const newobj = new Text();
		Object.assign(newobj, this);
		newobj.dimensions = this.dimensions.clone();
		return newobj;
	}
	
};



