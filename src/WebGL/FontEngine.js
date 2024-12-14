
var FONT_FAMILY = {
	CURSIVE		: "cursive",
	COURIER		: "courier",
	FANTASY		: "fantasy",
	MATH		: "math",
	MONO		: "mono",
	MONOSPACE	: "monospace",
	SANS		: "sans",
	SERIF		: "serif",
	SYSTEM_UI	: "system-ui",
};

var FONT_STYLE = {
	NONE	: "",
	BOLD	: "bold",
	ITALIC	: "italic",
	CAPS	: "small-caps",
};

var FONT_BASELINE = {
	ALPHABETIC	: "alphabetic",
	IDEAGRAPHIC	: "ideagraphic",
	HANGING		: "hanging",
	BOTTOM		: "bottom",
	MIDDLE		: "middle",
	TOP			: "top",
};

var CanvasWrapper = class {
	constructor(w, h, id) {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		canvas.width = w;
		canvas.height = h;
		canvas.id = id;
		this.canvas = canvas;
		this.ctx = context;
	}
	
	// ============================================================
	// styling
	// ------------------------------------------------------------
	
	fillStyle(style) { this.ctx.fillStyle = style; }
	fillStyle_rgba(r,g,b,a) { this.fillStyle(`rgba(${r*255},${g*255},${b*255},${a})`); }
	fillStyle_hex (r,g,b,a) { this.fillStyle(`rgba(${r},${g},${b},${a/255})`); }
	
	lineWidth(width) { this.ctx.lineWidth = width; }
	lineStyle(style) { this.ctx.strokeStyle = style; }
	lineStyle_rgba(r,g,b,a) { this.lineStyle(`rgba(${r*255},${g*255},${b*255},${a})`); }
	lineStyle_hex (r,g,b,a) { this.lineStyle(`rgba(${r},${g},${b},${a/255})`); }
	
	// ============================================================
	// rectangles
	// ------------------------------------------------------------
	
	 fillRect(left, top, w, h) { this.ctx.  fillRect(left, top, w, h); }
	 lineRect(left, top, w, h) { this.ctx.strokeRect(left, top, w, h); }
	clearRect(left, top, w, h) { this.ctx. clearRect(left, top, w, h); }
	
	// ============================================================
	// paths
	// ------------------------------------------------------------
	
	path(arr, closePath=true) {
		this.ctx.beginPath();
		if(arr.length < 2) return;
		this.ctx.moveTo(arr[0], arr[1]);
		for(let i=1;i<arr.length;i++) this.ctx.lineTo(arr[i*2+0], arr[i*2+1]);
		if(closePath) this.ctx.closePath();
	}
	fillPath(arr) { this.path(arr); this.ctx.fill(); }
	linePath(arr) { this.path(arr); this.ctx.stroke(); }
	
	arc(x, y, radius, begAngle, endAngle, clockwise, closePath=true) {
		this.ctx.beginPath();
		begAngle *= 2.0 * Math.PI;
		endAngle *= 2.0 * Math.PI;
		if(clockwise) {
			endAngle = -endAngle;
			begAngle = -begAngle;
		}
		this.ctx.arc(x, y, radius, begAngle, endAngle, clockwise);
		this.ctx.closePath();
	}
	arcTo(x1, y1, x2, y2, radius) {
		this.ctx.arcTo(x1, y1, x2, y2, radius);
	}
	fillArc(x, y, radius, startAngle, endAngle, clockwise, closePath=true) {
		this.arc(x, y, radius, startAngle, endAngle, clockwise, closePath);
		this.ctx.fill();
	}
	lineArc(x, y, radius, startAngle, endAngle, clockwise, closePath=false) {
		this.arc(x, y, radius, startAngle, endAngle, clockwise, closePath);
		this.ctx.stroke();
	}
	
	// ============================================================
	// text
	// ------------------------------------------------------------
	
	setFont(height, family, style=FONT_STYLE.NONE, baseline=FONT_BASELINE.TOP) {
		this.ctx.font = `${height}px ${style} ${family}`;
		this.ctx.textBaseline = baseline;
	}
	getTextWidth(str) {
		const textMetrics = this.ctx.measureText(str);
		return textMetrics.width;
	}
	fillText(str, x, y) {
		this.ctx.fillText(str, x, y);
	}
	lineText(str, x, y) {
		this.ctx.strokeText(str, x, y);
	}
	
	// ============================================================
	// image data
	// ------------------------------------------------------------
	
	getImageData(x, y, w, h) {
		return this.ctx.getImageData(x, y, w, h);
	}
	putImageData(data, x=0, y=0) {
		this.ctx.putImageData(data, x, y);
	}
	static getImageDataValue(data, w, h, x, y, c) {
		return data[y*w*4 + x*4 + c];
	}
	toDataURL() {
		return this.canvas.toDataURL("image/png");
	}
	
};

var FontGlyphData = class {
	constructor() {
		this.texCoords		= new Float32Array(6);// [x,y,w,h,texHeight,texAspectRatio]
	}
	get widthRatio() {
		return (this.texCoords[2] / this.texCoords[3]) * this.texCoords[5];
	}
	setTexCoords(x,y,w,h,tw,th) {
		this.texCoords.set([x,y,w,h,th,(tw/th)], 0);
	}
};

var FontRenderer = class {
	constructor(glContext, charset, height, family, style) {
		this.glContext	= glContext;
		this.glyphmap	= new Map();// Map<char, FontGlyphData>
		this.texBuffer	= new TextureBuffer(glContext);
		this.height		= height;	// font height (in pixels)
		this.family		= family;	// font family
		this.style		= style;	// font style
		this.initialize(charset);
	}
	initialize(charset) {
		// create blank glyphmap
		const chars = [...charset.keys()];
		this.glyphmap.clear();
		for(const c of chars) this.glyphmap.set(c, new FontGlyphData());
		// create temporary canvas, with text bottom-left aligned.
		const canvasWrapper = new CanvasWrapper(0, 0, "FontEngine_initialize_canvas");
		canvasWrapper.setFont(this.height, this.family, this.style, FONT_BASELINE.BOTTOM);
		// determine required texture dimensions, and locate characters in texture
		const padding = Math.ceil(this.height * 0.1);
		let texW = 64;
		let texH = 64;
		let done = false;
		while(!done) {
			const h = this.height;	// text height
			let x = 0;				// text x-position
			let y = 0;				// text y-position
			let textureTooSmall = false;
			// accumulate offsets of characters, wrapping to next line,
			// until full charset is accounted for or texture is found to be too small.
			for(const c of chars) {
				const w = canvasWrapper.getTextWidth(c);
				// start new line if needed
				if(x + w > texW) { x=0; y+=h; }
				// set texture coordinates
				const mx = 1.0 / texW;
				const my = 1.0 / texH;
				this.glyphmap.get(c).setTexCoords(x*mx, y*my, w*mx, h*my, texW, texH);
				// check if character fits
				if(w     > texW) { textureTooSmall=true; break; }// width of this character wont fit
				if(y + h > texH) { textureTooSmall=true; break; }// height of this line wont fit
				// advance x position by character-width
				x += (w + padding);
			}
			if(textureTooSmall) {
				if(texW <= texH)	texW *= 2;
				else				texH *= 2;
			} else {
				done = true;
			}
		}
		// configure canvas
		canvasWrapper.canvas.width = texW;
		canvasWrapper.canvas.height = texH;
		canvasWrapper.setFont(this.height, this.family, this.style, FONT_BASELINE.BOTTOM);
		// add canvas to DOM (for testing)
		/*
		document.body.appendChild(canvasWrapper.canvas);
		canvasWrapper.canvas.style = "position: absolute; top: 200px; background: #000; left: 50px; outline: 1px solid antiquewhite;"
		//*/
		// draw characters to canvas
		canvasWrapper.fillStyle_hex(255,255,255,255);
		canvasWrapper.lineStyle_hex(255,255,255,127);
		for(const c of chars) {
			const g = this.glyphmap.get(c);
			const x = g.texCoords[0] * texW;
			const y = g.texCoords[1] * texH;
			canvasWrapper.fillText(c, x, texH - y);
			// draw boxes around characters (for testing)
			/*
			const w = g.texCoords[2] * texW;
			const h = g.texCoords[3] * texH;
			canvasWrapper.lineRect(x, texH - y - h, w, h);
			//*/
		}
		// tranfer image data to texture buffer
		const imageData = canvasWrapper.getImageData(0, 0, texW, texH);
		const numPixels = texW * texH;
		const data = new Uint8Array(numPixels * 2);
		for(let i=0;i<numPixels;i++) {
			data[i*2+0] = imageData.data[i*4+0];
			data[i*2+1] = imageData.data[i*4+3];
		}
		this.texBuffer.setTextureData(
			imageData.width, imageData.height, data,
			TEXTURE_FORMAT.LUM_ALPHA, TEXTURE_TYPE.UNSIGNED_BYTE
		);
	}
	// adds all the characters from string that are not in glyphmap to charset
	getRequiredGlyphs(charset, str) {
		for(let i=0;i<str.length;i++) if(!this.glyphmap.has(str[i])) charset.add(str[i]);
	}
	// add any new glyphs from charset which are not in glyphmap, then re-initialize
	addRequiredGlyphs(charset) {
		if(charset.size <= 0) return false;
		const newCharset = new Set(this.glyphmap.keys());
		for(const c of charset.keys()) newCharset.add(c);
		if(newCharset.size > this.glyphmap.size) {
			console.debug("addRequiredGlyphs(charset)", charset);
			this.initialize(newCharset);
			return true;
		}
		return false;
	}
	// get total width of text.
	getTotalWidth(str, height, widthMult) {
		let x = 0;
		for(let i=0;i<str.length;i++) {
			const c = str[i];
			const g = this.glyphmap.get(c);
			const w = height * g.widthRatio * widthMult;
			x+=w;
		}
		return x;
	}
	
	// generate 2d text then apply 3d transformation.
	generateVertexData3d(str, height, widthMult, boundingRect, textAlignment, rectOrigin, wrap, vecOffset, vecBasisX, vecBasisY) {
		// move bounding rectangle to origin so that basis vectors apply correctly.
		vecOffset = new Float32Array(vecOffset);// clone so that original is not mutated.
		vecOffset[0] += boundingRect.x;
		vecOffset[1] += boundingRect.y;
		const x1 = 0;
		const y1 = 0;
		const x2 = boundingRect.w;
		const y2 = boundingRect.h;
		// generate lines of 2D text.
		const VERT_STRIDE = 3;
		const TEXC_STRIDE = 2;
		const vlength = str.length * 4 * VERT_STRIDE;
		const tlength = str.length * 4 * TEXC_STRIDE;
		const ilength = str.length * 6;
		let vdata = new Float32Array(vlength);
		let tdata = new Float32Array(tlength);
		let idata = new  Uint32Array(ilength);
		const INDS = new Uint32Array([0,1,2,2,3,0]);
		let vcount = 0;
		let tcount = 0;
		let icount = 0;
		let x = x1;
		let y = y2 - height;
		let linedata = [];// [vcount, x, y, ...]
		for(let i=0;i<str.length;i++) {
			const c = str[i];
			const g = this.glyphmap.get(c);
			const w = height * g.widthRatio * widthMult;
			const h = height;
			// start new line if needed
			if((x + w > x2) & wrap) { linedata.push(vcount,x,y); x=x1; y-=height; }
			if((c === "\n")       ) { linedata.push(vcount,x,y); x=x1; y-=height; continue; }
			// push character data
			const [tx,ty,tw,th] = g.texCoords;// x,y,w,h
			const vofs = vcount * VERT_STRIDE;
			const tofs = tcount * TEXC_STRIDE;
			const iofs = icount;
			vdata.set([
				x + 0, y + 0, 0,
				x + w, y + 0, 0,
				x + w, y + h, 0,
				x + 0, y + h, 0,
			], vofs);
			tdata.set([
				tx +  0, ty +  0,
				tx + tw, ty +  0,
				tx + tw, ty + th,
				tx +  0, ty + th,
			], tofs);
			for(let q=0;q<6;q++) idata[iofs+q] = INDS[q] + vcount;
			vcount += 4;
			tcount += 4;
			icount += 6;
			// advance
			x += w;
		}
		// push last line.
		linedata.push(vcount,x,y);
		// reposition text to align with alignmentPoint
		let vc_ind=0;
		let line_ind=0;
		while(line_ind < linedata.length) {
			const vc = linedata[line_ind*3+0];
			const lx = linedata[line_ind*3+1];
			const ly = linedata[line_ind*3+2];
			line_ind++;
			const h = height;
			const rect_w = x2 - x1;
			const rect_h = y2 - y1;
			const leftover_w = x2 - lx;	// leftover width on line
			const leftover_h = y;		// leftover height on rect
			const xofs = +textAlignment[0] * leftover_w - rectOrigin[0] * rect_w;
			const yofs = -textAlignment[1] * leftover_h - rectOrigin[1] * rect_h;
			while(vc_ind < vc) {
				const i = vc_ind*VERT_STRIDE;
				vdata[i+0] += xofs;
				vdata[i+1] += yofs;
				vc_ind++;
			}
		}
		// clip text that is out of bounding rect
		// (remove vertices from vdata, and adjust vcount)
		// ... TODO ...
		// apply offset and 3d basis vectors.
		const VERT_STRIDE_3D = 3;
		for(let i=0;i<vcount;i++) {
			const x = vdata[i*VERT_STRIDE_3D + 0];
			const y = vdata[i*VERT_STRIDE_3D + 1];
			const ofs = i * VERT_STRIDE_3D;
			vdata[ofs+0] = vecOffset[0] + vecBasisX[0]*x + vecBasisY[0]*y;
			vdata[ofs+1] = vecOffset[1] + vecBasisX[1]*x + vecBasisY[1]*y;
			vdata[ofs+2] = vecOffset[2] + vecBasisX[2]*x + vecBasisY[2]*y;
		}
		return { vdata, vcount, tdata, tcount, idata, icount };
	}
};

// ============================================================
// tests
// ------------------------------------------------------------

function testCanvasWrapper() {
	var cv = new CanvasWrapper(512, 512, "canvas_testCanvasWrapper");
	window.cv = cv;
	cv.canvas.style.border = "1px solid antiquewhite";
	document.getElementById(cv.canvas.id)?.remove();
	document.body.appendChild(cv.canvas);
	
	// rectangles
	cv.fillStyle_hex(255,255,255,127);
	cv.lineStyle_hex(255,111,111,255);
	cv.lineWidth(2);
	cv.fillRect( 50,  10, 200, 300);
	cv.fillRect(150, 110, 200, 300);
	cv.lineRect( 50,  10, 200, 300);
	cv.lineRect(150, 110, 200, 300);

	// triangles
	cv.fillStyle_hex(255,255,177,127);
	var path = [
		150, 100,
		200, 200,
		100, 200,
	];
	cv.fillPath(path);
	cv.linePath(path);

	// arcs
	cv.fillStyle_hex(0,255,0,127);
	cv.fillArc(350, 250, 50, 0.10, 0.75, false, true);
	cv.lineArc(350, 250, 50, 0.10, 0.75, false, true);
	cv.fillStyle_hex(0,0,255,127);
	cv.fillArc(250, 250, 50, 0.10, 0.75, true, true);
	cv.lineArc(250, 250, 50, 0.10, 0.75, true, true);

	// text
	cv.lineWidth(1);
	cv.lineStyle_hex(255,255,255,255);
	cv.fillStyle_hex(255,177,255,255);
	var str = "abc123_hijk.?,";
	var x = 10;
	var y = 400;
	var h = 50;
	cv.setFont(h, FONT_FAMILY.SERIF, FONT_STYLE.NONE, FONT_BASELINE.TOP);
	var w = cv.getTextWidth(str);
	cv.lineRect(x, y, w, h);
	cv.fillText(str, x, y);
	cv.lineText(str, x, y);
	cv.fillText(str, x + 0, y + h);
	cv.fillText(str, x + w, y + 0);
	cv.fillText(str, x + w, y + h);
}



