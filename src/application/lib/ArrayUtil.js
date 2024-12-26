
/*
	This utility operates using left-handed indexing (interval format: "[x,y)");
	i.e. the beginning-index is "to the left" of the first array element,
	and the ending-index is "to the right" of the last array element.
*/
class ArrayUtil {
	// ============================================================
	// memory manipulation
	// ------------------------------------------------------------
	static memcopy(dst, idst, src, isrc, len) {
		if((len > 1024) && (dst.set & src.subarray)) {
			// Note: subarray returns a view of source array's buffer
			dst.set(src.subarray(isrc, isrc+len), idst);
		} else {
			for(let i=0;i<len;i++) dst[idst+i] = src[isrc+i];
		}
	}
	static memmove(dst, idst, isrc, len) {
		if(dst.copyWithin) {
			dst.copyWithin(idst, isrc, isrc+len);
		} else {
			const temp = new Array(len);
			for(let i=0;i<len;i++) temp[i] = dst[isrc+i];
			for(let i=0;i<len;i++) dst[idst+i] = temp[i];
		}
	}
	static memswap(dst, idst, src, isrc, len) {
		const tmp = new dst.constructor(len);
		ArrayUtil.memcopy(tmp,    0, dst, idst, len);
		ArrayUtil.memcopy(dst, idst, src, isrc, len);
		ArrayUtil.memcopy(src, isrc, tmp,    0, len);
	}
	static memreverse(dst, idst, src, isrc, len) {
		const irev = isrc + len - 1;
		for(let i=0;i<len;i++) dst[idst+i] = src[irev-i];
	}
	
	// ============================================================
	// memory allocation
	// ------------------------------------------------------------
	static resize(oldArray, newLength, copy=false) {
		const arrayType = oldArray.constructor;
		const oldLength = oldArray.length;
		const newArray = new arrayType(newLength);
		if(copy) ArrayUtil.memcopy(newArray, 0, oldArray, 0, Math.min(oldLength, newLength));
		return newArray;
	}
	
};

