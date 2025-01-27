#include <array>

template<class T, int W, int H>
struct EquationMatrix {
	T data[W*H];

	inline int index(const int x, const int y) {
		return y*W + x;
	}
	inline T get(const int x, const int y) {
		return data[y*W + x];
	}
	inline void set(const int x, const int y, const T value) {
		data[y*W + x] = value;
	}

	void row_swap(int a, int b) {
		T temp[W];
		for(int x=0;x<W;x++) temp[x]  = get(x,a);
		for(int x=0;x<W;x++) set(x,a, get(x,b));
		for(int x=0;x<W;x++) set(x,b, temp[x]);
	}

	void row_scale(int a, T m) {
		for(int x=0;x<W;x++) set(x,a, get(x,a)*m);
	}

	void row_add(int dst, int src, T m) {
		for(int x=0;x<W;x++) set(x,dst, get(x,dst) + get(x,src)*m);
	}
};

struct EquationUtil {
	// ============================================================
	// solve systems of equations.
	// ------------------------------------------------------------

	/*
		given a matrix and row index, this function normalizes the row
		with respect to coefficient[x], for example:
			 a   *x + b*y + ... +  c   *z = k
			(a/b)*x + 1*y + ... + (c/b)*z = k/b
	*/
	template<class T, int W, int H>
	static bool normalizeTermInMatrix(EquationMatrix<T,W,H>& matrix, int x, int row) {
		const T c1 = matrix.get(x, row);
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
	template<class T,int W, int H>
	static void eliminateTermInMatrix(EquationMatrix<T,W,H>& matrix, int x, int rsrc, int rdst) {
		const T c2 = matrix.get(x, rdst);
		if(c2 != 0.0) matrix.addRow(rdst, rsrc, -c2);
	}

	/*
		Given an [N+1,N] matrix containing coefficients for a system of equations of the form:
			a1*x + b1*y + ... + c1*z = k1
			a2*x + b2*y + ... + c2*z = k2
			a3*x + b3*y + ... + c3*z = k3
			...
		This function attempts to solve the system, returning a solution of form:
			x, y, ..., z
	*/
	template<class T, int ROWS, int COLS, int N>
	static bool trySolveSystemOfEquations_NxN(EquationMatrix<T, ROWS, COLS>& coeffMatrix, std::array<T, N>& result) {
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
		EquationMatrix<T, ROWS, COLS> matrix = coeffMatrix;
		for(int row=0;row<ROWS;row++) {
			const int x = row;
			// find row with non-zero coefficient[x].
			int rswap = 0xffffffff;
			for(int r=row;r<ROWS;r++) {
				const T c = matrix.get(x,r);
				if(c != 0.0) { rswap=r; break; }
			}
			if(rswap == 0xffffffff) return false;// failed: unable to find suitable row.
			if(rswap != row) matrix.swapRows(row, rswap);
			// normalize term[x].
			if(!normalizeTermInMatrix(matrix, x, row)) return false;// failed: unable to normalize.
			// subtract to eliminate term[x] from other rows.
			for(int r=row+1;r<ROWS;r++) eliminateTermInMatrix(matrix, x, row, r);
		}
		/*
			working from last row to first, normalize each variable and eliminate c[x] from other rows.
			this should produce a matrix of the form:
				x + 0 + 0 = k1
				0 + y + 0 = k2
				0 + 0 + z = k3
		*/
		for(int row=ROWS-1;row>0;row--) {
			const int x = row;
			// normalize term[x].
			if(!normalizeTermInMatrix(matrix, x, row)) return false;// failed: unable to normalize.
			// subtract to eliminate term[x] from other rows.
			for(int r=0;r<row;r++) eliminateTermInMatrix(matrix, x, row, r);
		}
		for(int x=0;x<ROWS;x++) result[x] = matrix.get(N,x);// x = k
		// return success status
		return true;
	}
};
