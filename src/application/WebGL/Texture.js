
const TEXTURE_FORMAT = {
	RGB			: GL.RGB,
	RGBA		: GL.RGBA,
	ALPHA		: GL.ALPHA,
	LUMINANCE	: GL.LUMINANCE,
	LUM_ALPHA	: GL.LUMINANCE_ALPHA,
};

const TEXTURE_TYPE = {
	UNSIGNED_BYTE	: GL.UNSIGNED_BYTE,
	U_SHORT_4444	: GL.UNSIGNED_SHORT_4_4_4_4,
	U_SHORT_5551	: GL.UNSIGNED_SHORT_5_5_5_1,
	U_SHORT_565		: GL.UNSIGNED_SHORT_5_6_5,
};

class TextureBuffer {
	constructor(gl) {
		this.glContext = gl;
		this.texture = gl.createTexture();
	}
	configureTexture(w, h) {
		const gl = this.glContext;
		// configure some texture parameters based on WebGL1 limitations
		const isPowerOf2_w = (w & (w - 1)) === 0;
		const isPowerOf2_h = (h & (h - 1)) === 0;
		if(isPowerOf2_w && isPowerOf2_h) {
			// can generate mipmaps if power of 2
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		} else {
			// (WebGL1) cannot generate mipmaps, and some texture parameters are
			// not available to non 2^x textures.
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	}
	setTextureData(w, h, data, format=TEXTURE_FORMAT.RGBA, type=TEXTURE_TYPE.UNSIGNED_BYTE) {
		const gl = this.glContext;
		const level = 0;
		const border = 0;
		const internalFormat = format;
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		// Note: any of the following can be used as data:
		// ImageData, HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageBitmap.
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, w, h, border, format, type, data);
		this.configureTexture(w, h);
	}
	async setTextureUrl(url, format=TEXTURE_FORMAT.RGBA, type=TEXTURE_TYPE.UNSIGNED_BYTE) {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => {
				try {
					const gl = this.glContext;
					const level = 0;
					const internalFormat = format;
					gl.bindTexture(gl.TEXTURE_2D, this.texture);
					// flip image pixels into the bottom-to-top order that WebGL expects
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
					gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, image);
					this.configureTexture(image.width, image.height);
					resolve(image);
				} catch(error) {
					reject(error);
				}
			};
			image.onerror = (error) => {
				reject(error);
			};
			image.src = url;
		});
	}
};

