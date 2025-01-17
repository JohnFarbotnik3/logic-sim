import createEmModule from "./em_index";
import { StringMessageUtil } from "../lib/StringMessageUtil";
import { main } from "../Main";

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
		for(const [templateId_num, temp] of library) {
			const templateId = templateId_num + "";
			{
				const {name, desc, width, height, placeW, placeH} = temp;
				server.new_template(templateId, name, desc, width, height, placeW, placeH);
			}
			for(const cell of temp.cells) {
				const {x,y,w,h,r} = cell.dimensions;
				server.add_cell(templateId, cell.id+"", cell.type, cell.value, x, y, w, h, r);
			}
			for(const link of temp.links) {
				const {
					id,
					bid_src, cid_src, tgt_src,
					bid_dst, cid_dst, tgt_dst,
					clr
				} = link;
				const _clr = new Uint32Array([clr]);
				server.add_link(
					templateId, id+"",
					bid_src+"", cid_src+"", tgt_src,
					bid_dst+"", cid_dst+"", tgt_dst,
					_clr[0]
				);
			}
			for(const block of temp.blocks) {
				const {x,y,w,h,r} = block.dimensions;
				server.add_block(templateId, block.id+"", block.templateId+"", x, y, w, h, r);
			}
		}
		server.set_root_block(rootTemplateId + "");
		for(const [templateId_num, temp] of library) server.print_template_counts(templateId_num + "");
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

	simulation_get_cell_value(cellId, sb, tgt) {
		return this.server.simulation_get_cell_value(cellId+"", sb, tgt);
	}

	simulation_get_child_simblock(blockId, sb) {
		return this.server.simulation_get_child_simblock(blockId+"", sb);
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
		const ids_sel = new Set(main.gameUI.collectionSelected.getAllItemIds());
		const ids_hvr = new Set(main.gameUI.collectionHovered .getAllItemIds());
		const msg_sel = StringMessageUtil.number_set_to_str(ids_sel);
		const msg_hvr = StringMessageUtil.number_set_to_str(ids_hvr);
		// draw.
		this.server.draw_all(msg_sel, msg_hvr);
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
	
}
