
class Transformation2DParams {
	constructor(x=0,y=0,w=1,h=1,r=0) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.r = r;
	}
	clone() {
		const obj = new Transformation2DParams();
		Object.assign(obj, this);
		return obj;
	}
	get transformation() {
		return new Transformation2D(this.x, this.y, this.w, this.h, this.r);
	}
};

class Transformation2D extends Float32Array {
	constructor(...args) {
		if(args.length !== 0 && args.length !== 5)	super(...args);
		else										super(6);
		if(args.length === 0) this.initialize(0,0,1,1,0); 
		if(args.length === 5) this.initialize(...args);
	}
	
	clone() {
		return new Transformation2D(this);
	}
	
	copyFrom(tran) {
		this.set(tran, 0);
	}
	
	identity() {
		this.offset.set([0,0], 0);
		this.xbasis.set([1,0], 0);
		this.ybasis.set([0,1], 0);
	}
	
	initialize(x,y,w,h,r) {
		const s = Math.sin(r * 2.0 * Math.PI);
		const c = Math.cos(r * 2.0 * Math.PI);
		this.offset.set([x, y], 0);
		this.xbasis.set([ c*w, s*w], 0);
		this.ybasis.set([-s*h, c*h], 0);
	}
	
	// ============================================================
	// Getters
	// ------------------------------------------------------------
	
	get offset() { return super.subarray(0,2); }
	get xbasis() { return super.subarray(2,4); }
	get ybasis() { return super.subarray(4,6); }
	get x() { return this[0]; }
	get y() { return this[1]; }
	get w() { return Math.hypot(this[2], this[3]); }
	get h() { return Math.hypot(this[4], this[5]); }
	
	// ============================================================
	// Composition
	// ------------------------------------------------------------
	
	static compose(dst, lt, rt) {
		dst.set(rt, 0);
		lt.applyBasis(dst, 0, 6, 2);
		// only apply offset to 'offset' part of dst transformation,
		// i.e. do not offset the basis vectors.
		dst.offset[0] += lt.offset[0];
		dst.offset[1] += lt.offset[1];
		return dst;
	}
	
	// compose this transformation with another.
	compose(tran) {
		const dst = new Transformation2D();
		return Transformation2D.compose(dst, this, tran);
	}
	
	// ============================================================
	// Apply transformations to position data
	// ------------------------------------------------------------
	
	// apply offset and basis vectors.
	apply_slow(points, beg, end, stride) {
		for(let i=beg;i<end;i+=stride) {
			const x = points[i+0];
			const y = points[i+1];
			points[i+0] = x*this.xbasis[0] + y*this.ybasis[0] + this.offset[0];
			points[i+1] = x*this.xbasis[1] + y*this.ybasis[1] + this.offset[1];
		}
		return points;
	}
	apply(points, beg, end, stride) {
		for(let i=beg;i<end;i+=stride) {
			const x = points[i+0];
			const y = points[i+1];
			points[i+0] = x*this[2] + y*this[4] + this[0];
			points[i+1] = x*this[3] + y*this[5] + this[1];
		}
		return points;
	}
	
	// only apply the offset part of this transformation.
	applyOffset(points, beg, end, stride) {
		for(let i=beg;i<end;i+=stride) {
			points[i+0] += this.offset[0];
			points[i+1] += this.offset[1];
		}
		return points;
	}
	
	// only apply the basis part of this transformation.
	applyBasis(points, beg, end, stride) {
		for(let i=beg;i<end;i+=stride) {
			const x = points[i+0];
			const y = points[i+1];
			points[i+0] = x*this.xbasis[0] + y*this.ybasis[0];
			points[i+1] = x*this.xbasis[1] + y*this.ybasis[1];
		}
		return points;
	}
	
};



