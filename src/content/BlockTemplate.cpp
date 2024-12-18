
/*
	A BlockTemplate stores the actual implementation of a logic block,
	and may contain items such as cells, links, and texts,
	as well as Blocks, which refer to some other BlockTemplate.
*/
struct BlockTemplate {
	ComponentId		templateId;
	Vector<Cell>	cells;
	Vector<Link>	links;
	Vector<Text>	texts;
	Vector<Block>	blocks;
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
		this->templateId = componentId::next();
		this->name		= name;
		this->desc		= desc;
		this->innerW	= w;
		this->innerH	= h;
		this->placeW	= w * 0.25;
		this->placeH	= h * 0.25;
	}
};



