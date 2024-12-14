
class ShaderPackingUtil {

	// packs an RGBA colour (range: [0, 255]) into 4 8-bit components.
	static packed_rgba_8bit(r,g,b,a) {
		return (r << 24) | (g << 16) | (b << 8) | (a << 0);
	}
	static unpack_rgba_8bit(outname, inname) {
		return `
			const float cmult = 1.0 / float(0xff);
			const uint  cmask = uint(0xff);
			${outname}.r = float((${inname} >> 24) & cmask) * cmult;
			${outname}.g = float((${inname} >> 16) & cmask) * cmult;
			${outname}.b = float((${inname} >>  8) & cmask) * cmult;
			${outname}.a = float((${inname} >>  0) & cmask) * cmult;
		`;
	}

	// packs a normal vector (range: [-1.0, +1.0]) into 3 10-bit components.
	static packed_normal_10bit(x,y,z) {
		return	(Math.round(x * 0x1ff + 0x1ff) <<  0) |
				(Math.round(y * 0x1ff + 0x1ff) << 10) |
				(Math.round(z * 0x1ff + 0x1ff) << 20);
	}
	static unpack_normal_10bit(outname, inname) {
		return `
			const float nmult = 1.0 / float(0x1ff);
			const uint  noffs = uint(0x1ff);
			const uint  nmask = uint(0x3ff);
			${outname}.x = float(((${inname} >>  0) & nmask) - noffs) * nmult;
			${outname}.y = float(((${inname} >> 10) & nmask) - noffs) * nmult;
			${outname}.z = float(((${inname} >> 20) & nmask) - noffs) * nmult;
		`;
	}
	
};

