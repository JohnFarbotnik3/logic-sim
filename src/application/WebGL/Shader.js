
function throwIfMissingProperty(info) {
	for(const key of Object.keys(info)) {
		if(info[key] === undefined) throw(`missing attribute: ${key} is undefined`);
	}
}

export class ShaderConfig {
	constructor(config) {
		const { attribs, uniforms, vertSource, fragSource } = config;
		this.attribs	= new Map();
		this.uniforms	= new Map();
		this.vertSource	= vertSource;
		this.fragSource	= fragSource;
		// init attribute maps
		for(const { name, type, numComponents, normalize } of attribs) {
			const info = { name, type, numComponents, normalize };
			throwIfMissingProperty(info);
			this.attribs.set(name, info);
		}
		for(const { name } of uniforms) {
			const info = { name };
			throwIfMissingProperty(info);
			this.uniforms.set(name, info);
		}
	}
	getAttributeLayoutStride(attributeNames) {
		let stride = 0;// distance (in bytes) between each vertex in array
		for(const attributeName of attributeNames) {
			const { name, type, numComponents, normalize } = this.attribs.get(attributeName);
			stride += (numComponents * GL_SIZEOF(type));
		}
		return stride;
	}
	createAttributeLayout(attributeNames) {
		let layout = [];
		let stride = this.getAttributeLayoutStride(attributeNames);
		let offset = 0;// position (in bytes) of a given attribute in the array
		for(const attributeName of attributeNames) {
			const { name, type, numComponents, normalize } = this.attribs.get(attributeName);
			const info = { name, type, numComponents, normalize, stride, offset };
			layout.push(info);
			offset += (numComponents * GL_SIZEOF(type));
		}
		return layout;
	}
};

export class ShaderPipeline {
	constructor(gl, shaderConfig, attributeBuffers, indexBuffer, drawMode) {
		const { vertSource, fragSource, attribs, uniforms } = shaderConfig;
		this.glContext	= gl;
		this.config		= shaderConfig;
		this.program	= ShaderPipeline.initShaderProgram(gl, vertSource, fragSource);
		this.locations	= ShaderPipeline.getProgramBindingLocations(gl, this.program, attribs, uniforms);
		this.attributeBuffers	= attributeBuffers;
		this.indexBuffer		= indexBuffer;
		this.drawMode			= drawMode;
	}
	// program initialization
	static loadShader(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}
	static initShaderProgram(gl, vertSource, fragSource) {
		const vertShader = ShaderPipeline.loadShader(gl, GL.VERTEX_SHADER, vertSource);
		const fragShader = ShaderPipeline.loadShader(gl, GL.FRAGMENT_SHADER, fragSource);
		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertShader);
		gl.attachShader(shaderProgram, fragShader);
		gl.linkProgram(shaderProgram);
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
			return null;
		}
		return shaderProgram;
	}
	static getProgramBindingLocations(gl, shaderProgram, attribs, uniforms) {
		const locations = new Map();
		for(const name of attribs .keys()) locations.set(name, gl. getAttribLocation(shaderProgram, name));
		for(const name of uniforms.keys()) locations.set(name, gl.getUniformLocation(shaderProgram, name));
		return locations;
	}
	// switch current program
	static currentProgram = null;
	useProgram() {
		if(ShaderPipeline.currentProgram !== this.program) {
			this.glContext.useProgram(this.program);
			ShaderPipeline.currentProgram = this.program;
		}
	}
	// attribute binding
	bindAttributes(target, buffer, attributeLayout) {
		this.useProgram();
		const gl = this.glContext;
		gl.bindBuffer(target, buffer);
		for(const attributeInfo of attributeLayout) {
			const { name, type, numComponents, normalize, stride, offset } = attributeInfo;
			let Q={ name, type, numComponents, normalize, stride, offset };
			throwIfMissingProperty(Q);
			const location = this.locations.get(name);
			const isIntegerType = GL_IS_INTEGER_TYPE(type);
			if(isIntegerType)	gl.vertexAttribIPointer(location, numComponents, type, normalize, stride, offset);
			else				gl.vertexAttribPointer (location, numComponents, type, normalize, stride, offset);
			//console.log("ATTRIBUTE", location, attributeInfo);
			gl.enableVertexAttribArray(location);
		}
	}
	// uniform binding
	setUniform_mat4fv(gl, uniformName, data) {
		const info = this.config.uniforms.get(uniformName);
		const location = this.locations.get(uniformName);
		const { name } = info;
		let Q={ name };
		throwIfMissingProperty(Q);this.useProgram();
		this.useProgram();
		const transpose = false;
		gl.uniformMatrix4fv(location, transpose, data);
	}
	setUniform_texbuf(gl, uniformName, textureBuffer, textureUnit=GL.TEXTURE0) {
		const info = this.config.uniforms.get(uniformName);
		const location = this.locations.get(uniformName);
		const { name } = info;
		let Q={ name };
		throwIfMissingProperty(Q);
		this.useProgram();
		gl.activeTexture(textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, textureBuffer.texture);
		gl.uniform1i(location, 0);
	}
	// drawing
	bindAttributeBuffers() {
		// in WebGL, buffer bindings are shared across the entire GL instance,
		// rather than being per-pipeline (like in the Vulkan API).
		for(const attribBuffer of this.attributeBuffers) {
			const layout = this.config.createAttributeLayout(attribBuffer.attributeNames);
			this.bindAttributes(attribBuffer.target, attribBuffer.buffer, layout);
		}
	}
	drawElements() {
		this.bindAttributeBuffers();
		this.useProgram();
		const gl = this.glContext;
		const indexBuffer = this.indexBuffer;
		const indexType = indexBuffer.GL_ENUM_TYPE;// NOTE: only GL.UNSIGNED_SHORT is supported in webGL version 1
		const indexDrawMax = GL_MAX_DRAW_INDEX_ELEMENTS;
		const beg = 0;
		const end = indexBuffer.indexCount;
		gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, indexBuffer.buffer);
		for(let i=beg;i<end;i+=indexDrawMax) {
			const indexCount = Math.min(end-i, indexDrawMax);
			const indexOffset = i * indexBuffer.BYTES_PER_ELEMENT;
			gl.drawElements(this.drawMode, indexCount, indexType, indexOffset);
		}
	}
};

