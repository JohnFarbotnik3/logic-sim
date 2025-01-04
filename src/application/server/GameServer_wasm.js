import createEmModule from "./em_index";

const module = await createEmModule();

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
		for(const [templateId_num, temp] of library) server.print_template_counts(templateId_num + "");
	}

	// ============================================================
	// Simulation
	// ------------------------------------------------------------
	
	simulation_rebuild(rootTemplateId, keepCellValues) {
		this.server.simulation_rebuild(rootTemplateId+"", keepCellValues);
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
	
	// TODO
	
}
