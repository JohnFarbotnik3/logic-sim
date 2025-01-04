//#define NDEBUG
#include <cassert>

#include <cstdio>

#include "../content/BlockTemplateLibrary.cpp"
#include "../simulation/GameSimulation.cpp"

// NOTE: this function is omitted when compiling with "--no-entry" flag.
/*
int main(int argc, char** argv) {
	for(int x=0;x<argc;x++) printf("%s\n", argv[x]);

	Map<ItemId, u32> map;
	map[22] = 33;
	map[44] = 66;
	map[66] = 99;
	for(const auto& [a,b] : map) printf("%llu, %u\n",a.value,b);
}
//*/

struct GameServer_wasm {
	// ============================================================
	// Library
	// ------------------------------------------------------------
	BlockTemplateLibrary library;

	void new_template(String templateId, String name, String desc, float innerW, float innerH, float placeW, float placeH) {
		try {
			printf("new_template: %llu\n", ItemId(templateId).value);
			this->library.new_template(templateId, name, desc, innerW, innerH, placeW, placeH);
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
			this->library.add_cell(templateId, id, ItemDim(x,y,w,h,r), type, value);
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void add_link(
		String templateId,
		String id,
		String src_bid, String src_cid, u32 src_tgt,
		String dst_bid, String dst_cid, u32 dst_tgt,
		u32 clr
	) {
		try {
			LinkAddress src(src_bid, src_cid, src_tgt);
			LinkAddress dst(dst_bid, dst_cid, dst_tgt);
			this->library.add_link(templateId, id, src, dst, clr);
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
			this->library.add_block(templateId, id, tid, ItemDim(x,y,w,h,r));
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void print_template_counts(String templateId) {
		printf("----- template counts: %llu -----\n", library.templates[templateId].templateId.value);
		printf("total cells:  %i\n", library.totalCellsInTree(templateId));
		printf("total links:  %i\n", library.totalLinksInTree(templateId));
		printf("total blocks: %i\n", library.totalBlocksInTree(templateId));
	}

	// ============================================================
	// Simulation
	// ------------------------------------------------------------
	GameSimulation simulation;

	void simulation_rebuild(String rootTemplateId, bool keepCellValues) {
		try {
			simulation.rebuild(this->library, rootTemplateId, keepCellValues);
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void simulation_update(int numSteps) {
		try {
			simulation.update(numSteps);
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	u32 simulation_get_cell_value(String cellId, u32 sb, u32 tgt) {
		return simulation.getCellValue(cellId, sb, tgt);
	}

	u32 simulation_get_child_simblock(String blockId, u32 sb) {
		return simulation.getChildSimblock(blockId, sb);
	}

	void simulation_set_cell_value(String blockId, String cellId, u32 val) {
		simulation.modifyCellValue(blockId, cellId, val);
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
	class_<GameServer_wasm>("GameServer")
		.constructor<>()
		.property("library", &GameServer_wasm::library)
		.function("new_template", &GameServer_wasm::new_template)
		.function("add_cell" , &GameServer_wasm::add_cell)
		.function("add_link" , &GameServer_wasm::add_link)
		.function("add_block", &GameServer_wasm::add_block)
		.function("print_template_counts", &GameServer_wasm::print_template_counts)
		.function("simulation_rebuild", &GameServer_wasm::simulation_rebuild)
		.function("simulation_update", &GameServer_wasm::simulation_update)
		.function("simulation_get_cell_value", &GameServer_wasm::simulation_get_cell_value)
		.function("simulation_get_child_simblock", &GameServer_wasm::simulation_get_child_simblock)
		.function("simulation_set_cell_value", &GameServer_wasm::simulation_set_cell_value)
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
