//#define NDEBUG
#include <cassert>
#include <cstdio>
#include "../content/BlockTemplateLibrary.cpp"
#include "../simulation/GameSimulation.cpp"
#include "../interface/GameRenderer.cpp"
#include "../WebGL/FontEngine.cpp"
#include "../content/ItemSerializer.cpp"

/*
- to detect if building with emscripten (for example to use different threading model in WASM then C++),
	the __EMSCRIPTEN__ is defined by emcc/em++, see:
	https://emscripten.org/docs/compiling/Building-Projects.html
- WARNING: emscripten is a 32-bit platform, so size_t is also 32-bit!
*/

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
	// Structors
	// ------------------------------------------------------------

	// NOTE: to create, call:		var server = new Module.GameServer_wasm();
	// NOTE: call delete, call:		server.delete();
	 GameServer_wasm() { printf("GameServer_wasm::constructor\n"); }
	~GameServer_wasm() { printf("GameServer_wasm::destructor\n"); }

	// ============================================================
	// Library
	// ------------------------------------------------------------

	BlockTemplateLibrary library;
	BlockWT rootBlock;

	void send_templates(String message) {
		try {
			ItemSerializer serializer(message);
			printf("serializer loaded, items: %lu\n", serializer.list.size());
			library = serializer.read_block_library();
			printf("set library\n");
			/*
			// print template info.
			for(const auto& [tid, btmp] : library.templates) {
				printf("----- template counts: %llu -----\n", library.templates[tid].templateId.value);
				printf("total cells:  %i\n", library.totalCellsInTree(tid));
				printf("total links:  %i\n", library.totalLinksInTree(tid));
				printf("total blocks: %i\n", library.totalBlocksInTree(tid));
			}
			//*/
		} catch(std::exception& err) {
			printf("%s\n", err.what());
		}
	}

	void set_root_block(String rootTemplateId) {
		const BlockTemplate& btmp = library.templates.at(rootTemplateId);
		ItemDim dim(0, 0, btmp.innerW, btmp.innerH, 0);
		rootBlock = BlockWT(&library, rootTemplateId, dim);
	}

	// ============================================================
	// Simulation
	// ------------------------------------------------------------
	GameSimulation simulation;

	void simulation_rebuild(bool keepCellValues) {
		try {
			simulation.rebuild(this->library, rootBlock.templateId, keepCellValues);
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

	void simulation_set_cell_value(String blockId, String cellId, u32 val) {
		simulation.modifyCellValue(blockId, cellId, val);
	}

	// ============================================================
	// Renderer
	// ------------------------------------------------------------
	GameRenderer renderer;
	using Char = FontRenderer::Char;

	// font renderer init.
	int get_font_renderer_num_missing_glyphs() {
		return renderer.fontRenderer.missingGlyphs.size();
	}
	int get_font_renderer_next_missing_glyph(int index) {
		for(const Char c : renderer.fontRenderer.missingGlyphs) if(index == 0) return c; else index--;
		return 0;
	}
	void set_font_renderer_tex_dim(float tw, float th) {
		renderer.fontRenderer.setTextureImageDimensions(tw, th);
		renderer.fontRenderer.glyphmap.clear();
		renderer.fontRenderer.missingGlyphs.clear();
	}
	void set_font_renderer_glyph(int c_int, float tx, float ty, float tw, float th) {
		Char c = c_int;
		//printf("set_font_renderer_glyph(%i, %f, %f, %f, %f)\n", c, tx, ty, tw, th);
		renderer.fontRenderer.glyphmap[c] = FontRenderer::FontRendererGlyph(tx, ty, tw, th);
		//renderer.fontRenderer.glyphmap[c] = FontRenderer::FontRendererGlyph(0,0,1,1);
		renderer.fontRenderer.missingGlyphs.erase(c);
	}

	// draw primary block content.
	void draw_all(
		String msg_sel,
		String msg_hvr
	) {
		ItemSerializer parse_sel(msg_sel);
		ItemSerializer parse_hvr(msg_hvr);
		Set<ItemId> ids_sel;
		Set<ItemId> ids_hvr;
		for(int x=0;x<parse_sel.list.size();x++) ids_sel.insert(parse_sel.read_number<u64>());
		for(int x=0;x<parse_hvr.list.size();x++) ids_hvr.insert(parse_hvr.read_number<u64>());
		renderer.draw_all(rootBlock, simulation, ids_sel, ids_hvr);
	}
	void draw_cursor(float cx, float cy, float cr) {
		VertexPos cursor_pos{cx, cy, 0};
		renderer.drawCursor(cursor_pos, cr);
	}
	void draw_drag_area(float dx0, float dy0, float dx1, float dy1) {
		Rectangle drag_area{dx0, dy0, dx1-dx0, dy1-dy0};
		renderer.drawDragArea(drag_area);
	}
	void draw_cell_preview(String msg) {
		ItemSerializer parser(msg);
		const Cell cell = parser.read_cell();
		renderer.draw_cell_preview(rootBlock, cell);
	}
	void draw_link_preview(String msg) {
		ItemSerializer parser(msg);
		int num = parser.read_number<int>();
		Vector<VertexPos> points;
		for(int i=0;i<num;i++) {
			float x = parser.read_number<float>();
			float y = parser.read_number<float>();
			points.push_back(VertexPos{x,y,0});
		}
		VertexClr clr = parser.read_item_clr();
		renderer.draw_link_preview(points, clr);
	}
	void draw_block_preview(String msg) {
		ItemSerializer parser(msg);
		const Block block = parser.read_block();
		renderer.draw_block_preview(rootBlock, BlockWT(&library, block));
	}

	// buffer data.
	// https://stackoverflow.com/questions/65566923/is-there-a-more-efficient-way-to-return-arrays-from-c-to-javascript
	struct Embuffer {
		size_t data;
		size_t size;
		size_t hptr;
		Embuffer(size_t data, size_t size, size_t sizeof_t) {
			this->data = data;
			this->size = size;
			this->hptr = data / sizeof_t;
		}
	};
	Embuffer triangles_ind() { const auto& arr = renderer.triangles_ind; return Embuffer((size_t)arr.data(), arr.size()*1, sizeof(u32)); }
	Embuffer triangles_pos() { const auto& arr = renderer.triangles_pos; return Embuffer((size_t)arr.data(), arr.size()*3, sizeof(f32)); }
	Embuffer triangles_clr() { const auto& arr = renderer.triangles_clr; return Embuffer((size_t)arr.data(), arr.size()*1, sizeof(u32)); }
	Embuffer lines_ind() { const auto& arr = renderer.lines_ind; return Embuffer((size_t)arr.data(), arr.size()*1, sizeof(u32)); }
	Embuffer lines_pos() { const auto& arr = renderer.lines_pos; return Embuffer((size_t)arr.data(), arr.size()*3, sizeof(f32)); }
	Embuffer lines_clr() { const auto& arr = renderer.lines_clr; return Embuffer((size_t)arr.data(), arr.size()*1, sizeof(u32)); }
	Embuffer font_ind() { const auto& arr = renderer.font_ind; return Embuffer((size_t)arr.data(), arr.size()*1, sizeof(u32)); }
	Embuffer font_pos() { const auto& arr = renderer.font_pos; return Embuffer((size_t)arr.data(), arr.size()*3, sizeof(f32)); }
	Embuffer font_clr() { const auto& arr = renderer.font_clr; return Embuffer((size_t)arr.data(), arr.size()*1, sizeof(u32)); }
	Embuffer font_tex() { const auto& arr = renderer.font_tex; return Embuffer((size_t)arr.data(), arr.size()*2, sizeof(f32)); }

	String get_nearst_cell_target(String msg) {
		ItemSerializer reader(msg);
		float x = reader.read_number<float>();
		float y = reader.read_number<float>();
		float z = reader.read_number<float>();
		Vector3D cursor_pos {x, y, z};
		LinkTarget first_tgt = reader.read_number<int>();
		RenderTree rendertree(rootBlock, Transformation2D(), 0);
		const auto tp_opt = rendertree.get_nearst_cell_target(cursor_pos, first_tgt);
		if(tp_opt.has_value()) {
			const auto tp_val = tp_opt.value();
			ItemSerializer writer;
			writer.push_number(tp_val.point.x);
			writer.push_number(tp_val.point.y);
			writer.push_number(tp_val.point.z);
			writer.push_link_address(tp_val.addr);
			return writer.to_string();
		} else {
			return "";
		}
	}
};

#include <emscripten.h>
#include <emscripten/bind.h>
using namespace emscripten;

EMSCRIPTEN_BINDINGS() {
	class_<GameServer_wasm::Embuffer>("Embuffer")
		.property("data", &GameServer_wasm::Embuffer::data)
		.property("size", &GameServer_wasm::Embuffer::size)
		.property("hptr", &GameServer_wasm::Embuffer::hptr)
	;

	class_<GameServer_wasm>("GameServer")
		.constructor<>()
		// template library.
		.property("library", &GameServer_wasm::library)
		.function("send_templates", &GameServer_wasm::send_templates)
		.function("set_root_block", &GameServer_wasm::set_root_block)
		// simulation.
		.function("simulation_rebuild", &GameServer_wasm::simulation_rebuild)
		.function("simulation_update", &GameServer_wasm::simulation_update)
		.function("simulation_set_cell_value", &GameServer_wasm::simulation_set_cell_value)
		// rendering.
		.function("get_font_renderer_num_missing_glyphs", &GameServer_wasm::get_font_renderer_num_missing_glyphs)
		.function("get_font_renderer_next_missing_glyph", &GameServer_wasm::get_font_renderer_next_missing_glyph)
		.function("set_font_renderer_tex_dim", &GameServer_wasm::set_font_renderer_tex_dim)
		.function("set_font_renderer_glyph", &GameServer_wasm::set_font_renderer_glyph)
		.function("draw_all", &GameServer_wasm::draw_all)
		.function("draw_cursor", &GameServer_wasm::draw_cursor)
		.function("draw_drag_area", &GameServer_wasm::draw_drag_area)
		.function("draw_cell_preview", &GameServer_wasm::draw_cell_preview)
		.function("draw_link_preview", &GameServer_wasm::draw_link_preview)
		.function("draw_block_preview", &GameServer_wasm::draw_block_preview)
		.function("triangles_ind", &GameServer_wasm::triangles_ind)
		.function("triangles_pos", &GameServer_wasm::triangles_pos)
		.function("triangles_clr", &GameServer_wasm::triangles_clr)
		.function("lines_ind", &GameServer_wasm::lines_ind)
		.function("lines_pos", &GameServer_wasm::lines_pos)
		.function("lines_clr", &GameServer_wasm::lines_clr)
		.function("font_ind", &GameServer_wasm::font_ind)
		.function("font_pos", &GameServer_wasm::font_pos)
		.function("font_clr", &GameServer_wasm::font_clr)
		.function("font_tex", &GameServer_wasm::font_tex)
		.function("get_nearst_cell_target", &GameServer_wasm::get_nearst_cell_target)

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
