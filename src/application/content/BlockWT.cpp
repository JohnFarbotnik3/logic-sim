#ifndef _BlockWT
#define _BlockWT

#include "./ItemDim.cpp"
#include "./ItemId.cpp"
#include "Block.cpp"
#include "BlockTemplate.cpp"
#include "BlockTemplateLibrary.cpp"

/*
	This is an extension of Block which has a pointer to
	the block template it is associated with.
*/
struct BlockWT : Block {
	// NOTE: this is needed to prevent emscripten-related 32-bit alignment problem.
	alignas(8) const BlockTemplateLibrary* library;
	alignas(8) const BlockTemplate* blockTemplate;

	void initTemplateProperties(const BlockTemplateLibrary* library, const ItemId& templateId, const ItemDim& dim) {
		this->library = library;
		this->blockTemplate = &(library->templates.at(templateId));
	}

	BlockWT() = default;
	BlockWT(const BlockTemplateLibrary* library, const ItemId& templateId, const ItemDim& dim) :
	Block(dim, templateId) {
		initTemplateProperties(library, templateId, dim);
	}
	BlockWT(const BlockTemplateLibrary* library, const ItemId& id, const ItemId& templateId, const ItemDim& dim) :
	Block(id, templateId, dim) {
		initTemplateProperties(library, templateId, dim);
	}
	BlockWT(const BlockTemplateLibrary* library, const Block& block) :
	Block(block.id, block.templateId, block.dim) {
		initTemplateProperties(library, block.templateId, block.dim);
	}

	BlockWT get_child(ItemId bid) const {
		if(bid == ItemId::THIS_BLOCK) return *this;
		return BlockWT(library, blockTemplate->blocks.at(bid));
	}
};

#endif
