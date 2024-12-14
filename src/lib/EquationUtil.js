
class EquationUtil {
	
	// ============================================================
	// systems of equations
	// ------------------------------------------------------------
	
	/*
		given a matrix and row index, this function normalizes the row
		with respect to coefficient[x], for example:
			 a   *x + b*y + ... +  c   *z = k
			(a/b)*x + 1*y + ... + (c/b)*z = k/b
	*/
	static normalizeTermInMatrix(matrix, x, row) {
		const c1 = matrix.get(x, row);
		if(c1 == 0.0) return false;// failed: unable to normalize.
		matrix.scaleRow(row, 1.0/c1);
		return true;
	}
	
	/*
		given a matrix and row index <rsrc> which is normalized with respect to coefficient[x]
		(i.e. coefficient[x] == 1.0), this function subtracts it from row <rdst> such that term[x]
		is eliminated from row <rdst>, for example:
			[rsrc]  a1         *x +    y + ... +  c1         *z =  k1
			[rdst]  a2         *x + b2*y + ... +  c2         *z =  k2
			[elim] (a2 - a1*b2)*x +    0 + ... + (c2 - c1*b2)*z = (k2 - k1*b2)
	*/
	static eliminateTermInMatrix(matrix, x, rsrc, rdst) {
		const c2 = matrix.get(x, rdst);
		if(c2 != 0.0) matrix.addRow(rdst, rsrc, -c2);
	}
	
	/*
		Given an [N+1,N] matrix containing coefficients for a system of equations of the form:
			a1*x + b1*y + ... + c1*z = k1
			a2*x + b2*y + ... + c2*z = k2
			...
		This function attempts to solve the system, returning a solution of form:
			x, y, ..., z
	*/
	static trySolveSystemOfEquations_NxN(coeffMatrix, result, N) {
		/*
			for each row[x], find an equations for which variable[x] is non-zero,
			isolate variable[x] (multiply equation so that coefficient[x] == 1.0),
			then subtract some multiple of row[x] from subsequent rows to set their coefficient[x] to 0.0.
			this should produce a matrix of the form:
				x + b1*y + c1*z = k1
				0 +    y + c2*z = k2
				0 +    0 +    z = k3
			if a substitution is not valid (due to divide-by-zero), return false.
		*/
		const matrix = coeffMatrix.clone();
		const ROWS = matrix.rows;
		for(let row=0;row<ROWS;row++) {
			const x = row;
			// find row with non-zero coefficient[x].
			let rswap = 0xffffffff;
			for(let r=row;r<ROWS;r++) {
				const c = matrix.get(x,r);
				if(c != 0.0) { rswap=r; break; }
			}
			if(rswap == 0xffffffff) return false;// failed: unable to find suitable row.
			if(rswap != row) matrix.swapRows(row, rswap);
			// normalize term[x].
			if(!EquationUtil.normalizeTermInMatrix(matrix, x, row)) return false;// failed: unable to normalize.
			// subtract to eliminate term[x] from other rows.
			for(let r=row+1;r<ROWS;r++) EquationUtil.eliminateTermInMatrix(matrix, x, row, r);
		}
		/*
			working from last row to first, normalize each variable and eliminate c[x] from other rows.
			this should produce a matrix of the form:
				x + 0 + 0 = k1
				0 + y + 0 = k2
				0 + 0 + z = k3
		*/
		for(let row=ROWS-1;row>0;row--) {
			const x = row;
			// normalize term[x].
			if(!EquationUtil.normalizeTermInMatrix(matrix, x, row)) return false;// failed: unable to normalize.
			// subtract to eliminate term[x] from other rows.
			for(let r=0;r<row;r++) EquationUtil.eliminateTermInMatrix(matrix, x, row, r);
		}
		for(let x=0;x<ROWS;x++) {
			result[x] = matrix.get(N,x);// x = k
		}
		// return success status
		return true;
	}
};


// TESTS
/*
const N = 3;
const mat = new EquationMatrix(Float32Array, N+1, N);
mat.data.set([1.0, 2.0, 3.0, 9.0], 0);
mat.data.set([1.0, 0.0, 3.0, 6.0], 4);
mat.data.set([1.0, 2.0, 0.0, 6.0], 8);
console.log(mat.toString());
const result = new Float32Array(3);
console.log("solution:", EquationUtil.trySolveSystemOfEquations_NxN(mat, result, N), result);
//*/







