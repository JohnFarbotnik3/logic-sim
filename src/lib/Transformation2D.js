
class Transformation2D extends Array {
	constructor(...args) {
		if(args.length === 1) super(...args[0]);
		if(args.length === 0) super(0,0,  1,0,  0,1);
		if(args.length === 5) {
			super(6);
			const [x,y,w,h,r] = args;
			const s = Math.sin(r * 2.0 * Math.PI);
			const c = Math.cos(r * 2.0 * Math.PI);
			this[0] = x;	this[1] = y;
			this[2] =  c*w;	this[3] = s*w;
			this[4] = -s*h;	this[5] = c*h;
		}
	}
	
	// ============================================================
	// Composition
	// ------------------------------------------------------------
	
	compose(tran) {
		const lt  = this;
		const rt  = tran;
		const dst = new Transformation2D(rt);
		lt.applyBasis(dst, 0, 6, 2);
		dst[0] += lt[0];
		dst[1] += lt[1];
		return dst;
	}
	
	// ============================================================
	// Apply transformations to position data
	// ------------------------------------------------------------
	
	// apply offset and basis vectors.
	apply(points, beg, end, stride) {
		for(let i=beg;i<end;i+=stride) {
			const x = points[i+0];
			const y = points[i+1];
			points[i+0] = this[0] + x*this[2] + y*this[4];
			points[i+1] = this[1] + x*this[3] + y*this[5];
		}
		return points;
	}
	
	// only apply the offset part of this transformation.
	applyOffset(points, beg, end, stride) {
		for(let i=beg;i<end;i+=stride) {
			points[i+0] += this[0];
			points[i+1] += this[1];
		}
		return points;
	}
	
	// only apply the basis part of this transformation.
	applyBasis(points, beg, end, stride) {
		for(let i=beg;i<end;i+=stride) {
			const x = points[i+0];
			const y = points[i+1];
			points[i+0] = x*this[2] + y*this[4];
			points[i+1] = x*this[3] + y*this[5];
		}
		return points;
	}
	
};



