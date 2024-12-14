
class Vector3D extends Float32Array {
	constructor(...args) {
		if(args.length > 0) super(...args); else super([0.0, 0.0, 0.0]);
	}
	add(vec, mag=1.0) {
		return new Vector3D([
			this[0] + vec[0] * mag,
			this[1] + vec[1] * mag,
			this[2] + vec[2] * mag
		]);
	}
	scale(m) {
		return new Vector3D([this[0]*m, this[1]*m, this[2]*m]);
	}
	hypot() {
		return Math.hypot(...this);
	}
	hypotSquared() {
		return	this[0]*this[0] +
				this[1]*this[1] +
				this[2]*this[2];
	}
	normalize() {
		return this.scale(1.0 / this.hypot());
	}
	round(mult) {
		const minv = 1.0 / mult;
		return new Vector3D([
			Math.round(this[0]*minv)*mult,
			Math.round(this[1]*minv)*mult,
			Math.round(this[2]*minv)*mult
		]);
	}
};



