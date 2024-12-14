
Shapes.sphere = (resolution, discrete=false, countOnly=false) => {
	let vdata = null;
	let idata = null;
	let vcount = 0;
	let icount = 0;
	// allocate data arrays
	const N = Math.max(resolution, 2);
	const numfaces = 6;
	const vlength = 3 * numfaces * (discrete ? ((N-1)*(N-1)*4) : (N*N));
	const ilength = 1 * numfaces * (N-1)*(N-1)*6;
	if(countOnly) return [vdata, idata, vcount, icount];
	vdata = new Float32Array(vlength);
	idata = new Uint32Array(ilength);
	// direction vectors
	const pos = [];
	for(let x=0;x<2;x++)
	for(let y=0;y<2;y++)
	for(let z=0;z<2;z++) pos[x<<2 | y<<1 | z<<0] = [[-1,+1][x],[-1,+1][y],[-1,+1][z]];
	// faces
	const faces = [
		[pos[0b000], pos[0b100], pos[0b010]],
		[pos[0b000], pos[0b010], pos[0b001]],
		[pos[0b000], pos[0b001], pos[0b100]],
		[pos[0b111], pos[0b011], pos[0b101]],
		[pos[0b111], pos[0b101], pos[0b110]],
		[pos[0b111], pos[0b110], pos[0b011]],
	];
	// generate cube
	const m = 1.0 / (N - 1);
	let vpos = 0;
	let ipos = 0;
	for(const [v00,v10,v01] of faces) {
		if(discrete) {
			// squares have separate vertices
			for(let x=0;x<N-1;x++)
			for(let y=0;y<N-1;y++) {
				const iofs = vcount;
				Shapes.bilerp_inplace(vdata, vpos, v00, v10, v01, x*m, y*m); vpos+=3; x++;
				Shapes.bilerp_inplace(vdata, vpos, v00, v10, v01, x*m, y*m); vpos+=3; y++;
				Shapes.bilerp_inplace(vdata, vpos, v00, v10, v01, x*m, y*m); vpos+=3; x--;
				Shapes.bilerp_inplace(vdata, vpos, v00, v10, v01, x*m, y*m); vpos+=3; y--;
				idata[ipos++] = iofs + 0;
				idata[ipos++] = iofs + 1;
				idata[ipos++] = iofs + 2;
				idata[ipos++] = iofs + 2;
				idata[ipos++] = iofs + 3;
				idata[ipos++] = iofs + 0;
				vcount+=4;
				icount+=6;
			}
		} else {
			// squares share vertices
			const iofs = vcount;
			for(let x=0;x<N;x++)
			for(let y=0;y<N;y++) {
				Shapes.bilerp_inplace(vdata, vpos, v00, v10, v01, x*m, y*m);
				vpos+=3;
			}
			for(let x=0;x<N-1;x++)
			for(let y=0;y<N-1;y++) {
				idata[ipos++] = iofs + x*N + y; x++;
				idata[ipos++] = iofs + x*N + y; y++;
				idata[ipos++] = iofs + x*N + y;
				idata[ipos++] = iofs + x*N + y; x--;
				idata[ipos++] = iofs + x*N + y; y--;
				idata[ipos++] = iofs + x*N + y;
			}
			vcount += N*N;
			icount += (N-1)*(N-1)*6;
		}
	}
	// normalize
	for(let i=0;i<vdata.length;i+=3) {
		Shapes.normalize_inplace(vdata, i+0);
	}
	return [vdata, idata, vcount, icount];
};


