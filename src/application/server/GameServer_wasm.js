import createEmModule from "./em_index";
import { main } from "../Main";
import { StringSerializer } from "../lib/StringSerializer";
import { ItemSerializer } from "../content/exports";

/* Functions for interacting with c++ implementation. */
export class GameServer_wasm {

	constructor() {
		this.module = null;
		this.server = null;
		this.isReady = createEmModule().then((module) => {
			this.module = module;
			this.server = new module.GameServer();
		});
	}

	// ============================================================
	// BlockTemplate library
	// ------------------------------------------------------------

	send_templates(library, rootTemplateId) {
		const server = this.server;
		const serializer = new ItemSerializer();
		serializer.push_block_library(library);
		console.log("serializer items:", serializer.list);
		server.send_templates(serializer.to_string());
		server.set_root_block(rootTemplateId + "");
	}

	// ============================================================
	// Simulation
	// ------------------------------------------------------------
	
	simulation_rebuild(keepCellValues) {
		this.server.simulation_rebuild(keepCellValues);
	}

	simulation_update(numSteps) {
		this.server.simulation_update(numSteps);
	}

	simulation_set_cell_value(blockId, cellId, val) {
		return this.server.simulation_set_cell_value(blockId+"", cellId+"", val);
	}
	
	// ============================================================
	// Renderer
	// ------------------------------------------------------------
	
	// font renderer init.
	get_font_renderer_num_missing_glyphs() {
		return this.server.get_font_renderer_num_missing_glyphs();
	}
	get_font_renderer_next_missing_glyph(index) {
		return this.server.get_font_renderer_next_missing_glyph(index);
	}
	set_font_renderer_tex_dim(tw, th) {
		this.server.set_font_renderer_tex_dim(tw, th);
	}
	set_font_renderer_glyph(c, tx, ty, tw, th) {
		//console.log("set_font_renderer_glyph", c, tx, ty, tw, th);
		return this.server.set_font_renderer_glyph(c, tx, ty, tw, th);
	}

	// draw
	draw_all() {
		// get selection.
		const ids_sel = main.gameUI.collectionSelected.getAllItemIds();
		const ids_hvr = main.gameUI.collectionHovered .getAllItemIds();
		const msg_sel = new ItemSerializer();
		const msg_hvr = new ItemSerializer();
		for(const id of ids_sel) msg_sel.push_item_id(id);
		for(const id of ids_hvr) msg_hvr.push_item_id(id);
		// draw.
		this.server.draw_all(
			msg_sel.to_string(),
			msg_hvr.to_string(),
		);
	}
	draw_cursor() {
		const [cx, cy, cz] = main.gameUI.cursor_pos;
		const cr = main.gameUI.cursor_radius;
		this.server.draw_cursor(cx, cy, cr);
	}
	draw_drag_area() {
		const [x0, y0] = main.gameUI.cursor_dragBeg;
		const [x1, y1] = main.gameUI.cursor_dragEnd;
		this.server.draw_drag_area(x0, y0, x1, y1);
	}
	draw_cell_preview(cell) {
		const parser = new ItemSerializer();
		parser.push_cell(cell);
		this.server.draw_cell_preview(parser.to_string());
	}
	draw_block_preview(block) {
		const parser = new ItemSerializer();
		parser.push_block(block);
		this.server.draw_block_preview(parser.to_string());
	}
	draw_link_preview(points, clr) {
		const parser = new ItemSerializer();
		parser.push_number(points.length);
		for(const [x,y] of points) {
			parser.push_number(x);
			parser.push_number(y);
		}
		parser.push_item_clr(clr);
		this.server.draw_link_preview(parser.to_string());
	}

	// buffer data.
	triangles_ind() { const obj = this.server.triangles_ind(); return this.module.HEAPU32.subarray(obj.hptr, obj.hptr + obj.size); }
	triangles_pos() { const obj = this.server.triangles_pos(); return this.module.HEAPF32.subarray(obj.hptr, obj.hptr + obj.size); }
	triangles_clr() { const obj = this.server.triangles_clr(); return this.module.HEAPU32.subarray(obj.hptr, obj.hptr + obj.size); }
	lines_ind() { const obj = this.server.lines_ind(); return this.module.HEAPU32.subarray(obj.hptr, obj.hptr + obj.size); }
	lines_pos() { const obj = this.server.lines_pos(); return this.module.HEAPF32.subarray(obj.hptr, obj.hptr + obj.size); }
	lines_clr() { const obj = this.server.lines_clr(); return this.module.HEAPU32.subarray(obj.hptr, obj.hptr + obj.size); }
	font_ind() { const obj = this.server.font_ind(); return this.module.HEAPU32.subarray(obj.hptr, obj.hptr + obj.size); }
	font_pos() { const obj = this.server.font_pos(); return this.module.HEAPF32.subarray(obj.hptr, obj.hptr + obj.size); }
	font_clr() { const obj = this.server.font_clr(); return this.module.HEAPU32.subarray(obj.hptr, obj.hptr + obj.size); }
	font_tex() { const obj = this.server.font_tex(); return this.module.HEAPF32.subarray(obj.hptr, obj.hptr + obj.size); }
	
	get_nearst_cell_target(cursor_pos, first_tgt) {
		const [x,y,z] = cursor_pos;
		const writer = new ItemSerializer();
		writer.push_number(x);
		writer.push_number(y);
		writer.push_number(z);
		writer.push_number(first_tgt);
		const msg = this.server.get_nearst_cell_target(writer.to_string());
		if(msg.length > 0) {
			const reader = new ItemSerializer(msg);
			const nx = reader.read_number();
			const ny = reader.read_number();
			const nz = reader.read_number();
			const {bid, cid, tgt} = reader.read_link_address();
			return [[nx, ny, nz], bid, cid, tgt];
		} else {
			return null;
		}
	}

	// ============================================================
	// Controls
	// ------------------------------------------------------------

	string_message_to_item_collection(msg) {
		const reader = new ItemSerializer(msg);
		const collection = reader.read_item_collection();
		return collection;
	}
	get_items_in_selection_area(x0,  y0,  x1,  y1) {
		const msg = this.server.get_items_in_selection_area(x0,  y0,  x1,  y1);
		return this.string_message_to_item_collection(msg);
	}
	get_items_in_hover_area(cx,  cy,  cr) {
		const msg = this.server.get_items_in_hover_area(cx,  cy,  cr);
		return this.string_message_to_item_collection(msg);
	}
	get_links_in_within_cursor_radius(cx,  cy,  cr) {
		const msg = this.server.get_links_in_within_cursor_radius(cx,  cy,  cr);
		return this.string_message_to_item_collection(msg);
	}

}
