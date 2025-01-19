
/*
	This class is for parsing and stringifying a mixed array of primitives (int, float, string)
	into a newline-delimited string.

	NOTE: a trailing delimiter is also used for convenience.
*/
export class StringSerializer {

	// list of stringified items.
	list = [];
	// current read position in list.
	readpos = 0;
	// delimiting character.
	DLCH = '\n';

	to_string() {
		let msg = "";
		for(const str of this.list) msg += (str + this.DLCH);
		return msg;
	}
	load_from_string(msg) {
		// get endpoints of each string, skipping escaped delimiters.
		const endpoints = [];
		for(let x=0;x<msg.length;x++) {
			while(msg[x] === '\\') x+=2;
			if(msg[x] === this.DLCH) endpoints.push(x);
		}
		// split message into substrings.
		let a = 0;
		for(const b of endpoints) {
			this.list.push(msg.substring(a, b));
			a = b + 1;// skip delimiter after endpoint.
		}
	}

	constructor(msg) {
		if(msg) this.load_from_string(msg);

	}

	// WARNING: javascript does not have a convenient 64-bit integer type, so watch out for precision loss!
	push_number(value) {
		this.list.push(value.toString());
	}
	read_number() {
		return Number(this.list[this.readpos++]);
	}

	push_string(value) {
		let buf = "";
		for(let x=0;x<value.length;x++) {
			const ch = value[x];
			// escape escape-characters ("\" -> "\\").
			if(ch === '\\') buf += '\\';
			// escape this.list delimiter ("X" -> "\X").
			if(ch === this.DLCH) buf += '\\';
			// add character.
			buf += ch;
		}
		this.list.push(buf);
	}
	read_string() {
		let buf = "";
		const str = this.list[this.readpos++];
		for(let x=0;x<str.length;x++) {
			const ch = str[x];
			// if escape character, skip (then add next character).
			if(ch === '\\') x++;
			// add character.
			buf += str[x];
		}
		return buf;
	}
};
