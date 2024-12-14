
Shapes.reticleBasisVectors = (pos, lookX, lookY, lookZ) => {
	const VEC_LENGTH = 3;
	const vdata = new Float32Array((3 * 6 + 2) * VEC_LENGTH);
	const idata = new  Uint32Array((3 * 6 + 2) * 1);
	const cdata = new  Uint32Array((3 * 6 + 2) * 1);
	let vcount = 0;
	let icount = 0;
	let ccount = 0;
	let iofs;
	// basis vectors
	const vec_0 = new Float32Array([0.0, 0.0, 0.0]);
	const vec_x = new Float32Array([1.0, 0.0, 0.0]);
	const vec_y = new Float32Array([0.0, 1.0, 0.0]);
	const vec_z = new Float32Array([0.0, 0.0, 1.0]);
	// hex colours
	const hexc_0 = (0x00 << 0) | (0x00 << 8) | (0x00 << 16) | (0xff << 24);
	const hexc_r = (0xff << 0) | (0x00 << 8) | (0x00 << 16) | (0xff << 24);
	const hexc_g = (0x00 << 0) | (0xff << 8) | (0x00 << 16) | (0xff << 24);
	const hexc_b = (0x00 << 0) | (0x00 << 8) | (0xff << 16) | (0xff << 24);
	// origin
	iofs = vcount;
	vdata.set(vec_0, vcount*3); vcount++;
	vdata.set(vec_x, vcount*3); vcount++;
	vdata.set(vec_0, vcount*3); vcount++;
	vdata.set(vec_y, vcount*3); vcount++;
	vdata.set(vec_0, vcount*3); vcount++;
	vdata.set(vec_z, vcount*3); vcount++;
	idata.set([iofs+0, iofs+1,  iofs+2, iofs+3,  iofs+4, iofs+5], icount);
	cdata.set([hexc_r, hexc_r,  hexc_g, hexc_g,  hexc_b, hexc_b], ccount);
	icount+=6;
	ccount+=6;
	// basis vectors
	iofs = vcount;
	const frontPos = Shapes.linear_combination(pos, lookZ, 1.0, 5.0);
	vdata.set(Shapes.add_vec3(frontPos, vec_0), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontPos, vec_x), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontPos, vec_0), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontPos, vec_y), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontPos, vec_0), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontPos, vec_z), vcount*3); vcount++;
	idata.set([iofs+0, iofs+1,  iofs+2, iofs+3,  iofs+4, iofs+5], icount);
	cdata.set([hexc_r, hexc_r,  hexc_g, hexc_g,  hexc_b, hexc_b], ccount);
	icount+=6;
	ccount+=6;
	// pointer to origin
	iofs = vcount;
	const normPos = Shapes.normalize(pos);
	const lookOrigin = [-normPos[0], -normPos[1], -normPos[2]];
	vdata.set(Shapes.add_vec3(frontPos, vec_0     ), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontPos, lookOrigin), vcount*3); vcount++;
	idata.set([iofs+0, iofs+1], icount);
	cdata.set([(hexc_r | hexc_g), (hexc_r | hexc_g)], ccount);
	icount+=2;
	ccount+=2;
	// look vectors
	iofs = vcount;
	const frontSidePos = Shapes.linear_combination(frontPos, lookX, 1.0, 2.0);
	vdata.set(Shapes.add_vec3(frontSidePos, vec_0), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontSidePos, lookX), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontSidePos, vec_0), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontSidePos, lookY), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontSidePos, vec_0), vcount*3); vcount++;
	vdata.set(Shapes.add_vec3(frontSidePos, lookZ), vcount*3); vcount++;
	idata.set([iofs+0, iofs+1,  iofs+2, iofs+3,  iofs+4, iofs+5], icount);
	cdata.set([hexc_r, hexc_r,  hexc_g, hexc_g,  hexc_b, hexc_b], ccount);
	icount+=6;
	ccount+=6;
	return {
		vdata, vcount,
		idata, icount,
		cdata, ccount,
	};
};

