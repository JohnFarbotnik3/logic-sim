
class ComponentDimensions extends Transformation2DParams {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(...args) {
		super(...args);
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
		const newobj = new ComponentDimensions();
		Object.assign(newobj, this);
		return newobj;
	}
};



