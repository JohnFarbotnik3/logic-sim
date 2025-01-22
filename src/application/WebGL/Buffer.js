
export const GL = WebGL2RenderingContext;

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

export const BUFFER_TARGET = {
	// Buffer containing vertex attributes, such as vertex coordinates,
	// texture coordinate data, or vertex color data.
	ARRAY_BUFFER:	GL.ARRAY_BUFFER,
	// Buffer used for element indices.
	INDEX_BUFFER:	GL.ELEMENT_ARRAY_BUFFER,
};

export const BUFFER_USAGE = {
	// The contents are intended to be specified once by the application,
	// and used many times as the source for WebGL drawing and image specification commands.
	STATIC_DRAW:	GL.STATIC_DRAW,
	// The contents are intended to be respecified repeatedly by the application,
	// and used many times as the source for WebGL drawing and image specification commands.
	DYNAMIC_DRAW:	GL.DYNAMIC_DRAW,
	// The contents are intended to be specified once by the application,
	// and used at most a few times as the source for WebGL drawing and image specification commands.
	STREAM_DRAW:	GL.STREAM_DRAW,
};

export const BUFFER_PARAM = {
	BUFFER_SIZE:	GL.BUFFER_SIZE,
	BUFFER_USAGE:	GL.BUFFER_USAGE,
};

export class Buffer {
	// ============================================================
	// utils.
	// ------------------------------------------------------------

	static getBufferParam(gl, target, buffer, param) {
		gl.bindBuffer(target, buffer);
		return gl.getBufferParameter(target, param);
	}
	static createBuffer(gl, byteLength, target, usage) {
		const buffer = gl.createBuffer();
		gl.bindBuffer(target, buffer);
		gl.bufferData(target, byteLength, usage);
		return buffer;
	}

	// ============================================================
	// structors
	// ------------------------------------------------------------

	constructor(glContext, arrayType, target, usage) {
		this.glContext		= glContext;
		this.target			= target;
		this.usage			= usage;
		this.arrayType		= arrayType;
		this.buffer			= null;
		this.bufferSize		= 0;// size of gpu-side buffer (bytes).
		// create empty buffer.
		this.resize_buffer(0);
	}
	get BYTES_PER_ELEMENT() {
		return this.arrayType.BYTES_PER_ELEMENT;
	}
	get GL_ENUM_TYPE() {
		return GL_ARRAY_ENUM_TYPE(this.arrayType);
	}
	// resize gpu-side buffer.
	resize_buffer(new_size) {
		this.buffer = Buffer.createBuffer(this.glContext, new_size, this.target, this.usage);
		this.bufferSize = new_size;
	}
	// commit data from external source directly.
	commitSrcDataToBuffer(src, ofs, len) {
		const gl = this.glContext;
		// ensure gpu-side buffer is large enough.
		// NOTE: data in old buffer is lost if new one is allocated.
		const old_size = this.bufferSize;
		const new_size = (ofs + len) * this.BYTES_PER_ELEMENT;
		if(new_size > old_size) this.resize_buffer(new_size);
		// commit data.
		const dst_offset = ofs * this.BYTES_PER_ELEMENT;
		const src_offset = ofs;
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bufferData
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bufferSubData
		gl.bindBuffer(this.target, this.buffer);
		gl.bufferSubData(this.target, dst_offset, src, src_offset, len);
	}
};

export class AttributeBuffer extends Buffer {
	constructor(glContext, arrayType, usage, attributeNames) {
		super(glContext, arrayType, BUFFER_TARGET.ARRAY_BUFFER, usage);
		this.attributeNames	= attributeNames;
	}
};

export class IndexBuffer extends Buffer {
	constructor(glContext, arrayType, usage) {
		super(glContext, arrayType, BUFFER_TARGET.INDEX_BUFFER, usage);
	}
};
