// why am I not allowed to define it in this file instead!?
import { GL } from "./Buffer";

export const GL_SIZEOF = (type) => {
	if(type === GL.FLOAT)			return Float32Array.BYTES_PER_ELEMENT;
	if(type === GL.UNSIGNED_INT)	return  Uint32Array.BYTES_PER_ELEMENT;
	if(type === GL.UNSIGNED_SHORT)	return  Uint16Array.BYTES_PER_ELEMENT;
	if(type === GL.UNSIGNED_BYTE)	return   Uint8Array.BYTES_PER_ELEMENT;
	if(type === GL.INT)				return   Int32Array.BYTES_PER_ELEMENT;
	if(type === GL.SHORT)			return   Int16Array.BYTES_PER_ELEMENT;
	if(type === GL.BYTE)			return    Int8Array.BYTES_PER_ELEMENT;
	return 0;
};

export const GL_ARRAY_ENUM_TYPE = (type) => {
	if(type === Float32Array)	return GL.FLOAT;
	if(type ===  Uint32Array)	return GL.UNSIGNED_INT;
	if(type ===  Uint16Array)	return GL.UNSIGNED_SHORT;
	if(type ===   Uint8Array)	return GL.UNSIGNED_BYTE;
	if(type ===   Int32Array)	return GL.INT;
	if(type ===   Int16Array)	return GL.SHORT;
	if(type ===    Int8Array)	return GL.BYTE;
	return GL.NONE;
};

export const GL_IS_FLOAT_TYPE = (type) => {
	return [
		GL.FLOAT,
	].includes(type);
};

export const GL_IS_INTEGER_TYPE = (type) => {
	return [
		GL.UNSIGNED_INT,
		GL.UNSIGNED_SHORT,
		GL.UNSIGNED_BYTE,
		GL.INT,
		GL.SHORT,
		GL.BYTE,
	].includes(type);
};

export const GL_DRAW_MODE = {
	TRIANGLES		: GL.TRIANGLES,
	TRIANGLE_STRIP	: GL.TRIANGLE_STRIP,
	TRIANGLE_FAN	: GL.TRIANGLE_FAN,
	LINES			: GL.LINES,
	LINE_STRIP		: GL.LINE_STRIP,
	LINE_LOOP		: GL.LINE_LOOP,
	POINTS			: GL.POINTS,
};

// TODO: figure out why colours have to be offset when drawing LINES.
// NOTE: this offset was required when drawing with u32 texture coordinates,
//   so it seems to be a driver problem where u32 data isnt handled correctly.
// WARNING: if interleaved data is getting mangled, or anything involving integer-
//   data in general, it may be the weird driver problem!
export const BROKEN_DRIVER_MYSTERY_OFFSET_U32 = 1;

export const GL_MAX_DRAW_INDEX_ELEMENTS = 30000000;



export * as mat4 from "../../3rdparty/toji-gl-matrix-007c2d0/dist/esm/mat4";
export * as vec3 from "../../3rdparty/toji-gl-matrix-007c2d0/dist/esm/vec3";
export * from "./Buffer";
export * from "./Texture";
export * from "./Camera";
export * from "./Shader";
export * from "./ShaderPackingUtil";
export * from "./shaders/Shader_pos_clr";
export * from "./shaders/Shader_pos_clr_tex";
export * from "./FontEngine";

