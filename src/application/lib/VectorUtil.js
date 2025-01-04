import {
	EquationMatrix,
	EquationUtil,
	Vector2D,
	Vector3D,
} from "./exports";

export class VectorUtil {
	
	static bivector_rotation_inplace(vecA, vecB, s/*sin*/, c/*cosine*/) {
		for(let i=0;i<3;i++) {
			const a = vecA[i];
			const b = vecB[i];
			vecA[i] = a*c + b*s;
			vecB[i] = b*c - a*s;
		}
	}
	
	static get_AABB_from_points_2d(points, beg, end, stride) {
		if(end <= beg) return new Float32Array([0,0,0,0]);
		const bounds = new Float32Array([
			points[beg+0], points[beg+1],
			points[beg+0], points[beg+1],
		]);
		for(let i=beg;i<end;i+=stride) {
			const x = points[i+0];
			const y = points[i+1];
			bounds[0] = Math.min(bounds[0], x);
			bounds[1] = Math.min(bounds[1], y);
			bounds[2] = Math.max(bounds[2], x);
			bounds[3] = Math.max(bounds[3], y);
		}
		return bounds;
	}
	
	static collision_aabb_aabb_2d(boundsA, boundsB) {
		return !(
			(boundsA[0] > boundsB[2]) |
			(boundsA[1] > boundsB[3]) |
			(boundsA[2] < boundsB[0]) |
			(boundsA[3] < boundsB[1])
		);
	}
	
	static collision_aabb_point_2d(bounds, point) {
		return (
			(bounds[0] <= point[0]) & (point[0] <= bounds[2]) &
			(bounds[1] <= point[1]) & (point[1] <= bounds[3])
		);
	}
	
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
	
	//TODO: add generic convex polygon collision check to VectorUtil
	
	static collision_line_line_2d(posA, dirA, posB, dirB) {
		/*
			solve system of equations:
				a*Ax - b*Bx = PBx - PAx
			    a*Ay - b*By = PBy - PAy
			then use [a,b] to solve position.
		*/
		const N = 2;
		const matrix = new EquationMatrix(Float32Array, N+1, N);
		const result = new Float32Array(N);
		for(let x=0;x<N;x++) {
			const ca = dirA[x];
			const cb = -dirB[x];
			const k  = posB[x] - posA[x];
			matrix.setRow(x, [ca, cb, k]);
		}
		const success = EquationUtil.trySolveSystemOfEquations_NxN(matrix, result, N);
		const [a,b] = result;
		const position = posA.add(dirA, a);
		return [success, position];
	}
	
	static nearestPoint_point_line_2d(point, linePointA, linePointB) {
		const lineVec = linePointB.add(linePointA, -1.0);
		const normVec = new Vector2D([-lineVec[1], lineVec[0]]);
		return VectorUtil.collision_line_line_2d(point, normVec, linePointA, lineVec);
	}
	static nearestPoint_point_line_segment_2d(point, linePointA, linePointB) {
		const [success, position] = VectorUtil.nearestPoint_point_line_2d(point, linePointA, linePointB);
		const distanceL = point.add(position  , -1.0).hypot();
		const distanceA = point.add(linePointA, -1.0).hypot();
		const distanceB = point.add(linePointB, -1.0).hypot();
		const linepoints = new Float32Array(4);
		linepoints.set(linePointA, 0);
		linepoints.set(linePointB, 2);
		const aabb = VectorUtil.get_AABB_from_points_2d(linepoints, 0, 4, 2);
		const isWithinSegmentBounds = !(
			(position[0] < aabb[0]) | (position[0] > aabb[2]) |
			(position[1] < aabb[1]) | (position[1] > aabb[3])
		);
		if(success & isWithinSegmentBounds) return position;
		return (distanceA <= distanceB) ? linePointA : linePointB;
	}
};

