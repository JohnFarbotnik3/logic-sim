#ifndef _Link
#define _Link

#include "../Imports.cpp"
#include "./ItemId.cpp"
#include "./Colour.cpp"

using LinkTarget = u32;

struct _LINK_TARGETS {
	const LinkTarget OUTPUT  = 0;
	const LinkTarget INPUT_A = 1;
	const LinkTarget INPUT_B = 2;
};

static const _LINK_TARGETS LINK_TARGETS;

struct LinkAddress {
	/* ID of child-block containing cell, or THIS_BLOCK if cell is in same block as this link. */
	ItemId bid;
	/* ID of the linked cell. */
	ItemId cid;
	/* Target on linked cell. */
	LinkTarget tgt;
	
	LinkAddress() {}
	LinkAddress(ItemId bid, ItemId cid, LinkTarget tgt) {
		this->bid = bid;
		this->cid = cid;
		this->tgt = tgt;
	}
	
	bool equals(LinkAddress other) {
		return (
			this->bid == other.bid &
			this->cid == other.cid &
			this->tgt == other.tgt
		);
	}
};

/*
	Links transfer values from one cell's output to another cell's input.
	Links can target cells inside either the current block, or inside its child blocks.
*/
struct Link {
	ItemId	id;
	LinkAddress src;
	LinkAddress dst;
	Colour clr;
	
	Link() {}
	Link(LinkAddress src, LinkAddress dst, Colour clr) {
		this->id	= ItemId::next();
		this->src	= src;
		this->dst	= dst;
		this->clr	= clr;
	}
	
	bool isConnectedToCell (ItemId id) { return (this->src.cid == id) | (this->dst.cid == id); }
	bool isConnectedToBlock(ItemId id) { return (this->src.bid == id) | (this->dst.bid == id); }
};

#endif
