#ifndef _Block
#define _Block

#include "./ItemDim.cpp"
#include "./ItemId.cpp"

/*
	A Block is a virtual instance of some BlockTemplate.
*/
struct Block {
	ItemId	id;
	ItemId	templateId;
	ItemDim	dim;

	Block() = default;
	Block(ItemDim dim, ItemId templateId) {
		this->id			= ItemId::next();
		this->templateId	= templateId;
		this->dim			= dim;
	}
	Block(ItemId id, ItemId templateId, ItemDim dim) {
		this->id			= id;
		this->templateId	= templateId;
		this->dim			= dim;

	}
};

#endif
