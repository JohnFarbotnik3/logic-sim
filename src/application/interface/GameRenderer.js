import { main } from "../Main";
import {
	mat4,
	Camera,
	BUFFER_USAGE,
	AttributeBuffer,
	IndexBuffer,
	GL_DRAW_MODE,
	ShaderPipeline,
	FontRenderer,
	FONT_FAMILY,
	FONT_STYLE,
	Shader_pos_clr,
	Shader_pos_clr_tex,
	ShaderPackingUtil,
	BROKEN_DRIVER_MYSTERY_OFFSET_U32,
} from "../WebGL/exports";
import {
	Rectangle,
	Transformation2D,
} from "../lib/exports";
import { CachedValue_Rendering } from "../CachedValue";
import { Performance } from "../Performance";


const INDEX_NONE_SB = 0xffffffff;
const INDEX_ROOT_SB = 0x0;

export class GameRenderer {
	// ============================================================
	// structors
	// ------------------------------------------------------------

	constructor(canvas) {
		// get WebGL instance.
		const gl = canvas.getContext("webgl2", { alpha: true, antialias: true });
		if (gl === null) {
			alert("Unable to initialize WebGL2. Your browser or machine may not support it.");
			return;
		}

		this.canvas = canvas;
		this.gl = gl;

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

		const camera = this.camera = new Camera();
		const { width, height } = canvas.getClientRects()[0];
		camera.setAspectRatio(width, height);

		// init uniforms.
		this.matrixMVP = mat4.create();
		// init buffers.
		{
			const config = this.triangles_config = Shader_pos_clr;
			const usage = BUFFER_USAGE.DYNAMIC_DRAW;
			const buf_ind = new     IndexBuffer(gl,  Uint32Array, usage);
			const buf_pos = new AttributeBuffer(gl, Float32Array, usage, ["pos"]);
			const buf_clr = new AttributeBuffer(gl,  Uint32Array, usage, ["clr"]);
			this.triangles_shader = new ShaderPipeline(gl, config, [buf_pos, buf_clr], buf_ind, GL_DRAW_MODE.TRIANGLES);
			this.triangles_buffer_ind = buf_ind;
			this.triangles_buffer_pos = buf_pos;
			this.triangles_buffer_clr = buf_clr;
		}
		{
			const config = this.lines_config = Shader_pos_clr;
			const usage = BUFFER_USAGE.DYNAMIC_DRAW;
			const buf_ind = new     IndexBuffer(gl,  Uint32Array, usage);
			const buf_pos = new AttributeBuffer(gl, Float32Array, usage, ["pos"]);
			const buf_clr = new AttributeBuffer(gl,  Uint32Array, usage, ["clr"]);
			this.lines_shader = new ShaderPipeline(gl, config, [buf_pos, buf_clr], buf_ind, GL_DRAW_MODE.LINES);
			this.lines_buffer_ind = buf_ind;
			this.lines_buffer_pos = buf_pos;
			this.lines_buffer_clr = buf_clr;
		}
		{
			const config = this.font_config = Shader_pos_clr_tex;
			const usage = BUFFER_USAGE.DYNAMIC_DRAW;
			const buf_ind = new     IndexBuffer(gl,  Uint32Array, usage);
			const buf_pos = new AttributeBuffer(gl, Float32Array, usage, ["pos"]);
			const buf_clr = new AttributeBuffer(gl,  Uint32Array, usage, ["clr"]);
			const buf_tex = new AttributeBuffer(gl, Float32Array, usage, ["tex"]);
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

	// ============================================================
	// Main functions
	// ------------------------------------------------------------
	
	render() {
		const server = main.gameServer;
		if(!server) return;
		const t0 = Date.now();
		// update uniforms
		const gl = this.triangles_shader.glContext;
		const matrixMVP = this.matrixMVP;
		mat4.identity(matrixMVP);
		this.camera.applyCameraMatrix(matrixMVP);
		this.triangles_shader.setUniform_mat4fv(gl, "mvp", matrixMVP);
		this.lines_shader    .setUniform_mat4fv(gl, "mvp", matrixMVP);
		this.font_shader     .setUniform_mat4fv(gl, "mvp", matrixMVP);
		this.font_shader     .setUniform_texbuf(gl, "texsampler", this.fontRenderer_0.texBuffer);
		// check for missing glyphs.
		const n_missing = server.get_font_renderer_num_missing_glyphs();
		//console.log("n_missing", n_missing);
		if(n_missing > 0) {
			const fontren = this.fontRenderer_0;
			const s_missing = new Set();
			for(let x=0;x<n_missing;x++)
					if(!fontren.glyphmap.has(x))
						s_missing.add(String.fromCharCode(server.get_font_renderer_next_missing_glyph(x)));
			//console.log("s_missing", s_missing, [...s_missing.keys()].map(s => s.charCodeAt(0)));
			if(s_missing.size > 0) {
				fontren.addRequiredGlyphs(s_missing);
				server.set_font_renderer_tex_dim(fontren.texW, fontren.texH);
				for(const [c,g] of fontren.glyphmap.entries()) {
					const tc = g.texCoords;
					server.set_font_renderer_glyph(c.charCodeAt(0), tc[0], tc[1], tc[2], tc[3]);
				}
			}
		}
		// draw.
		const t1 = Date.now();
		server.draw_all(main.blockLibrary.rootBlock.templateId,);
		server.draw_cursor();
		if(main.gameUI.cursor_isSelecting) server.draw_drag_area();
		const cell = main.gameUI.get_render_preview_cell();
		if(cell) server.draw_cell_preview(cell);
		const block = main.gameUI.get_render_preview_block();
		if(block) server.draw_block_preview(block);
		const points = main.gameUI.get_link_draw_points();
		const clr = main.gameUI.get_wire_colour();
		if(points.length > 0) server.draw_link_preview(points, clr);
		// get and push vertex data.
		let tcount = 0;
		let lcount = 0;
		let fcount = 0;
		{
			let idata = server.triangles_ind();
			let vdata = server.triangles_pos();
			let cdata = server.triangles_clr();
			tcount = idata.length;
			this.triangles_buffer_ind.commitSrcDataToBuffer(idata, 0, idata.length);
			this.triangles_buffer_pos.commitSrcDataToBuffer(vdata, 0, vdata.length);
			this.triangles_buffer_clr.commitSrcDataToBuffer(cdata, 0, cdata.length);
		}
		{
			let idata = server.lines_ind();
			let vdata = server.lines_pos();
			let cdata = server.lines_clr();
			lcount = idata.length;
			this.lines_buffer_ind.commitSrcDataToBuffer(idata, 0, idata.length);
			this.lines_buffer_pos.commitSrcDataToBuffer(vdata, 0, vdata.length);
			this.lines_buffer_clr.commitSrcDataToBuffer(cdata, 0, cdata.length);
		}
		{
			let idata = server.font_ind();
			let vdata = server.font_pos();
			let cdata = server.font_clr();
			let tdata = server.font_tex();
			fcount = idata.length;
			this.font_buffer_ind.commitSrcDataToBuffer(idata, 0, idata.length);
			this.font_buffer_pos.commitSrcDataToBuffer(vdata, 0, vdata.length);
			this.font_buffer_clr.commitSrcDataToBuffer(cdata, 0, cdata.length);
			this.font_buffer_tex.commitSrcDataToBuffer(tdata, 0, tdata.length);
		}
		// commit data to buffers.
		const t2 = Date.now();
		// clear canvas
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// draw to canvas.
		this.triangles_shader.drawElementsRange(0, tcount);
		this.lines_shader    .drawElementsRange(0, lcount);
		this.font_shader     .drawElementsRange(0, fcount);
		//gl.flush();// optional?
		const t3 = Date.now();
		Performance.increment_time("render.update", t1-t0);
		Performance.increment_time("render.gather", t2-t1);
		Performance.increment_time("render.draw", t3-t2);
	}
};
