
export class InputProps {
	constructor(label, type, initial, oninput) {
		this.label		= label;
		this.type		= type;
		this.initial	= initial;
		this.oninput	= oninput;
	}
};

export const INPUT_TYPES = {
	u32:	1,
	f32:	2,
	dim:	3,
	str:	4,
	name:	5,
};

export function parse_input(str, type) {
	if(type === INPUT_TYPES.u32)	return parse_u32(str);
	if(type === INPUT_TYPES.f32)	return parse_f32(str);
	if(type === INPUT_TYPES.dim)	return parse_dim(str);
	if(type === INPUT_TYPES.str)	return parse_str(str);
	if(type === INPUT_TYPES.name)	return parse_name(str);
}

export function parse_u32(str) {
	let value = Number(str);
	let valid = true;
	if(!Number.isInteger(value) | value < 0 | 0xffffffff < value) valid = false;
	return [value, valid];
}

export function parse_f32(str) {
	let value = Number(str);
	let valid = true;
	if(Number.isNaN(value)) valid = false;
	return [value, valid];
}

export function parse_dim(str) {
	let value = Number(str);
	let valid = true;
	if(Number.isNaN(value) | value <= 0) valid = false;
	return [value, valid];
}

export function parse_str(str) {
	let value = str;
	let valid = true;
	return [value, valid];
}

export function parse_name(str) {
	let value = str;
	let valid = str.length > 0;
	return [value, valid];
}
