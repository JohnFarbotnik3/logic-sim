
/*
	A collection of block-templates, as well as functions
	for managing them and caching useful content logistics.
	
	Content addition and removal will also be managed through this structure
	since it may need to update or clear caches based on changes to content.
*/
struct BlockTemplateLibrary {
	Map<ComponentId, BlockTemplate> templates;
	/* Template currently being edited. */
	BlockTemplate rootTemplate;
	
	BlockTemplateLibrary() {}
	
	// ============================================================
	// Content logistics
	// ------------------------------------------------------------
	
	/*
		Returns a map with the number of instances of all templates that appear
		in this BlockTemplate's tree (including itself).
	*/
	Map<ComponentId, Map<ComponentId, int>> countUsedTemplates_cache;
	Map<ComponentId, int>& countUsedTemplates(ComponentId templateId) {
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
			for(const auto& [tid, count] : map) used[tid] += count;
		}
		// add to cache and return.
		return countUsedTemplates_cache[templateId] = used;
	}
	
	/* Returns true if rootBlock's template occurs anywhere in given BlockTemplate's tree. */
	bool containsRootTemplate(ComponentId templateId) {
		return countUsedTemplates(templateId).contains(rootTemplate.templateId);
	}
	
	int totalCellsInTree(ComponentId templateId) {
		const auto used = countUsedTemplates(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].cells.size();
		return sum;
	}
	int totalLinksInTree(ComponentId templateId) {
		const auto used = countUsedTemplates(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].links.size();
		return sum;
	}
	int totalBlocksInTree(ComponentId templateId) {
		const auto used = countUsedTemplates(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].blocks.size();
		return sum;
	}
	
	// ============================================================
	// Simulation helpers
	// ------------------------------------------------------------
	
	/*
		Returns map containing all links in [templateId],
		sorted into per-cell lists based on link source-address.
	*/
	Map<ComponentId, Map<ComponentId, Map<ComponentId, Vector<Link>>>> getOutputtingLinks_cache;
	Map<ComponentId, Map<ComponentId, Vector<Link>>>& getOutputtingLinks(ComponentId templateId) {
		// check if already cached.
		if(getOutputtingLinks_cache.contains(templateId)) return getOutputtingLinks_cache[templateId];
		// collect links into lists based on output source block.
		const Map<ComponentId, Map<ComponentId, Vector<Link>>> map;
		const BlockTemplate btmp = this->templates[templateId];
		for(const auto link : btmp.links) {
			map[link.src.bid][link.src.cid].push_back(link);
		}
		// add to cache and return.
		return getOutputtingLinks_cache[templateId] = map;
	}
};



