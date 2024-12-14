
Shapes.unitgrid = (NX,NY) => {
	// allocate data arrays
	const VSIZE = 3;
	const vlength = (NX + NY + 2) * 2 * VSIZE;
	const ilength = (NX + NY + 2) * 2;
	let vdata = new Float32Array(vlength);
	let idata = new  Uint32Array(ilength);
	let vcount = 0;
	let icount = 0;
	// generate shape
	const mx = 1.0 / NX;
	const my = 1.0 / NY;
	for(let i=0;i<=NX;i++) {
		vdata.set([i*mx, 0.0, 0.0], vcount*VSIZE); vcount++;
		vdata.set([i*mx, 1.0, 0.0], vcount*VSIZE); vcount++;
	}
	for(let i=0;i<=NY;i++) {
		vdata.set([0.0, i*my, 0.0], vcount*VSIZE); vcount++;
		vdata.set([1.0, i*my, 0.0], vcount*VSIZE); vcount++;
	}
	for(let i=0;i<vcount;i++) idata[i] = i;
	icount = vcount;
	// return data
	return {
		vdata, vcount,
		idata, icount,
	};
};


