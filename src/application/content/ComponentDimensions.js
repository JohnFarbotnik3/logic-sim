
export class ComponentDimensions {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(x=0,y=0,w=1,h=1,r=0) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.r = r;
	}
	
	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	
	save() {
		const {x,y,w,h,r} = this;
		return {x,y,w,h,r};
	}
	static load(obj) {
		const {x,y,w,h,r} = obj;
		const newobj = new ComponentDimensions(x,y,w,h,r);
		return newobj;
	}
	clone() {
		return this.load(this.save());
	}
};



