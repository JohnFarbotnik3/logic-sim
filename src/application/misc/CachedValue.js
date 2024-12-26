
export class CachedValue_Rendering {
	static counter = 0;
	static onChange() { this.counter++; }
	constructor(valueFunc) {
		this.valueFunc = valueFunc;
		this._state = null;
		this._value = null;
	}
	get value() {
		const x = CachedValue_Rendering.counter;
		if(this._state !== x) { this._state = x; this._value = this.valueFunc(); }
		return this._value;
	}
};

export class CachedValue_Content {
	static counter = 0;
	static onChange() { this.counter++; CachedValue_Rendering.onChange(); }// NOTE: update placement as well.
	constructor(valueFunc) {
		this.valueFunc = valueFunc;
		this._state = null;
		this._value = null;
	}
	get value() {
		const x = CachedValue_Content.counter;
		if(this._state !== x) { this._state = x; this._value = this.valueFunc(); }
		return this._value;
	}
};


