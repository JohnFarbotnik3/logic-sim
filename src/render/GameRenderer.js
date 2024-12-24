
class GameRenderer {
	// ============================================================
	// Main functions
	// ------------------------------------------------------------
	
	static init() {
		// get WebGL instance.
		const canvas = GameUI.getCanvas();
		const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
		if (gl === null) {
			alert("Unable to initialize WebGL2. Your browser or machine may not support it.");
			return;
		}
		
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		
		// enable depth testing.
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);	// near things obscure far things
		gl.clearDepth(1.0);
		
		// enable alpha-blending.
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		// remove canvas background, since clearing with a coloured
		// fragment-shader can make gl colour data transparent.
		canvas.style.background = "unset";
		
		initializeCamera();
		const { width, height } = canvas.getClientRects()[0];
		updateCameraAspectRatio(width, height);
		
		this.init_buffers(gl);
	}
	
	static INDEX_NONE_SB = 0xffffffff;
	static INDEX_ROOT_SB = 0x0;

	static render() {
		// clear buffers.
		this.clear_buffers();
		// create draw data.
		const t0 = Date.now();
		const renblock = gameData.renderBlock;
		if(!renblock) throw("!renblock");
		const t1 = Date.now();
		GameRenderer.drawBlock(renblock, renblock.get_render_data_block(gameData.rootBlock), GameRenderer.INDEX_ROOT_SB);
		GameRenderer.drawCursor();
		if(gameControls.cursor_isSelecting) GameRenderer.drawDragArea();
		if(gameControls.cursor_mode === gameControls.CURSOR_MODE.SELECT) GameRenderer.drawSelection();
		if(gameControls.cursor_mode === gameControls.CURSOR_MODE.PLACE_CELL ) GameRenderer.drawPreviewCell();
		if(gameControls.cursor_mode === gameControls.CURSOR_MODE.PLACE_LINK ) GameRenderer.drawNearestLinkPoint();
		if(gameControls.cursor_mode === gameControls.CURSOR_MODE.PLACE_BLOCK) GameRenderer.drawPreviewBlock();
		GameRenderer.drawHovered();
		// commit data to buffers.
		const t2 = Date.now();
		this.commit_buffers();
		// clear canvas
		const gl = this.triangles_shader.glContext;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// update uniforms
		const matrix_model = this.matrix_model;
		mat4.identity(matrix_model);
		applyCameraMatrix(matrix_model);
		this.triangles_shader.setUniform_mat4fv(gl, "mvp", matrix_model);
		this.lines_shader    .setUniform_mat4fv(gl, "mvp", matrix_model);
		this.font_shader     .setUniform_mat4fv(gl, "mvp", matrix_model);
		this.font_shader     .setUniform_texbuf(gl, "texsampler", this.fontRenderer_0.texBuffer);
		// draw to canvas.
		this.triangles_shader.drawElements();
		this.lines_shader    .drawElements();
		this.font_shader     .drawElements();
		//gl.flush();// optional?
		const t3 = Date.now();
		Performance.increment_time("render.update", t1-t0);
		Performance.increment_time("render.gather", t2-t1);
		Performance.increment_time("render.draw", t3-t2);
	}
	
	// ============================================================
	// Buffers
	// ------------------------------------------------------------
	
	// TODO: have seperate MVP matrices, and a combined matrix to send to shader-uniform.
	static matrix_model	= mat4.create();

	static triangles_config	= Shader_pos_clr;
	static triangles_shader	= null;
	static triangles_buffer_ind	= null;
	static triangles_buffer_pos	= null;
	static triangles_buffer_clr	= null;

	static lines_config	= Shader_pos_clr;
	static lines_shader	= null;
	static lines_buffer_ind	= null;
	static lines_buffer_pos	= null;
	static lines_buffer_clr	= null;

	static font_config		= Shader_pos_clr_tex;
	static font_shader		= null;
	static fontRenderer_0	= null;
	
	static init_buffers(gl) {
		{
			const config = this.triangles_config;
			const usage = BUFFER_USAGE.DYNAMIC_DRAW;
			const buf_ind = new     IndexBuffer(gl,  Uint32Array, 0, usage);
			const buf_pos = new AttributeBuffer(gl, Float32Array, 0, usage, config, ["pos"]);
			const buf_clr = new AttributeBuffer(gl,  Uint32Array, 0, usage, config, ["clr"]);
			this.triangles_shader = new ShaderPipeline(gl, config, [buf_pos, buf_clr], buf_ind, GL_DRAW_MODE.TRIANGLES);
			this.triangles_buffer_ind = buf_ind;
			this.triangles_buffer_pos = buf_pos;
			this.triangles_buffer_clr = buf_clr;
		}
		{
			const config = this.lines_config;
			const usage = BUFFER_USAGE.DYNAMIC_DRAW;
			const buf_ind = new     IndexBuffer(gl,  Uint32Array, 0, usage);
			const buf_pos = new AttributeBuffer(gl, Float32Array, 0, usage, config, ["pos"]);
			const buf_clr = new AttributeBuffer(gl,  Uint32Array, 0, usage, config, ["clr"]);
			this.lines_shader = new ShaderPipeline(gl, config, [buf_pos, buf_clr], buf_ind, GL_DRAW_MODE.LINES);
			this.lines_buffer_ind = buf_ind;
			this.lines_buffer_pos = buf_pos;
			this.lines_buffer_clr = buf_clr;
		}
		{
			const config = this.font_config;
			const usage = BUFFER_USAGE.DYNAMIC_DRAW;
			const buf_ind = new     IndexBuffer(gl,  Uint32Array, 0, usage);
			const buf_pos = new AttributeBuffer(gl, Float32Array, 0, usage, config, ["pos"]);
			const buf_clr = new AttributeBuffer(gl,  Uint32Array, 0, usage, config, ["clr"]);
			const buf_tex = new AttributeBuffer(gl, Float32Array, 0, usage, config, ["tex"]);
			this.font_shader	= new ShaderPipeline(gl, config, [buf_pos, buf_clr, buf_tex], buf_ind, GL_DRAW_MODE.TRIANGLES);
			this.font_buffer_ind = buf_ind;
			this.font_buffer_pos = buf_pos;
			this.font_buffer_clr = buf_clr;
			this.font_buffer_tex = buf_tex;
			const charstr = "";
			const charset = new Set(charstr);
			this.fontRenderer_0 = new FontRenderer(gl, charset, 60, FONT_FAMILY.SERIF, FONT_STYLE.NONE);
		}
	}
	
	static clear_buffers() {
		// clear buffers.
		this.triangles_buffer_ind.clear();
		this.triangles_buffer_pos.clear();
		this.triangles_buffer_clr.clear();
		this.lines_buffer_ind.clear();
		this.lines_buffer_pos.clear();
		this.lines_buffer_clr.clear();
		this.font_buffer_ind.clear();
		this.font_buffer_pos.clear();
		this.font_buffer_clr.clear();
		this.font_buffer_tex.clear();
		// add initial mystery offsets to integer data.
		const Q = BROKEN_DRIVER_MYSTERY_OFFSET_U32;
		let buf, ofs;
		buf = this.triangles_buffer_clr;	ofs = Q * buf.vertexLength;	buf.reserveAndPushData(new Uint32Array(ofs), 0, ofs);
		buf = this.lines_buffer_clr;		ofs = Q * buf.vertexLength;	buf.reserveAndPushData(new Uint32Array(ofs), 0, ofs);
		buf = this.font_buffer_clr;			ofs = Q * buf.vertexLength;	buf.reserveAndPushData(new Uint32Array(ofs), 0, ofs);
	}
	
	static commit_buffers() {
		this.triangles_buffer_ind.commitNewDataToBuffer();
		this.triangles_buffer_pos.commitNewDataToBuffer();
		this.triangles_buffer_clr.commitNewDataToBuffer();
		this.lines_buffer_ind.commitNewDataToBuffer();
		this.lines_buffer_pos.commitNewDataToBuffer();
		this.lines_buffer_clr.commitNewDataToBuffer();
		this.font_buffer_ind.commitNewDataToBuffer();
		this.font_buffer_pos.commitNewDataToBuffer();
		this.font_buffer_clr.commitNewDataToBuffer();
		this.font_buffer_tex.commitNewDataToBuffer();
	}
	
	static DEPTH_ON_TOP = 33;
	static transform_vdata(tran, depth, vdata, beg, end) {
		if(tran) tran.apply(vdata, beg, end, 3);
		const zofs = depth * -0.01;
		for(let i=beg+2;i<end;i+=3) vdata[i] += zofs;
	}
	
	static triangles_reserve(ilen, vlen, clen) {
		this.triangles_buffer_ind.reserve(ilen);
		this.triangles_buffer_pos.reserve(vlen);
		this.triangles_buffer_clr.reserve(clen);
	}
	static triangles_push(idata, vdata, cdata) {
		this.triangles_buffer_ind.pushData(idata, 0, idata.length, this.triangles_buffer_pos.vertexCount);
		this.triangles_buffer_pos.pushData(vdata, 0, vdata.length);
		this.triangles_buffer_clr.pushData(cdata, 0, cdata.length);
	}
	static triangles_transform(tran, depth, length) {
		const buf	= this.triangles_buffer_pos;
		const beg	= buf.writePos - length;
		const end	= buf.writePos;
		this.transform_vdata(tran, depth, buf.data, beg, end);
	}
	
	static lines_reserve(ilen, vlen, clen) {
		this.lines_buffer_ind.reserve(ilen);
		this.lines_buffer_pos.reserve(vlen);
		this.lines_buffer_clr.reserve(clen);
	}
	static lines_push(idata, vdata, cdata) {
		this.lines_buffer_ind.pushData(idata, 0, idata.length, this.lines_buffer_pos.vertexCount);
		this.lines_buffer_pos.pushData(vdata, 0, vdata.length);
		this.lines_buffer_clr.pushData(cdata, 0, cdata.length);
	}
	static lines_transform(tran, depth, length) {
		const buf	= this.lines_buffer_pos;
		const beg	= buf.writePos - length;
		const end	= buf.writePos;
		this.transform_vdata(tran, depth, buf.data, beg, end);
	}
	
	// ============================================================
	// Shape generators
	// ------------------------------------------------------------
	
	// triangle-rectangles.
	static tri_rects_reserve(N) {
		const ilen = N*6;
		const vlen = N*4*3;
		const clen = N*4;
		this.triangles_reserve(ilen, vlen, clen);
	}
	static tri_rects_write(rect, clr) {
		const [x,y,w,h]	= rect;
		const idata = [0,1,2,2,3,0];
		const vdata = [
			x+0, y+0, 0.0,
			x+w, y+0, 0.0,
			x+w, y+h, 0.0,
			x+0, y+h, 0.0,
		];
		const cdata = [clr, clr, clr, clr];
		this.triangles_push(idata, vdata, cdata);
	}
	static tri_rects_transform(N, tran, depth) {
		this.triangles_transform(tran, depth, N*4*3);
	}
	static tri_rects_push(tran, depth, rect, clr) {
		this.tri_rects_reserve(1);
		this.tri_rects_write(rect, clr);
		this.tri_rects_transform(1, tran, depth);
	}
	
	// line-rectangles
	static line_rects_reserve(N) {
		const ilen = N*8;
		const vlen = N*4*3;
		const clen = N*4;
		this.lines_reserve(ilen, vlen, clen);
	}
	static line_rects_write(rect, clr) {
		const [x,y,w,h]	= rect;
		const idata = [0,1,1,2,2,3,3,0];
		const vdata = [
			x+0, y+0, 0.0,
			x+w, y+0, 0.0,
			x+w, y+h, 0.0,
			x+0, y+h, 0.0,
		];
		const cdata = [clr, clr, clr, clr];
		this.lines_push(idata, vdata, cdata);
	}
	static line_rects_transform(N, tran, depth) {
		this.lines_transform(tran, depth, N*4*3);
	}
	static line_rects_push(tran, depth, rect, clr) {
		this.line_rects_reserve(1);
		this.line_rects_write(rect, clr);
		this.line_rects_transform(1, tran, depth);
	}
	
	// TODO: replace
	static transform_and_push_lines(tran, depth, idata, vdata, cdata) {
		this.transform_vdata(tran, depth, vdata, 0, vdata.length);
		const voffset = this.lines_buffer_pos.vertexCount;
		this.lines_buffer_ind.reserveAndPushData(idata, 0, idata.length, voffset);
		this.lines_buffer_pos.reserveAndPushData(vdata, 0, vdata.length);
		this.lines_buffer_clr.reserveAndPushData(cdata, 0, cdata.length);
	}
	
	// TODO: replace
	static transform_and_push_font(tran, depth, idata, vdata, cdata, tdata) {
		this.transform_vdata(tran, depth, vdata, 0, vdata.length);
		const voffset = this.font_buffer_pos.vertexCount;
		this.font_buffer_ind.reserveAndPushData(idata, 0, idata.length, voffset);
		this.font_buffer_pos.reserveAndPushData(vdata, 0, vdata.length);
		this.font_buffer_clr.reserveAndPushData(cdata, 0, cdata.length);
		this.font_buffer_tex.reserveAndPushData(tdata, 0, tdata.length);
	}
	
	// lines
	static push_content_line(tran, depth, p0, p1, clr) {
		// generate data.
		const idata = [0,1];
		const vdata = [
			p0[0], p0[1], 0.0,
			p1[0], p1[1], 0.0,
		];
		const cdata = [clr, clr];
		// push data.
		this.transform_and_push_lines(tran, depth, idata, vdata, cdata);
	}
	
	// line grid
	static push_content_line_grid(tran, depth, rect, clr, nx, ny) {
		// generate data.
		const [x,y,w,h] = rect;
		const count = 2*(nx+1) + 2*(ny+1);
		const idata = new Array(count);
		const vdata = new Array(count * 3);
		const cdata = new Array(count).fill(clr);
		for(let i=0;i<count;i++) idata[i] = i;
		let i = 0;
		let px = x;
		const xincr = w / nx;
		for(let n=0;n<=nx;n++) {
			vdata[i+0] = px;	vdata[i+1] = y+0;	vdata[i+2] = 0;
			vdata[i+3] = px;	vdata[i+4] = y+h;	vdata[i+5] = 0;
			px += xincr;
			i+=6;
		}
		let py = y;
		const yincr = h / ny;
		for(let n=0;n<=ny;n++) {
			vdata[i+0] = x+0;	vdata[i+1] = py;	vdata[i+2] = 0;
			vdata[i+3] = x+w;	vdata[i+4] = py;	vdata[i+5] = 0;
			py += yincr;
			i+=6;
		}
		// push data.
		this.transform_and_push_lines(tran, depth, idata, vdata, cdata);
	}
	
	// line circle
	static push_content_line_circle(tran, depth, x, y, r, n, clr) {
		const idata = new Array(n*2);
		const vdata = new Array(n*3);
		const cdata = new Array(n).fill(clr);
		for(let i=0;i<n;i++) {
			idata[i*2+0] = i;
			idata[i*2+1] = i+1;
		}
		idata[n*2-1] = 0;
		let angle = 0.0;
		let aincr = Math.PI * 2.0 / (n-1);
		for(let i=0;i<n;i++) {
			vdata[i*3+0] = Math.cos(angle) * r + x;
			vdata[i*3+1] = Math.sin(angle) * r + y;
			vdata[i*3+2] = 0.0;
			angle += aincr;
		}
		// push data.
		this.transform_and_push_lines(tran, depth, idata, vdata, cdata);
	}
	
	static push_content_text_box(tran, depth, str, fontHeight, fontColour, boundingRect, textAlign, rectOrigin, wrap) {
		// add required characters.
		const fontRenderer = this.fontRenderer_0;
		const req = new Set();
		fontRenderer.getRequiredGlyphs(req, str);
		fontRenderer.addRequiredGlyphs(req);
		// generate data
		const widthMult = 1.0;
		const offset = [0.0, 0.0, 0.0];
		const xbasis = [1.0, 0.0, 0.0];
		const ybasis = [0.0, 1.0, 0.0];
		let {
			vdata, vcount,
			idata, icount,
			tdata,
		} = fontRenderer.generateVertexData3d(str, fontHeight, widthMult, boundingRect, textAlign, rectOrigin, wrap, offset, xbasis, ybasis);
		const cdata = new Array(vcount).fill(fontColour);
		// push data.
		this.transform_and_push_font(tran, depth, idata, vdata, cdata, tdata);
	}
	
	static push_content_text_box_against_circle(tran, depth, str, fontHeight, fontColour, unitRectPoint, dist) {
		// add required characters.
		const fontRenderer = this.fontRenderer_0;
		const req = new Set();
		fontRenderer.getRequiredGlyphs(req, str);
		fontRenderer.addRequiredGlyphs(req);
		// get width.
		const widthMult = 1.0;
		const strh = fontHeight;
		const strw = fontRenderer.getTotalWidth(str, fontHeight, widthMult);
		// get box position.
		const wrap = false;
		const [rx,ry] = unitRectPoint;
		const rectOrigin = [
			1.0 - (((rx - 0.5) * dist) + 0.5),
			1.0 - (((ry - 0.5) * dist) + 0.5),
		];
		const textAlign = [0.5, 0.5];
		const boundingRect = new Rectangle(rx, ry, strw, strh);
		// generate data
		const offset = [0.0, 0.0, 0.0];
		const xbasis = [1.0, 0.0, 0.0];
		const ybasis = [0.0, 1.0, 0.0];
		let {
			vdata, vcount,
			idata, icount,
			tdata,
		} = fontRenderer.generateVertexData3d(str, fontHeight, widthMult, boundingRect, textAlign, rectOrigin, wrap, offset, xbasis, ybasis);
		const cdata = new Array(vcount).fill(fontColour);
		// push data.
		this.transform_and_push_font(tran, depth, idata, vdata, cdata, tdata);
	}
	
	// ============================================================
	// Components
	// ------------------------------------------------------------
	
	static valueToHex_u32(value, len) {
		const hex = value.toString(16).toUpperCase();
		let pad = "0x";
		for(let x=hex.length;x<len;x++) pad += "0";
		return pad + hex;
	}
	static hexColour_scale(hex,m) {
		return (
			((((hex >> 24) & 0xff) * m) << 24) |
			((((hex >> 16) & 0xff) * m) << 16) |
			((((hex >>  8) & 0xff) * m) <<  8) |
			((((hex >>  0) & 0xff) * 1) <<  0)
		);
	}
	
	static drawCell(renderblock, renderData, simblock=GameRenderer.INDEX_NONE_SB) {
		const { cell, tran, numTargets } = renderData;
		const depth = renderblock.depth;
		// get cell values from simulation.
		const vals = [cell.value, 0x0, 0x0];
		if(simblock !== GameRenderer.INDEX_NONE_SB) {
			vals[0] = gameServer.simulation_get_cell_value(cell.id, simblock, 0);
			vals[1] = gameServer.simulation_get_cell_value(cell.id, simblock, 1);
			vals[2] = gameServer.simulation_get_cell_value(cell.id, simblock, 2);
		}
		const cell_clrs	= [0x0, 0x0, 0x0, 0xffeeccff, 0xffeeccff, 0xffeeccff];
		const clr_on	= cell.clr;
		const clr_off	= GameRenderer.hexColour_scale(clr_on, 0.5);
		for(let i=0;i<3;i++) cell_clrs[i] = vals[i] ? clr_on : clr_off;
		// draw cell areas + link points
		const N = 3 + numTargets;
		this.tri_rects_reserve(N);
		for(let n=0;n<N;n++) this.tri_rects_write(RenderTreeBlock.CELL_RECTS[n], cell_clrs[n]);
		this.tri_rects_transform(N, tran, depth);
		// draw text.
		/* TODO:
			- go back to using average scale factor of containing block instead of applying basis vectors.
		*/
		if(depth >= 2) return;// skip rendering text beyond depth 2.
		const isSelected = gameControls.collectionSelected.cells.has(cell) | renderblock.is_selected;
		const isHovered  = gameControls.collectionHovered .cells.has(cell) | renderblock.is_hovered;
		if(isSelected | isHovered | renderblock.is_selected | renderblock.is_hovered) {
			const fontHeight = 0.30;
			const fontColour = 0xffffffff;
			const wrap = false;
			const dist = 1.2;
			// draw type code.
			{
				const str = cell.typeString;
				const clr = fontColour;
				const unitRectPoint = [0.5, 1.0];
				this.push_content_text_box_against_circle(tran, depth, str, fontHeight, clr, unitRectPoint, dist);
			}
			// draw values.
			const labels = ["OUT:", "A:", "B:"];
			for(let i=0;i<numTargets;i++) {
				const str = labels[i] + GameRenderer.valueToHex_u32(vals[i], 8);
				const clr = fontColour & (vals[i] === 0 ? 0x777777ff : 0xffffffff);
				const unitRectPoint = [
					RenderTreeBlock.LINK_POINTS_F32[i*3+0],
					RenderTreeBlock.LINK_POINTS_F32[i*3+1],
				];
				this.push_content_text_box_against_circle(tran, depth, str, fontHeight, clr, unitRectPoint, dist);
			}
		}
	}
	
	static drawLink(renderblock, renderData) {
		const { link, p0, p1 } = renderData;
		const depth = renderblock.depth;
		const tran = null;
		this.push_content_line(tran, depth+1, p0, p1, link.clr);
	}
	static drawLink_alt(p0, p1, clr, depth=0) {
		const tran = null;
		this.push_content_line(tran, depth+1, p0, p1, clr);
	}
	
	static drawText(renderblock, renderData) {
		const { text, tran } = renderData;
		const depth = renderblock.depth;
		// draw background.
		// ...TODO...
		// draw outline.
		/// ...TODO...
		// draw text.
		{
			const str = text.str;
			const dim = text.dimensions;
			const fontColour = text.fclr;
			const fontHeight = text.fhgt;
			VerificationUtil.verifyObjectEntriesDefined({str, dim, fontColour, fontHeight});
			const boundingRect = new Rectangle(dim.x, dim.y, dim.w, dim.h);
			const textAlign = [0.0, 0.0];
			const rectOrigin = [0.0, 0.0];
			const wrap = true;
			this.push_content_text_box(tran, depth, str, fontHeight, fontColour, boundingRect, textAlign, rectOrigin, wrap);
		}
	}
	
	static drawBlockPlaceholder(renderblock, renderData) {
		const { block, tran } = renderData;
		const depth = renderblock.depth;
		// draw background.
		this.tri_rects_push(tran, depth, [0,0,1,1], 0x00000033);
		// draw outline.
		this.line_rects_push(tran, depth, [0,0,1,1], 0x77aaff99);
		// draw thumbnail.
		// ...TODO...
	}
	static drawBlock(renderblock, renderData, simblock=GameRenderer.INDEX_NONE_SB) {
		const t0 = Date.now();
		// update hovered state.
		renderblock.is_hovered  = gameControls.collectionHovered .blocks.has(renderblock.block);
		renderblock.is_selected = gameControls.collectionSelected.blocks.has(renderblock.block);
		// draw background.
		{
			const { block, tran } = renderData;
			const depth = renderblock.depth - 0.5;
			const itran = renderblock.itemTran;
			// draw underlay.
			this.tri_rects_push(itran, depth, [0,0,1,1], 0x00000033);
			// draw grid.
			if(renderblock.depth === 0) {
				const w = block.templateWidth;
				const h = block.templateHeight;
				this.push_content_line_grid(itran, depth, [0,0,1,1], 0x77aaff99, w, h);
			} else {
				this.line_rects_push(itran, depth, [0,0,1,1], 0x77aaff99);
			}
		}
		// draw contents.
		const t1 = Date.now();
		for(const data of renderblock.render_data_texts) GameRenderer.drawText(renderblock, data);
		const t2 = Date.now();
		for(const data of renderblock.render_data_cells) GameRenderer.drawCell(renderblock, data, simblock);
		const t3 = Date.now();
		for(const data of renderblock.render_data_links) GameRenderer.drawLink(renderblock, data);
		const t4 = Date.now();
		for(const data of renderblock.render_data_blocks) {
			const childRB = renderblock.children.get(data.block.id);
			const childSB = gameServer.simulation_get_child_simblock(data.block.id, simblock);
			if(childRB) GameRenderer.drawBlock(childRB, data, childSB);
			else GameRenderer.drawBlockPlaceholder(renderblock, data);
		}
		Performance.increment_time("render.gather.block", t1-t0);
		Performance.increment_time("render.gather.texts", t2-t1);
		Performance.increment_time("render.gather.cells", t3-t2);
		Performance.increment_time("render.gather.links", t4-t3);
	}
	
	// ============================================================
	// Placement previews
	// ------------------------------------------------------------
	
	static drawPreviewCell() {
		const cell = gameControls.get_render_preview_cell();
		if(!cell) return;
		const renblock = gameData.renderBlock;
		GameRenderer.drawCell(renblock, renblock.get_render_data_cell(cell));
	}
	
	static drawPreviewBlock() {
		const block = gameControls.get_render_preview_block();
		if(!block) return;
		const parent	= gameData.renderBlock;
		const exttran	= parent.contentTran;
		const depth		= parent.depth + 1;
		const maxDepth	= parent.depth + 2;
		// TODO: creating a new RenderTreeBlock each frame has a noticable performance penalty.
		const renblock	= new RenderTreeBlock(parent, block, exttran, depth, maxDepth);
		GameRenderer.drawBlock(renblock, renblock.get_render_data_block(block));
	}
	
	static drawNearestLinkPoint() {
		if(!gameControls.wire_nearestValid) return;
		const pointList = gameControls.wire_getTargetDrawPoints();
		// draw circles.
		const clr = gameControls.wire_colour;
		for(const point of pointList) {
			const tran = null;
			const depth = GameRenderer.DEPTH_ON_TOP;
			this.push_content_line_circle(tran, depth, point[0], point[1], 0.2, 20, clr);
		}
		// draw link preview
		if(pointList.length >= 2) GameRenderer.drawLink_alt(pointList[0], pointList[1], clr, 0);
	}
	
	// ============================================================
	// Selection and hover
	// ------------------------------------------------------------
	
	static drawCursor() {
		const tran = null;
		const depth = GameRenderer.DEPTH_ON_TOP;
		const clr = ShaderPackingUtil.packed_rgba_8bit(255,255,111,255);
		const pos = gameControls.cursor_pos;
		const radius = gameControls.cursor_radius;
		this.push_content_line_circle(tran, depth, pos[0], pos[1], radius, 30, clr);
	}

	static drawDragArea() {
		const [x1,y1,x2,y2] = gameControls.cursor_dragAABB;
		const tran = null;
		const depth = GameRenderer.DEPTH_ON_TOP;
		const rect = [x1,y1,(x2-x1),(y2-y1)];
		const clr = 0xffffff55;
		GameRenderer.tri_rects_push(tran, depth, rect, clr);
	}
	
	static pushSelectionRectangles(collection, rect, clr) {
		const renblock = gameData.renderBlock;
		const depth = GameRenderer.DEPTH_ON_TOP;
		for(const item of collection.cells ) { const tran=renblock.item_trans.get(item.id); GameRenderer.line_rects_push(tran, depth, rect, clr); }
		for(const item of collection.texts ) { const tran=renblock.item_trans.get(item.id); GameRenderer.line_rects_push(tran, depth, rect, clr); }
		for(const item of collection.blocks) { const tran=renblock.item_trans.get(item.id); GameRenderer.line_rects_push(tran, depth, rect, clr); }
	}
	
	static drawSelection() {
		const s = 0.03;
		const unit_rect = [0.0-s, 0.0-s, 1.0+s*2, 1+s*2];
		const clr = 0xffff55ff;
		GameRenderer.pushSelectionRectangles(gameControls.collectionSelected, unit_rect, clr);
	}
	
	static drawHovered() {
		const s = 0.00;
		const unit_rect = [0.0-s, 0.0-s, 1.0+s*2, 1+s*2];
		const clr = 0xaaccffff;
		GameRenderer.pushSelectionRectangles(gameControls.collectionHovered, unit_rect, clr);
	}
	
};



