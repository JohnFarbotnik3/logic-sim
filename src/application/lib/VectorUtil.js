import {
	EquationMatrix,
	EquationUtil,
	Vector2D,
	Vector3D,
} from "./exports";

export class VectorUtil {
	static collision_line_plane_3d(linePos, lineVec, planePos, planeVecA, planeVecB) {
		/*
			solve system of equations:
			    Vx*v - Ax*a - Bx*b = Px - Lx
			    Vy*v - Ay*a - By*b = Py - Ly
			    Vz*v - Az*a - Bz*b = Pz - Lz
			then use [v,a,b] to solve position.
		*/
		const N = 3;
		const matrix = new EquationMatrix(Float32Array, N+1, N);
		const result = new Float32Array(N);
		for(let x=0;x<N;x++) {
			const cv = lineVec[x];
			const ca = -planeVecA[x];
			const cb = -planeVecB[x];
			const k  = planePos[x] - linePos[x];
			matrix.setRow(x, [cv, ca, cb, k]);
		}
		const success = EquationUtil.trySolveSystemOfEquations_NxN(matrix, result, N);
		const [v,a,b] = result;
		const position = linePos.add(lineVec, v);
		return [success, position];
	}
};

