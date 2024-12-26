
// TODO: bundle into a class

let cameraAspectRatio = 1.0;
let cameraFOV	= 7.0 / 360.0;
let cameraZNear	= 0.1;
let cameraZFar	= 1000.0;// default: 100.0
let cameraPos	= new Float32Array([0,0,-100]);
let cameraLookX	= new Float32Array([1,0,0]);// right
let cameraLookY	= new Float32Array([0,1,0]);// up
let cameraLookZ	= new Float32Array([0,0,1]);// foreward
let cameraMatrixProj	= mat4.create();
let cameraMatrixView	= mat4.create();
let cameraMatrix		= mat4.create();

function updateCameraAspectRatio(w, h) {
	cameraAspectRatio = w / h;
}

function updateCameraProjMatrix() {
	const fov	= cameraFOV;
	const zNear	= cameraZNear;
	const zFar	= cameraZFar;
	const fieldOfView = fov * (2.0 * Math.PI);
	const aspectRatio = cameraAspectRatio;
	mat4.perspective(cameraMatrixProj, fieldOfView, aspectRatio, zNear, zFar);
	mat4.scale(cameraMatrixProj, cameraMatrixProj, [-1.0, 1.0, 1.0]);// x is inverted in WebGL ... why?
}

function updateCameraViewMatrix() {
	const eyePosition	= vec3.fromValues(...cameraPos);
	const focalPoint	= vec3.fromValues(...cameraPos.map((v,i) => v + cameraLookZ[i]));
	const upAxis		= vec3.fromValues(...cameraLookY);
	mat4.lookAt(cameraMatrixView, eyePosition, focalPoint, upAxis);
}

function updateCameraMatrix() {
	mat4.identity(cameraMatrix);
	mat4.multiply(cameraMatrix, cameraMatrixView, cameraMatrix);
	mat4.multiply(cameraMatrix, cameraMatrixProj, cameraMatrix);
}

function initializeCamera() {
	cameraMatrixProj	= mat4.create();
	cameraMatrixView	= mat4.create();
	cameraMatrix		= mat4.create();
	updateCameraProjMatrix();
	updateCameraViewMatrix();
	updateCameraMatrix();
}

function applyCameraMatrix(mat) {
	mat4.multiply(mat, cameraMatrix, mat);
}

// translate camera
function cameraTranslate(x,y,z) {
	cameraPos[0] += x;
	cameraPos[1] += y;
	cameraPos[2] += z;
	updateCameraViewMatrix();
	updateCameraMatrix();
}

// rotate look direction
function cameraRotate(angleZX, angleZY, angleYX) {
	const inputTuples = [
		[angleZY, cameraLookZ, cameraLookY],
		[angleZX, cameraLookZ, cameraLookX],
		[angleYX, cameraLookY, cameraLookX],
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
	Shapes.normalize_inplace(cameraLookX, 0);
	Shapes.normalize_inplace(cameraLookY, 0);
	Shapes.normalize_inplace(cameraLookZ, 0);
	*/
	updateCameraViewMatrix();
	updateCameraMatrix();
}

// move in apparent direction from perspective of camera
function cameraMove(x,y,z) {
	for(let i=0;i<3;i++) cameraPos[i] += (cameraLookX[i]*x + cameraLookY[i]*y + cameraLookZ[i]*z);
	updateCameraViewMatrix();
	updateCameraMatrix();
}

// change FOV by zoom amount
function cameraZoom(mag) {
	// zoom should slow down as FOV approaches 180deg (i.e. 0.5 revolutions)
	const mult = (mag - 1.0) * Math.cos((cameraFOV * 2) * (2.0 * Math.PI / 4));
	cameraFOV = Math.min(cameraFOV * (mult + 1.0), 0.49);
	updateCameraProjMatrix();
	updateCameraMatrix();
}

// get ray direction based on x,y position on canvas.
// (range: [-1.0,+1.0], 'x' should include aspect-ratio)
function getCameraRayDirection(mxy) {
	// TODO: this doesnt work, as it requires a proper understanding of the projection being used...
	// for now Ive placed the camera far away so that the approximation holds,
	// but for large FOV (0.1 to 0.5) it is clearly a flawed approximation.
	// TODO: create function for getting the inverse of a transformation matrix.
	const [x,y] = mxy;
	const vx = new Float32Array([...cameraLookX]);
	const vy = new Float32Array([...cameraLookY]);
	const vz = new Float32Array([...cameraLookZ]);
	const ax = x * (cameraFOV/2) * (2.0 * Math.PI);
	const ay = y * (cameraFOV/2) * (2.0 * Math.PI);
	VectorUtil.bivector_rotation_inplace(vz, vx, Math.sin(ax), Math.cos(ax));
	VectorUtil.bivector_rotation_inplace(vz, vy, Math.sin(ay), Math.cos(ay));
	return vz;
}


