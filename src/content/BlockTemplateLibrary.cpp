
struct BlockTemplateLibrary {
	Map<ComponentId, BlockTemplate> templates;
	
	BlockTemplateLibrary() {}
	
	/*
		Returns a map with the number of instances of all templates that appear
		in this BlockTemplate's tree (including itself).
	*/
	Map<ComponentId, Map<ComponentId, int>> countUsedTemplates_cache;
	Map<ComponentId, int> countUsedTemplates(ComponentId templateId) {
		// check if already cached.
		if(countUsedTemplates_cache.contains(templateId)) return countUsedTemplates_cache[templateId];
		// add self to use-count.
		Map<ComponentId, int> used;
		used[templateId] = 1;
		// sum across child blocks.
		const BlockTemplate temp = this->templates[templateId];
		for(const Block block : temp.blocks) {
			// NOTE: when values are accessed with '[]' that do not yet exist, c++ maps zero-initialize them.
			const auto map = countUsedTemplates(block.templateId);
			for(const auto& [tid, num] : map) used[tid] += num;
		}
		// add to cache and return.
		countUsedTemplates_cache[templateId] = used;
		return used;
	}
	
	// TODO: continue from here...
	
	/*
		returns true if rootBlock's template occurs anywhere in this BlockTemplate's tree,
		as that would make it unsafe to add to the root block.
	*/
	containsRootBlockTemplate() {
		const used = this.countUsedTemplates();
		return used.has(gameData.rootBlock.templateId);
	}
	
	_totalCellsInTree() {
		let used = this.countUsedTemplates();
		let sum = 0;
		for(const [tid, count] of used.entries()) { sum += count * gameData.blockTemplates.get(tid).cells.length; }
		return sum;
	}
	_totalLinksInTree() {
		let used = this.countUsedTemplates();
		let sum = 0;
		for(const [tid, count] of used.entries()) sum += count * gameData.blockTemplates.get(tid).links.length;
		return sum;
	}
	_totalBlocksInTree() {
		let used = this.countUsedTemplates();
		let sum = 1;// start by counting this block.
		for(const [tid, count] of used.entries()) sum += count * gameData.blockTemplates.get(tid).blocks.length;
		return sum;
	}
	_totalCellsInTree_cache = new CachedValue_Content(() => this._totalCellsInTree());
	_totalLinksInTree_cache = new CachedValue_Content(() => this._totalLinksInTree());
	_totalBlocksInTree_cache = new CachedValue_Content(() => this._totalBlocksInTree());
	totalCellsInTree() { return this._totalCellsInTree_cache.value; }
	totalLinksInTree() { return this._totalLinksInTree_cache.value; }
	totalBlocksInTree() { return this._totalBlocksInTree_cache.value; }
	
	// ============================================================
	// Simulation data-gen helpers.
	// ------------------------------------------------------------
	
	/* Collect all outputting links into maps for generating link data. */
	_getOutputtingLinks() {
		const bmap = new Map();// Map<bid_src, Map<cid_src, [bid_dst, cid_dst, tgt_dst][]>>
		for(const link of this.links) {
			const {bid_src, bid_dst, cid_src, cid_dst, tgt_src, tgt_dst} = link;
			if(!bmap.has(bid_src)) bmap.set(bid_src, new Map());
			const cmap = bmap.get(bid_src);
			if(!cmap.has(cid_src)) cmap.set(cid_src, []);
			const arr = cmap.get(cid_src);
			arr.push([bid_dst, cid_dst, tgt_dst]);
		}
		return bmap;
	}
	_getOutputtingLinks_cache = new CachedValue_Content(() => this._getOutputtingLinks());
	getOutputtingLinks(blockId) {
		const bmap = this._getOutputtingLinks_cache.value;
		return bmap.has(blockId) ? bmap.get(blockId) : null;
	}
	
};//TODO
