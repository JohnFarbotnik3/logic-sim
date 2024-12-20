#include <cstdio>

#include "../content/BlockTemplateLibrary.cpp"

int main(int argc, char** argv) {
	for(int x=0;x<argc;x++) printf("%s\n", argv[x]);
}

struct GameServer_wasm {
	// ============================================================
	// BlockTemplate library
	// ------------------------------------------------------------

	BlockTemplateLibrary library;

	// ============================================================
	// Simulation
	// ------------------------------------------------------------

	// TODO

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
	;

	class_<BlockTemplateLibrary>("BlockTemplateLibrary")
		.constructor<>()
		.property("templates", &BlockTemplateLibrary::templates)
		.function("set_root_template", &BlockTemplateLibrary::set_root_template)
		.function("add_template", &BlockTemplateLibrary::add_template)
		.function("rem_template", &BlockTemplateLibrary::rem_template)
		.function("set_template_props", &BlockTemplateLibrary::set_template_props)
	;

	class_<BlockTemplate>("BlockTemplate")
		.constructor<>()
		.constructor<String, String, float, float>()
		.property("templateId", &BlockTemplate::templateId)
	;
}
