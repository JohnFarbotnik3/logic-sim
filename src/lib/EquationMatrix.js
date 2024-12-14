
class EquationMatrix {
	constructor(type, w, h) {
		this.type = type;
		this.data = new type(w*h);
		this.w = w;
		this.h = h;
	}
	// ============================================================
	// accessors
	// ------------------------------------------------------------
	
	get cols() { return this.w; }
	get rows() { return this.h; }
	index(x, y) { return this.w * y + x; }
	get(x, y) { return this.data[this.w * y + x]; }
	set(x, y, value) { this.data[this.w * y + x] = value; }
	setRow(y, array) { this.data.set(array, this.index(0, y)); }
	copy(src) {
		ArrayUtil.memcopy(this.data, 0, src.data, 0, src.data.length);
	}
	clone() {
		const mat = new EquationMatrix(this.type, this.w, this.h);
		mat.copy(this);
		return mat;
	}
	
	// ============================================================
	// misc
	// ------------------------------------------------------------
	
	toString(columnWidth=8, precision=-1) {
		const padstr = new Array(columnWidth).fill(" ").join("");
		let paragraph = "";
		for(let y=0;y<this.h;y++) {
		for(let x=0;x<this.w;x++) {
			const val = this.get(x,y);
			const str = precision >= 0 ? val.toFixed(precision) : val.toString();
			const pad = (padstr + str).slice(-columnWidth);
			paragraph += `${pad},`;
		}
			paragraph += "\n";
		}
		return paragraph;
	}
	
	// ============================================================
	// matrix manipulation
	// ------------------------------------------------------------
	
	swapRows(rdst, rsrc) {
		const idst = this.index(0, rdst);
		const isrc = this.index(0, rsrc);
		ArrayUtil.memswap(this.data, idst, this.data, isrc, this.w);
	}
	
	// ============================================================
	// arithmetic
	// ------------------------------------------------------------
	
	scaleRow(rdst, mult) {
		const idst = this.index(0, rdst);
		for(let x=0;x<this.w;x++) this.data[idst+x] *= mult;
	}
	addRow(rdst, rsrc, mult) {
		const idst = this.index(0, rdst);
		const isrc = this.index(0, rsrc);
		for(let x=0;x<this.w;x++) this.data[idst+x] += this.data[isrc+x] * mult;
	}
};

// TESTS
/*
const log = (mat) => {
	console.log(mat.toString());
}
var mat = new EquationMatrix(Float32Array, 4, 3);
log(mat);
mat.set(0,0,1);
mat.set(1,1,2);
mat.set(2,2,3);
log(mat);
mat.swapRows(0,1);
log(mat);
mat.scaleRow(2, 11);
log(mat);
mat.addRow(0, 2, 1000);
log(mat);
//*/



