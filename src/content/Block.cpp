#ifndef _Block
#define _Block

#include "./ItemDim.cpp"
#include "./ItemId.cpp"

/*
	A Block is a virtual instance of some BlockTemplate.
*/
struct Block {
	ItemDim	dim;
	ItemId	id;
	ItemId	templateId;
	
	Block() {}
	Block(ItemDim dim, ItemId templateId) {
		this->dim			= dim;
		this->id			= ItemId::next();
		this->templateId	= templateId;
	}
};

#endif
