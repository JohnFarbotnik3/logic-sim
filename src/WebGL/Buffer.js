
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
		this.writePos		= 0;// amount of data (and current write position) in the data stack.
		this.bufferPos		= 0;// amount of data that has been committed to backing buffer.
	}
	get BYTES_PER_ELEMENT() {
		return this.arrayType.BYTES_PER_ELEMENT;
	}
	get GL_ENUM_TYPE() {
		return GL_ARRAY_ENUM_TYPE(this.arrayType);
	}
	resize(newLength, copy) {
		const oldLength = this.data.length;
		this.data = ArrayUtil.resize(this.data, Math.ceil(newLength), copy);
		this.buffer = BufferUtil.createBuffer(this.glContext, this.data.byteLength, this.target, this.usage);
		this.writePos = copy ? Math.min(this.writePos, oldLength) : 0;
		this.bufferPos = 0;// data will need to be re-added to buffer since it was cleared when re-allocated.
		return true;
	}
	clear() {
		this.writePos = 0;
		this.bufferPos = 0;
	}
	// add data from external sources.
	reserve(reqLength) {
		const newLength = this.writePos + reqLength;
		if(newLength > this.data.length) this.resize((newLength*3)/2 + 32, true);
	}
	pushData(src, isrc, len) {
		ArrayUtil.memcopy(this.data, this.writePos, src, isrc, len);
		this.writePos += len;
		return this.writePos;
	}
	reserveAndPushData(src, isrc, len) {
		this.reserve(len);
		this.pushData(src, isrc, len);
	}
	// commit all new data to buffer.
	commitNewDataToBuffer() {
		const ofs = this.bufferPos;
		const len = this.writePos - this.bufferPos;
		const src = this.data;
		const dst_offset = ofs  * this.BYTES_PER_ELEMENT;
		const src_offset = ofs;
		const gl = this.glContext;
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bufferData
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/bufferSubData
		gl.bindBuffer(this.target, this.buffer);
		gl.bufferSubData(this.target, dst_offset, src, src_offset, len);
		this.bufferPos = this.writePos;
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
		return this.writePos / this.vertexLength;
	}
};

class IndexBuffer extends Buffer {
	constructor(glContext, arrayType, arrayLength, usage) {
		super(glContext, arrayType, arrayLength, BUFFER_TARGET.INDEX_BUFFER, usage);
	}
	get indexCount() {
		return this.writePos;
	}
	pushData(src, isrc, len, vertexOffset=0) {
		const beg = this.writePos;// write position before pushing data.
		super.pushData(src, isrc, len);
		const end = this.writePos;// write position after pushing data.
		if(vertexOffset !== 0) for(let i=beg;i<end;i++) this.data[i] += vertexOffset;
	}
	reserveAndPushData(src, isrc, len, vertexOffset=0) {
		this.reserve(len);
		this.pushData(src, isrc, len, vertexOffset);
	}
};

