
Shapes.unitcircle = (N) => {
	// allocate data arrays
	const VSIZE = 3;
	const vlength = N * VSIZE;
	const ilength = N * 2 + 2;
	let vdata = new Float32Array(vlength);
	let idata = new  Uint32Array(ilength);
	let vcount = 0;
	let icount = 0;
	// generate shape
	const m = 2.0 * Math.PI / N;
	for(let i=0;i<N;i++) {
		vdata[i*VSIZE+0] = Math.cos(i*m);
		vdata[i*VSIZE+1] = Math.sin(i*m);
		vdata[i*VSIZE+2] = 0.0;
		vcount++;
	}
	for(let i=0;i<=N;i++) {
		idata[icount++] = (i+0)%N;
		idata[icount++] = (i+1)%N;
	}
	// return data
	return {
		vdata, vcount,
		idata, icount,
	};
};


