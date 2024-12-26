
class Performance {

	// TODO: use weighted sums for timings.

	static timings = new Map();// Map<string, sum>
	static counts  = new Map();// Map<string, sum>
	
	static reset() {
		for(const [name,value] of this.timings.entries()) this.timings.set(name, this.timings.get(name) * 0.98);
		for(const [name,value] of this.counts .entries()) this.counts .set(name, 0);
	}
	
	static increment_time(name, dt) {
		const t = this.timings.has(name) ? this.timings.get(name) : 0;
		this.timings.set(name, t + dt * 0.02);
	}
	static increment_count(name, dt) {
		const t = this.counts .has(name) ? this.counts .get(name) : 0;
		this.counts .set(name, t + dt);
	}
	
	static log(name) {
		const value = this.timings.get(name);
		console.log(`${name}`, value);
	}
	
	static log_all() {
		let str = "";
		for(const [name,value] of this.timings.entries()) str += `time : ${name}\t${value.toFixed(3)}\n`;
		for(const [name,value] of this.counts .entries()) str += `count: ${name}\t${value}\n`;
		console.log(str);
	}
	
};

