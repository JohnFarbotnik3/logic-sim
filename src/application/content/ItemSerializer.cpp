#ifndef ItemSerializer_h
#define ItemSerializer_h

#include "../lib/StringSerializer.cpp"
#include "ItemId.cpp"
#include "ItemDim.cpp"
#include "ItemClr.cpp"
#include "Cell.cpp"
#include "Link.cpp"
#include "Block.cpp"
#include "BlockTemplate.cpp"
#include "BlockTemplateLibrary.cpp"
#include "ItemCollection.cpp"

struct ItemSerializer : StringSerializer {

	ItemSerializer() = default;
	ItemSerializer(String msg) : StringSerializer(msg) {}

	void push_item_id(const ItemId& id) {
		push_number(id.value);
	}
	ItemId read_item_id() {
		const ItemId id = read_number<u64>();
		return id;
	}
	void push_item_dim(const ItemDim& dim) {
		push_number(dim.x);
		push_number(dim.y);
		push_number(dim.w);
		push_number(dim.h);
		push_number(dim.r);
	}
	ItemDim	read_item_dim() {
		float x = read_number<float>();
		float y = read_number<float>();
		float w = read_number<float>();
		float h = read_number<float>();
		float r = read_number<float>();
		return ItemDim(x,y,w,h,r);
	}
	void push_item_clr(const ItemClr& clr) {
		push_number(clr.to_u32());
	}
	ItemClr read_item_clr() {
		return ItemClr(read_number<u32>());
	}

	void push_cell(const Cell& cell) {
		push_item_id	(cell.id);
		push_number		(cell.type);
		push_number		(cell.value);
		push_item_dim	(cell.dim);
	}
	Cell read_cell() {
		ItemId	id		= read_item_id();
		u32		type	= read_number<u32>();
		u32		value	= read_number<u32>();
		ItemDim	dim		= read_item_dim();
		return Cell(id, type, value, dim);
	}

	void push_link_address(const LinkAddress& addr) {
		push_item_id(addr.bid);
		push_item_id(addr.cid);
		push_number(addr.tgt);
	}
	LinkAddress read_link_address() {
		ItemId		bid = read_item_id();
		ItemId		cid = read_item_id();
		LinkTarget	tgt = read_number<u32>();
		//printf("read_link_address: %llu, %llu, %u\n", bid, cid, tgt);
		return LinkAddress(bid, cid, tgt);
	}

	void push_link(const Link& link) {
		push_item_id(link.id);
		push_link_address(link.src);
		push_link_address(link.dst);
		push_item_clr(link.clr);
	}
	Link read_link() {
		ItemId		id	= read_item_id();
		LinkAddress	src	= read_link_address();
		LinkAddress	dst	= read_link_address();
		ItemClr		clr	= read_item_clr();
		return Link(id, src, dst, clr);
	}

	void push_text(const Text& text) {
		push_item_dim	(text.dim);
		push_item_id	(text.id);
		push_string		(text.str);
		push_number		(text.fhgt);
		push_item_clr	(text.fclr);
		push_item_clr	(text.bclr);
		push_item_clr	(text.oclr);
	}
	Text read_text() {
		ItemDim	dim		= read_item_dim();
		ItemId	id		= read_item_id();
		String	str		= read_string();
		f32		fhgt	= read_number<f32>();
		ItemClr	fclr	= read_item_clr();
		ItemClr	bclr	= read_item_clr();
		ItemClr	oclr	= read_item_clr();
		return Text(dim, id, str, fhgt, fclr, bclr, oclr);
	}

	void push_block(const Block& block) {
		push_item_id(block.id);
		push_item_id(block.templateId);
		push_item_dim(block.dim);
	}
	Block read_block() {
		ItemId	id			= read_item_id();
		ItemId	templateId	= read_item_id();
		ItemDim	dim			= read_item_dim();
		return Block(id, templateId, dim);
	}

	void push_block_template(const BlockTemplate& btmp) {
		push_item_id(btmp.templateId);
		push_string(btmp.name);
		push_string(btmp.desc);
		push_number(btmp.innerW);
		push_number(btmp.innerH);
		push_number(btmp.placeW);
		push_number(btmp.placeH);
		push_number((u32)btmp.cells .size());
		push_number((u32)btmp.links .size());
		push_number((u32)btmp.texts .size());
		push_number((u32)btmp.blocks.size());
		for(const auto& [id, item] : btmp.cells ) push_cell (item);
		for(const auto& [id, item] : btmp.links ) push_link (item);
		for(const auto& [id, item] : btmp.texts ) push_text (item);
		for(const auto& [id, item] : btmp.blocks) push_block(item);
	}
	BlockTemplate read_block_template() {
		BlockTemplate btmp;
		btmp.templateId = read_item_id();
		btmp.name = read_string();
		btmp.desc = read_string();
		btmp.innerW = read_number<float>();
		btmp.innerH = read_number<float>();
		btmp.placeW = read_number<float>();
		btmp.placeH = read_number<float>();
		int n_c = read_number<u32>();
		int n_l = read_number<u32>();
		int n_t = read_number<u32>();
		int n_b = read_number<u32>();
		for(int x=0;x<n_c;x++) { const auto item = read_cell (); btmp.cells [item.id] = item; }
		for(int x=0;x<n_l;x++) { const auto item = read_link (); btmp.links [item.id] = item; }
		for(int x=0;x<n_t;x++) { const auto item = read_text (); btmp.texts [item.id] = item; }
		for(int x=0;x<n_b;x++) { const auto item = read_block(); btmp.blocks[item.id] = item; }
		return btmp;
	}

	void push_block_library(const BlockTemplateLibrary& library) {
		push_number((u32)library.templates.size());
		for(const auto& [id, btmp] : library.templates) push_block_template(btmp);
	}
	BlockTemplateLibrary read_block_library() {
		BlockTemplateLibrary library;
		int num = read_number<u32>();
		for(int x=0;x<num;x++) { const auto item = read_block_template(); library.templates[item.templateId] = item; }
		return library;
	}

	void push_item_collection(const ItemCollection& collection) {
		push_number((u32)collection.cells .size());
		push_number((u32)collection.links .size());
		push_number((u32)collection.texts .size());
		push_number((u32)collection.blocks.size());
		for(const auto& id : collection.cells ) push_item_id(id);
		for(const auto& id : collection.links ) push_item_id(id);
		for(const auto& id : collection.texts ) push_item_id(id);
		for(const auto& id : collection.blocks) push_item_id(id);
	}
	ItemCollection read_item_collection() {
		ItemCollection collection;
		int n_c = read_number<u32>();
		int n_l = read_number<u32>();
		int n_t = read_number<u32>();
		int n_b = read_number<u32>();
		for(int x=0;x<n_c;x++) collection.cells .insert(read_item_id());
		for(int x=0;x<n_l;x++) collection.links .insert(read_item_id());
		for(int x=0;x<n_t;x++) collection.texts .insert(read_item_id());
		for(int x=0;x<n_b;x++) collection.blocks.insert(read_item_id());
		return collection;
	}
};

#endif
