
Shapes.testgrid = (origin,N,scale) => {
	const vx = [1,0,0];
	const vy = [0,1,0];
	const vz = [0,0,1];
	const pa = [-1,-1,-1];
	const pb = [+1,+1,+1];
	const faces = [
		[pa,vx,vy,vz],
		[pa,vy,vz,vx],
		[pa,vz,vx,vy],
		[pb,vx,vy,vz],
		[pb,vy,vz,vx],
		[pb,vz,vx,vy],
	];
	const VSIZE = 3;
	const vdata = new Float32Array(3 * faces.length * N * N * VSIZE);
	const idata = new  Uint32Array(4 * faces.length * N * N * 1);
	const orig = origin.map(v => Math.round(v));
	let vcount = 0;
	let icount = 0;
	// scale vectors
	[vx,vy,vz,pa,pb].forEach(vec => vec.forEach((val,ind) => vec[ind] *= scale));
	// draw grids (x,y) whilst moving (z) towards origin position
	// TODO: revise algorithm:
	// - add all grid points (each face will have an NxN grid)
	// - add indices for all lines, such that further lines are drawn before nearer lines
	for(const [p, v1, v2, v3] of faces) {
		const vm = Math.sign(p[0]);
		for(let z=N;z>0;z--)
		for(let n=N;n>0;n--) {
			const pcm = Shapes.linear_combination(p, orig, 1.0, 1.0);
			const p00 = Shapes.linear_combination(pcm, v3, 1.0, vm * 1.0 * z / N);
			const px0 = Shapes.linear_combination(p00, v1, 1.0, vm * 2.0 * n / N);
			const p0x = Shapes.linear_combination(p00, v2, 1.0, vm * 2.0 * n / N);
			const p10 = Shapes.linear_combination(px0, v2, 1.0, vm * 2.0);
			const p01 = Shapes.linear_combination(p0x, v1, 1.0, vm * 2.0);
			const iofs = vcount;
			for(let i=0;i<3;i++) { vdata[vcount*3+i] = px0[i]; } vcount++;
			for(let i=0;i<3;i++) { vdata[vcount*3+i] = p10[i]; } vcount++;
			for(let i=0;i<3;i++) { vdata[vcount*3+i] = p0x[i]; } vcount++;
			for(let i=0;i<3;i++) { vdata[vcount*3+i] = p01[i]; } vcount++;
			idata[icount++] = iofs + 0;
			idata[icount++] = iofs + 1;
			idata[icount++] = iofs + 2;
			idata[icount++] = iofs + 3;
		}
	}
	return [vdata, idata, vcount, icount];
};

