
/*
	A BlockTemplate stores the actual implementation of a logic block,
	and may contain items such as cells, links, and texts,
	as well as BlockInstance(s), which may refer to some other BlockTemplate.
	
	The same BlockTemplate object may be shared by many blocks simultaneously -
	since they wont actually have their own instance - so they will have to share.
	
	Note: to prevent infinite recursion, templates cannot contain themselves.
*/
class BlockTemplate {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(...args) {
		this.cells		= null;				// Cell[]
		this.links		= null;				// Link[]
		this.texts		= null;				// Text[]
		this.blocks		= null;				// Block[]
		this.templateId	= ComponentId.NONE;	// ComponentId	id uniquely identifying BlockTemplate.
		this.width		= 0;				// u32			internal width  of template.
		this.height		= 0;				// u32			internal height of template.
		this.placeW		= 0;				// u32			default width  of block when placed.
		this.placeH		= 0;				// u32			default height of block when placed.
		this.name		= null;				// String
		this.desc		= null;				// String
		// constructor overloads.
		const _INDEX = VerificationUtil.getConstructorOverloadIndex_throw(args, [
			[Number, Number],
		]);
		if(_INDEX === 0) {
			const [width, height] = args;
			this.cells		= [];
			this.links		= [];
			this.texts		= [];
			this.blocks		= [];
			this.templateId	= ComponentId.next();
			this.width		= width;
			this.height		= height;
			this.placeW		= width / 4;
			this.placeH		= height / 4;
			this.name		= "NAME_" + this.templateId;
			this.desc		= "DESCRIPTION";
		}
	}
	
	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	
	save() {
		const {
			cells, links, texts, blocks, 
			templateId, width, height, placeW, placeH, name, desc,
		} = this;
		const arrc = []; for(const item of cells ) arrc.push(item.save());
		const arrl = []; for(const item of links ) arrl.push(item.save());
		const arrt = []; for(const item of texts ) arrt.push(item.save());
		const arrb = []; for(const item of blocks) arrb.push(item.save());
		return {
			templateId, width, height, placeW, placeH, name, desc,
			cells : arrc,
			links : arrl,
			texts : arrt,
			blocks: arrb,
		};
	}
	static load(obj) {
		const {
			templateId, width, height, placeW, placeH, name, desc,
			cells,
			links,
			texts,
			blocks, 
		} = obj;
		const newobj = new BlockTemplate(width, height);
		newobj.templateId	= templateId;
		newobj.name			= name;
		newobj.desc			= desc;
		newobj.placeW		= placeW;
		newobj.placeH		= placeH;
		for(const itemobj of cells ) newobj.cells .push(Cell .load(itemobj));
		for(const itemobj of links ) newobj.links .push(Link .load(itemobj));
		for(const itemobj of texts ) newobj.texts .push(Text .load(itemobj));
		for(const itemobj of blocks) newobj.blocks.push(Block.load(itemobj));
		return newobj;
	}
	
	// ============================================================
	// Content accessors
	// ------------------------------------------------------------
	
	getCellById (id) { return this.cells .find(item => item.id == id); }
	getBlockById(id) { return this.blocks.find(item => item.id == id); }
	
	insertItem(list, item) { list.push(item); }
	removeItem(list, item) {
		for(let i=0;i<list.length;i++) if(list[i].id === item.id) {
			list[i] = list[list.length-1];
			list.pop();
		}
	}
	insertCell (item) { this.insertItem(this.cells , item); }
	insertLink (item) { this.insertItem(this.links , item); }
	insertText (item) { this.insertItem(this.texts , item); }
	insertBlock(item) { this.insertItem(this.blocks, item); }
	removeCell (item) { this.removeItem(this.cells , item); }
	removeLink (item) { this.removeItem(this.links , item); }
	removeText (item) { this.removeItem(this.texts , item); }
	removeBlock(item) { this.removeItem(this.blocks, item); }
	
	// ============================================================
	// Link helpers
	// ------------------------------------------------------------
	
	getValidCellTargets(isRootBlock) {
		const out = new Set();// Set<cell>
		const ina = new Set();// Set<cell>
		const inb = new Set();// Set<cell>
		const cmap = new Map();// Map<cellId, cell>
		for(const cell of this.cells) {
			out.add(cell);
			ina.add(cell);
			inb.add(cell);
			cmap.set(cell.id, cell);
		}
		// some cells dont have certain inputs.
		for(const cell of this.cells) {
			const n = cell.numTargets;
			if(n < 2) ina.delete(cell);
			if(n < 3) inb.delete(cell);
		}
		// if this is a child block, then used link-inputs are immutable.
		// (link-outputs are fine though.)
		const OUT = Cell.LINK_TARGET.OUTPUT;
		const INA = Cell.LINK_TARGET.INPUT_A;
		const INB = Cell.LINK_TARGET.INPUT_B;
		if(!isRootBlock) {
			for(const link of this.links) {
				const {bid_src, bid_dst, cid_src, cid_dst, tgt_src, tgt_dst} = link;
				if(tgt_dst === OUT) out.delete(cmap.get(cid_dst));
				if(tgt_dst === INA) ina.delete(cmap.get(cid_dst));
				if(tgt_dst === INB) inb.delete(cmap.get(cid_dst));
			}
		}
		return {out, ina, inb};
	}
	
	getTemplateIdOfBlock(bid) {
		return (bid === ComponentId.THIS_BLOCK) ? this.templateId : this.getBlockById(bid).templateId;
	}
	
	getLinksThatPointToCellInTemplate(tid, cid) {
		const arr = [];
		for(const link of this.links) {
			const {bid_src, bid_dst, cid_src, cid_dst, tgt_src, tgt_dst} = link;
			const tid_src = this.getTemplateIdOfBlock(bid_src);
			const tid_dst = this.getTemplateIdOfBlock(bid_dst);
			if((tid_src === tid & cid_src === cid) | (tid_dst === tid & cid_dst === cid)) arr.push(link);
		}
		return arr;
	}
	static getLinksThatPointToCellInTemplate(tid, cid, includeSelf) {
		const list = [];// [template, link[]][]
		for(const [templateId, template] of gameData.blockTemplates.entries()) {
			if(templateId === tid && !includeSelf) continue;// skip same template.
			const arr = template.getLinksThatPointToCellInTemplate(tid, cid);
			if(arr.length > 0) list.push([template, arr]);
		}
		return list;
	}
	
	getLinksThatCantFindTargets() {
		const arr = [];
		for(const link of this.links) {
			const {bid_src, bid_dst, cid_src, cid_dst, tgt_src, tgt_dst} = link;
			const tid_src = this.getTemplateIdOfBlock(bid_src);
			const tid_dst = this.getTemplateIdOfBlock(bid_dst);
			const tmp_src = gameData.blockTemplates.get(tid_src);
			const tmp_dst = gameData.blockTemplates.get(tid_dst);
			if(!tmp_src.getCellById(cid_src) | !tmp_dst.getCellById(cid_dst)) arr.push(link);
		}
		return arr;
	}
	static getLinksThatCantFindTargets() {
		const list = [];// [template, link[]][]
		for(const [templateId, template] of gameData.blockTemplates.entries()) {
			const arr = template.getLinksThatCantFindTargets();
			if(arr.length > 0) list.push([template, arr]);
		}
		return list;
	}
	
	static deleteLinksInTemplateLinkList(list) {
		for(const [template, links] of list) {
			for(const link of links) {
				template.removeLink(link);
				gameData.onRootContentChanged_remLink(link);
			}
		}
	}
	
	// ============================================================
	// Template helpers
	// ------------------------------------------------------------
	
	/*
		returns a map with the number of instances of all templates that appear
		in this BlockTemplate's tree (including itself).
	*/
	_countUsedTemplates() {
		// add self to use-count.
		const used = new Map();// Map<templateId, count>
		used.set(this.templateId, 1);
		// sum child template use-counts.
		for(const block of this.blocks) {
			const childUsed = block.template.countUsedTemplates();
			for(const [tid,num] of childUsed.entries()) {
				const sum = used.has(tid) ? used.get(tid) : 0;
				used.set(tid, sum+num);
			}
		}
		return used;
	}
	_countUsedTemplates_cache = new CachedValue_Content(() => this._countUsedTemplates());
	countUsedTemplates() {
		return this._countUsedTemplates_cache.value;
	}
	
	/*
		returns true if rootBlock's template occurs anywhere in this BlockTemplate's tree,
		as that would make it unsafe to add to the root block.
	*/
	containsRootBlockTemplate() {
		return this.countUsedTemplates().has(gameData.rootBlock.templateId);
	}
	
	totalCellsInTree() {
		let used = this.countUsedTemplates();
		let sum = 0;
		for(const [tid, count] of used.entries()) { sum += count * gameData.blockTemplates.get(tid).cells.length; }
		return sum;
	}
	totalLinksInTree() {
		let used = this.countUsedTemplates();
		let sum = 0;
		for(const [tid, count] of used.entries()) sum += count * gameData.blockTemplates.get(tid).links.length;
		return sum;
	}
	totalBlocksInTree() {
		let used = this.countUsedTemplates();
		let sum = 1;// start by counting this block.
		for(const [tid, count] of used.entries()) sum += count * gameData.blockTemplates.get(tid).blocks.length;
		return sum;
	}
};
