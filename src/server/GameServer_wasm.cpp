#include <cstdio>
#include "../content/BlockTemplateLibrary.cpp"
#include "../simulation/GameSimulation.cpp"

int main(int argc, char** argv) {
	for(int x=0;x<argc;x++) printf("%s\n", argv[x]);
}

struct GameServer_wasm {
	// ============================================================
	// Library
	// ------------------------------------------------------------
	BlockTemplateLibrary library;

	void set_root_template(String templateId) {
		try {
			library.rootTemplateId = templateId;
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void add_template(String templateId, String name, String desc, float innerW, float innerH, float placeW, float placeH) {
		try {
			printf("add_template: %llu\n", ItemId(templateId).value);
			BlockTemplate btmp;
			btmp.templateId = templateId;
			btmp.name = name;
			btmp.desc = desc;
			btmp.innerW = innerW;
			btmp.innerH = innerH;
			btmp.placeW = placeW;
			btmp.placeH = placeH;
			library.templates[templateId] = btmp;
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void rem_template(String templateId) {
		try {
			printf("rem_template: %llu\n", ItemId(templateId).value);
			library.templates.erase(templateId);
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void add_cell(
		String templateId,
		String id, u32 type, u32 value,
		float x, float y, float w, float h, float r
	) {
		try {
			BlockTemplate& btmp = library.templates[templateId];
			Cell cell;
			cell.id = id;
			cell.type = type;
			cell.value = value;
			cell.dim = ItemDim(x,y,w,h,r);
			btmp.cells.push_back(cell);
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void add_link(
		String templateId,
		String id,
		String src_bid,
		String src_cid,
		u32 src_tgt,
		String dst_bid,
		String dst_cid,
		u32 dst_tgt,
		u32 clr
	) {
		try {
			BlockTemplate& btmp = library.templates[templateId];
			Link link;
			link.id = id;
			link.src = LinkAddress(src_bid, src_cid, src_tgt);
			link.dst = LinkAddress(dst_bid, dst_cid, dst_tgt);
			link.clr = Colour(clr);
			btmp.links.push_back(link);
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void add_block(
		String templateId,
		String id,
		String tid,
		float x, float y, float w, float h, float r
	) {
		try {
			BlockTemplate& btmp = library.templates[templateId];
			Block block;
			block.id = id;
			block.templateId = tid;
			block.dim = ItemDim(x,y,w,h,r);
			btmp.blocks.push_back(block);
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	// ============================================================
	// Simulation
	// ------------------------------------------------------------
	GameSimulation simulation;

	void simulation_rebuild() {
		simulation.rebuild(this->library);
	}

	void simulation_update(float rate) {
		simulation.update(rate);
	}

	// ============================================================
	// Renderer
	// ------------------------------------------------------------

	// TODO

	// ============================================================
	// Structors
	// ------------------------------------------------------------

	// NOTE: to create, call:		var server = new Module.GameServer_wasm();
	// NOTE: call delete, call:		server.delete();
	 GameServer_wasm() { printf("GameServer_wasm::constructor\n"); }
	~GameServer_wasm() { printf("GameServer_wasm::destructor\n"); }

};

#include <emscripten.h>
#include <emscripten/bind.h>
using namespace emscripten;

EMSCRIPTEN_BINDINGS() {
	class_<GameServer_wasm>("GameServer_wasm")
		.constructor<>()
		.property("library", &GameServer_wasm::library)
		.function("set_root_template", &GameServer_wasm::set_root_template)
		.function("add_template", &GameServer_wasm::add_template)
		.function("rem_template", &GameServer_wasm::rem_template)
		.function("add_cell" , &GameServer_wasm::add_cell)
		.function("add_link" , &GameServer_wasm::add_link)
		.function("add_block", &GameServer_wasm::add_block)
		.function("simulation_rebuild", &GameServer_wasm::simulation_rebuild)
		.function("simulation_update", &GameServer_wasm::simulation_update)
	;

	class_<BlockTemplateLibrary>("BlockTemplateLibrary")
		.constructor<>()
		.property("templates", &BlockTemplateLibrary::templates)
	;

	class_<BlockTemplate>("BlockTemplate")
		.constructor<>()
		.constructor<String, String, float, float>()
		.property("templateId", &BlockTemplate::templateId)
	;
}
