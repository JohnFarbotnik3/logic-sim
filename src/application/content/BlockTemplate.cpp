#ifndef _BlockTemplate
#define _BlockTemplate

#include "./Cell.cpp"
#include "./Link.cpp"
#include "./Text.cpp"
#include "./Block.cpp"

/*
	A BlockTemplate stores the actual implementation of a logic block,
	and may contain items such as cells, links, and texts,
	as well as Blocks, which refer to some other BlockTemplate.
*/
struct BlockTemplate {
	ItemId				templateId;
	Map<ItemId, Cell>	cells;
	Map<ItemId, Link>	links;
	Map<ItemId, Text>	texts;
	Map<ItemId, Block>	blocks;
	String	name;
	String	desc;
	/* Internal width  of template. */
	float	innerW;
	/* Internal height of template. */
	float	innerH;
	/* Default width  of block when placed. */
	float	placeW;
	/* Default height of block when placed. */
	float	placeH;
	
	BlockTemplate() {}
	BlockTemplate(String name, String desc, float w, float h) {
		this->templateId = ItemId::next();
		this->name		= name;
		this->desc		= desc;
		this->innerW	= w;
		this->innerH	= h;
		this->placeW	= w * 0.25;
		this->placeH	= h * 0.25;
	}
};

#endif
