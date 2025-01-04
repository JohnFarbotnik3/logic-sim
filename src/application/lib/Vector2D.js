
export class Vector2D extends Float32Array {
	constructor(...args) {
		if(args.length > 0) super(...args); else super([0.0, 0.0]);
	}
	add(vec, mag=1.0) {
		return new Vector2D([
			this[0] + vec[0] * mag,
			this[1] + vec[1] * mag
		]);
	}
	scale(m) {
		return new Vector2D([this[0]*m, this[1]*m]);
	}
	hypot() {
		return Math.hypot(...this);
	}
	hypotSquared() {
		return	this[0]*this[0] +
				this[1]*this[1];
	}
	normalize() {
		return this.scale(1.0 / this.hypot());
	}
	round(mult) {
		const minv = 1.0 / mult;
		return new Vector2D([
			Math.round(this[0]*minv)*mult,
			Math.round(this[1]*minv)*mult
		]);
	}
};



