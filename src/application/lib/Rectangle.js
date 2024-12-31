
export class Rectangle extends Float32Array {
	constructor(x, y, w, h) {
		super(4);
		this[0] = x;
		this[1] = y;
		this[2] = w;
		this[3] = h;
	}
	clone() {
		return new Rectangle(this.x,this.y,this.w,this.h);
	}
	
	get x() { return this[0]; }
	get y() { return this[1]; }
	get w() { return this[2]; }
	get h() { return this[3]; }
	set x(value) { return this[0] = value; }
	set y(value) { return this[1] = value; }
	set w(value) { return this[2] = value; }
	set h(value) { return this[3] = value; }
	get xywh() {
		return this.slice();
	}
	set xywh(arr) {
		this.set(arr);
	}
	
	get x1() { return this[0]; }
	get y1() { return this[1]; }
	get x2() { return this[0] + this[2]; }
	get y2() { return this[1] + this[3]; }
	get xyxy() {
		return new Float32Array([
			this[0],
			this[1],
			this[0] + this[2],
			this[1] + this[3],
		]);
	}
	set xyxy(arr) {
		this.set([
			arr[0],
			arr[1],
			arr[2] - arr[0],
			arr[3] - arr[1],
		], 0);
	}
	
};

