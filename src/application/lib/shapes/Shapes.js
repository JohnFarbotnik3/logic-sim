
console.debug("Shapes.js");

const Shapes = {};

Shapes.delta = (vecA, vecB) => {
	const vec = new Float32Array([0,0,0]);
	for(let i=0;i<3;i++) vec[i] = vecB[i] - vecA[i];
	return vec;
};

Shapes.scale_inplace = (vec, mag) => {
	for(let i=0;i<3;i++) vec[i] *= mag;
};

Shapes.linear_combination = (vecA, vecB, magA, magB) => {
	const vec = new Float32Array([0,0,0]);
	for(let i=0;i<3;i++) vec[i] = vecA[i]*magA + vecB[i]*magB;
	return vec;
}

Shapes.add_vec3 = (vecA, vecB) => {
	const vec = new Float32Array([0,0,0]);
	for(let i=0;i<3;i++) vec[i] = vecA[i] + vecB[i];
	return vec;
};

Shapes.normalize = (vec) => {
	const v = vec.slice();
	const h = Math.hypot(v[0], v[1], v[2]);
	const m = h === 0.0 ? 0.0 : 1.0 / h;
	v[0] *= m;
	v[1] *= m;
	v[2] *= m;
	return v;
};
Shapes.normalize_inplace = (arr, ofs) => {
	const h = Math.hypot(arr[ofs+0], arr[ofs+1], arr[ofs+2]);
	const m = h === 0.0 ? 0.0 : 1.0 / h;
	arr[ofs+0] *= m;
	arr[ofs+1] *= m;
	arr[ofs+2] *= m;
};

Shapes.midpoint = (vecA, vecB) => {
	return [0,1,2].map(i => (vecA[i] + vecB[i]) * 0.5);
};

Shapes.lerp = (vecA, vecB, m) => {
	return [0,1,2].map(i => vecA[i] + (vecB[i] - vecA[i]) * m);
};

Shapes.bilerp = (vecA, vecB, vecC, mAB, mAC) => {
	return [0,1,2].map(i => vecA[i] + (vecB[i] - vecA[i]) * mAB + (vecC[i] - vecA[i]) * mAC);
};
Shapes.bilerp_inplace = (arr, ofs, vecA, vecB, vecC, mAB, mAC) => {
	let i=0;	
	arr[ofs+i] = vecA[i] + (vecB[i] - vecA[i]) * mAB + (vecC[i] - vecA[i]) * mAC; i++;
	arr[ofs+i] = vecA[i] + (vecB[i] - vecA[i]) * mAB + (vecC[i] - vecA[i]) * mAC; i++;
	arr[ofs+i] = vecA[i] + (vecB[i] - vecA[i]) * mAB + (vecC[i] - vecA[i]) * mAC; i++;
};

// rotate va towards vb, and vb towards -va.
Shapes.bivector_rotate_inplace = (vecA, vecB, c, s) => {
	for(let i=0;i<3;i++) {
		const a = vecA[i];
		const b = vecB[i];
		vecA[i] = a*c - b*s;
		vecB[i] = b*c + a*s;
	}
}
Shapes.bivector_rotate = (vecA, vecB, c, s) => {
	vA = vecA.slice();
	vB = vecB.slice();
	Shapes.bivector_rotate_inplace(vA, vB, c, s);
	return [vA, vB];
}

