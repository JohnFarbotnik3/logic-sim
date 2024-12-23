
Module.onRuntimeInitialized = () => {
	GameServer_wasm.module_ready_resolve(true);
};

/* Functions for interacting with c++ implementation. */
class GameServer_wasm {
	// ============================================================
	// BlockTemplate library
	// ------------------------------------------------------------
	
	static module_ready_resolve = null;
	static module_ready_promise = new Promise((resolve, reject) => {
		GameServer_wasm.module_ready_resolve = resolve;
	});

	constructor() {
		console.log("MODULE", Module);
		console.log("MODULE", Module.GameServer);
		this.server = new Module.GameServer();
	}

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
				server.add_link(
					templateId, id+"",
					bid_src+"", cid_src+"", tgt_src,
					bid_dst+"", cid_dst+"", tgt_dst,
					clr
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
	
	simulation_rebuild(rootTemplateId) {
		this.server.simulation_rebuild(rootTemplateId+"");
	}

	simulation_update(rate) {
		this.server.simulation_update(rate);
	}

	simulation_get_cell_value(cellId, sb, tgt) {
		return this.server.simulation_get_cell_value(cellId+"", sb, tgt);
	}

	simulation_get_child_simblock(blockId, sb) {
		return this.server.simulation_get_child_simblock(blockId+"", sb);
	}
	
	// ============================================================
	// Renderer
	// ------------------------------------------------------------
	
	// TODO
	
}
