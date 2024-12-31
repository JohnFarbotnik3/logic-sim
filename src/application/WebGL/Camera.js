import { mat4, vec3 } from "./exports";

export class Camera {
	constructor() {
		this.aspectRatio = 1.0;
		this.FOV	= 7.0 / 360.0;
		this.zNear	= 0.1;
		this.zFar	= 1000.0;// default: 100.0
		this.pos	= new Float32Array([0,0,-100]);
		this.dirX	= new Float32Array([1,0,0]);// right
		this.dirY	= new Float32Array([0,1,0]);// up
		this.dirZ	= new Float32Array([0,0,1]);// foreward
		this.matrixProj	= mat4.create();
		this.matrixView	= mat4.create();
		this.updateProjection();
		this.updateView();
	}

	setAspectRatio(w, h) {
		this.aspectRatio = w / h;
		this.updateProjection();
	}

	updateProjection() {
		const fieldOfView = this.FOV * (2.0 * Math.PI);
		mat4.perspective(this.matrixProj, fieldOfView, this.aspectRatio, this.zNear, this.zFar);
		mat4.scale(this.matrixProj, this.matrixProj, [-1.0, 1.0, 1.0]);// x is inverted in WebGL ... why?
	}

	updateView() {
		const eyePosition	= vec3.fromValues(...this.pos);
		const focalPoint	= vec3.fromValues(...this.pos.map((v,i) => v + this.dirZ[i]));
		const upAxis		= vec3.fromValues(...this.dirY);
		mat4.lookAt(this.matrixView, eyePosition, focalPoint, upAxis);
	}

	applyCameraMatrix(mat) {
		mat4.multiply(mat, this.matrixView, mat);
		mat4.multiply(mat, this.matrixProj, mat);
	}

	translate(x,y,z) {
		this.pos[0] += x;
		this.pos[1] += y;
		this.pos[2] += z;
		this.updateView();
	}

	move(x,y,z) {
		for(let i=0;i<3;i++) this.pos[i] += (this.dirX[i]*x + this.dirY[i]*y + this.dirZ[i]*z);
		this.updateView();
	}

	zoom(mag) {
		// zoom should slow down as FOV approaches 180deg (i.e. 0.5 revolutions)
		const mult = (mag - 1.0) * Math.cos((this.FOV * 2) * (2.0 * Math.PI / 4));
		this.FOV = Math.min(this.FOV * (mult + 1.0), 0.49);
		this.updateProjection();
	}

	rotate(angleZX, angleZY, angleYX) {
		const inputTuples = [
			[angleZY, this.dirZ, this.dirY],
			[angleZX, this.dirZ, this.dirX],
			[angleYX, this.dirY, this.dirX],
		];
		inputTuples.forEach(tuple => {
			const [angle, vecA, vecB] = tuple;
			const r = angle * 2.0 * Math.PI;
			//VectorUtil.bivector_rotation_inplace(vecA, vecB, Math.sin(r), Math.cos(r));
			const s = Math.sin(r);
			const c = Math.cos(r);
			for(let i=0;i<3;i++) {
				const a = vecA[i];
				const b = vecB[i];
				vecA[i] = a*c + b*s;
				vecB[i] = b*c - a*s;
			}
		});
		// NOTE TO SELF: order agnostic rotations were not worth the trouble...
		/*
		const rotatedVecPairs = inputTuples.map(([angle, camA, camB]) => {
			angle *= 2.0 * Math.PI;
			return Shapes.bivector_rotate(camA, camB, Math.cos(angle), Math.sin(angle));
		});
		const rotatedVecDiffs = rotatedVecPairs.map(([vecA, vecB], ind) => {
			const [angle, camA, camB] = inputTuples[ind];
			return [Shapes.delta(vecA, camA), Shapes.delta(vecB, camB)];
		});
		inputTuples.forEach(([angle, camA, camB], ind) => {
			const [deltaA, deltaB] = rotatedVecDiffs[ind];
			Shapes.linear_combination(camA, deltaA, 1, 1).forEach((v,i) => camA[i]=v);
			Shapes.linear_combination(camB, deltaB, 1, 1).forEach((v,i) => camB[i]=v);
		});
		Shapes.normalize_inplace(this.dirX, 0);
		Shapes.normalize_inplace(this.dirY, 0);
		Shapes.normalize_inplace(this.dirZ, 0);
		*/
		this.updateView();
	}

	// get ray direction based on x,y position on canvas.
	// (range: [-1.0,+1.0], 'x' should include aspect-ratio)
	getRayDirection(mxy) {
		// TODO: this doesnt work, as it requires a proper understanding of the projection being used...
		// for now Ive placed the camera far away so that the approximation holds,
		// but for large FOV (0.1 to 0.5) it is clearly a flawed approximation.
		// TODO: create function for getting the inverse of a transformation matrix.
		const [x,y] = mxy;
		const vx = new Float32Array([...this.dirX]);
		const vy = new Float32Array([...this.dirY]);
		const vz = new Float32Array([...this.dirZ]);
		const ax = x * (this.FOV/2) * (2.0 * Math.PI);
		const ay = y * (this.FOV/2) * (2.0 * Math.PI);
		this.bivector_rotation_inplace(vz, vx, Math.sin(ax), Math.cos(ax));
		this.bivector_rotation_inplace(vz, vy, Math.sin(ay), Math.cos(ay));
		return vz;
	}

	bivector_rotation_inplace(vecA, vecB, s/*sin*/, c/*cosine*/) {
		for(let i=0;i<3;i++) {
			const a = vecA[i];
			const b = vecB[i];
			vecA[i] = a*c + b*s;
			vecB[i] = b*c - a*s;
		}
	}
};
