
const BUFFER_TARGET = {
	// Buffer containing vertex attributes, such as vertex coordinates,
	// texture coordinate data, or vertex color data.
	ARRAY_BUFFER:	GL.ARRAY_BUFFER,
	// Buffer used for element indices.
	INDEX_BUFFER:	GL.ELEMENT_ARRAY_BUFFER,
};

const BUFFER_USAGE = {
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

const BUFFER_PARAM = {
	BUFFER_SIZE:	GL.BUFFER_SIZE,
	BUFFER_USAGE:	GL.BUFFER_USAGE,
};

class BufferUtil {
	static getBufferParam(gl, target, buffer, param) {
		gl.bindBuffer(target, buffer);
		return gl.getBufferParameter(target, param);
	}
	static getBufferSize (gl, target, buffer) { return Buffer.getBufferParam(gl, target, buffer, BUFFER_PARAM.BUFFER_SIZE); }
	static getBufferUsage(gl, target, buffer) { return Buffer.getBufferParam(gl, target, buffer, BUFFER_PARAM.BUFFER_USAGE); }
	static createBuffer(gl, byteLength, target, usage) {
		const buffer = gl.createBuffer();
		gl.bindBuffer(target, buffer);
		gl.bufferData(target, byteLength, usage);
		return buffer;
	}
};

class Buffer {
	constructor(glContext, arrayType, arrayLength, target, usage) {
		this.glContext		= glContext;
		this.target			= target;
		this.usage			= usage;
		this.arrayType		= arrayType;
		this.data			= new arrayType(arrayLength);// client-side data to be sent to buffer.
		this.buffer			= BufferUtil.createBuffer(glContext, this.data.byteLength, target, usage);
		this.dataPos		= 0;// amount of data (and current write position) in the data stack.
		this.bufferPos		= 0;// amount of data that has been committed to backing buffer.
	}
	get BYTES_PER_ELEMENT() {
		return this.arrayType.BYTES_PER_ELEMENT;
	}
	get GL_ENUM_TYPE() {
		return GL_ARRAY_ENUM_TYPE(this.arrayType);
	}
	updateBufferData(src, isrc, len, ofs) {
		const dst_offset = ofs  * this.BYTES_PER_ELEMENT;
		const src_offset = isrc;
		const src_length = len;
		const gl = this.glContext;
		gl.bindBuffer(this.target, this.buffer);
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bufferSubData
		gl.bufferSubData(this.target, dst_offset, src, src_offset, src_length);
	}
	resize(newLength, copy=false, force=false) {
		newLength = Math.ceil(newLength);
		const oldLength = this.data.length;
		if(force || newLength > oldLength) {
			console.debug("[Buffer.resize] newLength", newLength);
			this.data = ArrayUtil.resize(this.data, newLength, copy);
			this.buffer = BufferUtil.createBuffer(this.glContext, this.data.byteLength, this.target, this.usage);
			this.dataPos = copy ? Math.min(this.dataPos, oldLength) : 0;
			this.bufferPos = 0;// data will need to be re-added to buffer since it was cleared when re-allocated.
			return true;
		}
		return false;
	}
	clear() {
		this.dataPos = 0;
		this.bufferPos = 0;
	}
	reserve(reqLength, copy=true) {
		const newLength = this.dataPos + reqLength;
		if(newLength > this.data.length) this.resize((newLength*3)/2 + 32, copy);
	}
	// add data from external sources.
	reserveAndPushData(src, isrc, len) {
		this.reserve(len, true);
		ArrayUtil.memcopy(this.data, this.dataPos, src, isrc, len);
		this.dataPos += len;
		return this.dataPos;
	}
	// commit all new data to buffer.
	commitNewDataToBuffer() {
		const ofs = this.bufferPos;
		const len = this.dataPos - this.bufferPos;
		this.updateBufferData(this.data, ofs, len, ofs);
		this.bufferPos = this.dataPos;
	}
};

class AttributeBuffer extends Buffer {
	constructor(glContext, arrayType, arrayLength, usage, shaderConfig, attributeNames) {
		super(glContext, arrayType, arrayLength, BUFFER_TARGET.ARRAY_BUFFER, usage);
		this.attributeNames	= attributeNames;
		this.vertexSize		= shaderConfig.getAttributeLayoutStride(attributeNames);
		this.vertexLength	= this.vertexSize / this.BYTES_PER_ELEMENT;
	}
	get vertexCount() {
		return this.dataPos / this.vertexLength;
	}
};

class IndexBuffer extends Buffer {
	constructor(glContext, arrayType, arrayLength, usage) {
		super(glContext, arrayType, arrayLength, BUFFER_TARGET.INDEX_BUFFER, usage);
	}
	get indexCount() {
		return this.dataPos;
	}
	reserveAndPushData(src, isrc, len, vertexOffset=0) {
		const beg = this.dataPos;// write position before pushing data.
		super.reserveAndPushData(src, isrc, len);
		const end = this.dataPos;// write position after pushing data.
		if(vertexOffset !== 0) for(let i=beg;i<end;i++) this.data[i] += vertexOffset;
	}
};

