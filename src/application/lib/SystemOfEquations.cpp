#ifndef SystemOfEquations_h
#define SystemOfEquations_h

#include <array>
#include <cstdio>
#include <string>

template<class T, int W, int H>
struct SystemOfEquations {
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


	void row_swap(int ya, int yb) {
		T temp[W];
		for(int x=0;x<W;x++) temp[x]  = get(x, ya);
		for(int x=0;x<W;x++) set(x, ya, get(x, yb));
		for(int x=0;x<W;x++) set(x, yb, temp[x]);
	}

	void row_scale(int y, T m) {
		for(int x=0;x<W;x++) set(x, y, get(x, y)*m);
	}

	void row_add(int ydst, int ysrc, T m) {
		for(int x=0;x<W;x++) set(x, ydst, get(x, ydst) + get(x, ysrc)*m);
	}

	void print(std::string before, std::string after) {
		printf(before.c_str());
		for(int y=0;y<H;y++) {
			for(int x=0;x<W;x++) printf("%f\t", data[index(x,y)]);
			printf("\n");
		}
		printf(after.c_str());
	}

	/*
		given a matrix and row index, this function normalizes the row
		with respect to coefficient[x], for example:
			 a   *x + b*y + ... +  c   *z = k
			(a/b)*x + 1*y + ... + (c/b)*z = k/b
	*/
	bool normalizeTermInMatrix(int x, int row) {
		const T c1 = get(x, row);
		if(c1 == 0.0) return false;// failed: unable to normalize.
		row_scale(row, 1.0/c1);
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
	void eliminateTermInMatrix(int x, int rsrc, int rdst) {
		const T c2 = get(x, rdst);
		if(c2 != 0.0) row_add(rdst, rsrc, -c2);
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
	bool trySolveSystemOfEquations_NxN(std::array<T, H>& result) {
		/*
			for each row[x], find an equations for which variable[x] is non-zero,
			normalize variable[x] (multiply equation so that coefficient[x] == 1.0),
			then subtract some multiple of row[x] from subsequent rows to set their coefficient[x] to 0.0.
			this should produce a matrix of the form:
				x + b1*y + c1*z = k1
				0 +    y + c2*z = k2
				0 +    0 +    z = k3
			if a substitution is not valid (due to divide-by-zero), return false.
		*/
		SystemOfEquations<T, W, H> matrix = *this;
		for(int row=0;row<H;row++) {
			const int x = row;
			// find row with non-zero coefficient[x].
			int rswap = 0xffffffff;
			for(int r=row;r<H;r++) {
				const T c = matrix.get(x,r);
				if(c != 0.0) { rswap=r; break; }
			}
			if(rswap == 0xffffffff) return false;// failed: unable to find suitable row.
			if(rswap != row) matrix.row_swap(row, rswap);
			if(!matrix.normalizeTermInMatrix(x, row)) return false;// failed: unable to normalize.
			for(int r=row+1;r<H;r++) matrix.eliminateTermInMatrix(x, row, r);
		}
		/*
			working from last row to first, normalize each variable and eliminate c[x] from other rows.
			this should produce a matrix of the form:
				x + 0 + 0 = k1
				0 + y + 0 = k2
				0 + 0 + z = k3
		*/
		for(int row=H-1;row>0;row--) {
			const int x = row;
			if(!matrix.normalizeTermInMatrix(x, row)) return false;// failed: unable to normalize.
			for(int r=0;r<row;r++) matrix.eliminateTermInMatrix(x, row, r);
		}
		for(int x=0;x<H;x++) result[x] = matrix.get(W-1,x);// x = k
		// return success status
		return true;
	}
};

#endif
