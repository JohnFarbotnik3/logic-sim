
/*
	Links transfer values from cell outputs to inputs.
	Links can target cells inside either the current block, or inside its child blocks.
	
	Some link related operations will be managed by the link's parent block.
	
	NOTE: it is assumed that links are being added to current rootBlock template,
		however if they were to be added to another template, then some assumptions
		in the constructor would not hold (for example when assigning target blockIds).
*/
class Link {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(...args) {
		this.id			= ComponentId.NONE;	// ComponentId.
		this.bid_src	= ComponentId.NONE;	// ComponentId		ID of child-block containing cell, or THIS_BLOCK if cell is in same block as this link.
		this.cid_src	= ComponentId.NONE;	// ComponentId		ID of the source cell.
		this.bid_dst	= ComponentId.NONE;	// ComponentId		ID of child-block containing cell, or THIS_BLOCK if cell is in same block as this link.
		this.cid_dst	= ComponentId.NONE;	// ComponentId		ID of the destination cell.
		this.tgt_dst	= 0x0;				// u32				link-target on the destination cell.
		this.clr		= 0xffcceeff;		// u32
		// constructor overloads.
		const _INDEX = VerificationUtil.getConstructorOverloadIndex_throw(args, [
			[],
			[Block, Block, Cell, Cell, Number, Number],
			[Number, Number, Number, Number, Number, Number],
		]);
		if(_INDEX === 1) {
			const [bsrc, bdst, csrc, cdst, tdst, clr] = args;
			this.id = ComponentId.next();
			this.bid_src = bsrc.id;
			this.cid_src = csrc.id;
			this.bid_dst = bdst.id;
			this.cid_dst = cdst.id;
			this.tgt_dst = tdst;
			this.clr = clr;
		}
		if(_INDEX === 2) {
			const [bid_src, bid_dst, cid_src, cid_dst, tgt_dst, clr] = args;
			this.id = ComponentId.next();
			this.bid_src = bid_src;
			this.cid_src = cid_src;
			this.bid_dst = bid_dst;
			this.cid_dst = cid_dst;
			this.tgt_dst = tgt_dst;
			this.clr = clr;
		}
	}
	
	get tgt_src() {
		return Cell.LINK_TARGET.OUTPUT;
	}
	
	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	
	save() {
		const {id, bid_src, bid_dst, cid_src, cid_dst, tgt_dst, clr} = this;
		return {id, bid_src, bid_dst, cid_src, cid_dst, tgt_dst, clr};
	}
	static load(obj) {
		const newobj = new Link();
		Object.assign(newobj, obj);
		return newobj;
	}
	clone() {
		return Link.load(this.save());
	}
	
	// ============================================================
	// Link helpers
	// ------------------------------------------------------------
	
	isConnectedToCell (id) { return (this.cid_src === id) | (this.cid_dst === id); }
	isConnectedToBlock(id) { return (this.bid_src === id) | (this.bid_dst === id); }
	static hasSameDstTarget(a, b) {
		return	(a.bid_dst === b.bid_dst) &
				(a.cid_dst === b.cid_dst) &
				(a.tgt_dst === b.tgt_dst);
	}
	
};

