#include "./ComponentId.cpp"
#include "./BlockTemplate.cpp"

/*
	A collection of block-templates, as well as functions
	for managing them and caching useful content logistics.
	
	Content addition and removal will also be managed through this structure
	since it may need to update or clear caches based on changes to content.
*/
struct BlockTemplateLibrary {
	Map<ComponentId, BlockTemplate> templates;
	/* Template currently being edited. */
	ComponentId rootTemplateId;
	
	BlockTemplateLibrary() {}
	
	// ============================================================
	// Content logistics
	// ------------------------------------------------------------
	
	/*
		Returns a map with the number of instances of all templates that appear
		in this BlockTemplate's tree (including itself).
	*/
	Map<ComponentId, Map<ComponentId, int>> getUsedTemplateCount_cache;
	Map<ComponentId, int>& getUsedTemplateCount(ComponentId templateId) {
		// check if already cached.
		if(getUsedTemplateCount_cache.contains(templateId)) return getUsedTemplateCount_cache[templateId];
		// add self to use-count.
		Map<ComponentId, int> used;
		used[templateId] = 1;
		// sum across child blocks.
		const BlockTemplate temp = this->templates[templateId];
		for(const Block block : temp.blocks) {
			// NOTE: when values are accessed with '[]' that do not yet exist, c++ maps zero-initialize them.
			const auto map = getUsedTemplateCount(block.templateId);
			for(const auto& [tid, count] : map) used[tid] += count;
		}
		// add to cache and return.
		return getUsedTemplateCount_cache[templateId] = used;
	}
	
	/* Returns true if rootBlock's template occurs anywhere in given BlockTemplate's tree. */
	bool containsRootTemplate(ComponentId templateId) {
		return getUsedTemplateCount(templateId).contains(rootTemplateId);
	}
	
	int totalCellsInTree(ComponentId templateId) {
		const auto used = getUsedTemplateCount(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].cells.size();
		return sum;
	}
	int totalLinksInTree(ComponentId templateId) {
		const auto used = getUsedTemplateCount(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].links.size();
		return sum;
	}
	int totalBlocksInTree(ComponentId templateId) {
		const auto used = getUsedTemplateCount(templateId);
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
		Map<ComponentId, Map<ComponentId, Vector<Link>>> map;
		const BlockTemplate btmp = this->templates[templateId];
		for(const auto link : btmp.links) {
			map[link.src.bid][link.src.cid].push_back(link);
		}
		// add to cache and return.
		return getOutputtingLinks_cache[templateId] = map;
	}

	// ============================================================
	// Content modification - server helpers.
	// ------------------------------------------------------------

	void server_set_root_template(ComponentId templateId) {
		this->rootTemplateId = templateId;
	}

	void server_add_template(ComponentId templateId) {
		printf("add_template: %lu\n", templateId);
		BlockTemplate btmp;
		btmp.templateId = templateId;
		this->templates[templateId] = btmp;
	}

	void server_rem_template(ComponentId templateId) {
		printf("rem_template: %lu\n", templateId);
		this->templates.erase(templateId);
	}

	void server_set_template_props(ComponentId templateId, String name, String desc, float innerW, float innerH, float placeW, float placeH) {
		BlockTemplate& btmp = this->templates[templateId];
		btmp.name = name;
		btmp.desc = desc;
		btmp.innerW = innerW;
		btmp.innerH = innerH;
		btmp.placeW = placeW;
		btmp.placeH = placeH;
	}

	void server_add_cell(
		ComponentId templateId,
		ComponentId id, u32 type, u32 value,
		float x, float y, float w, float h, float r
	) {
		BlockTemplate& btmp = this->templates[templateId];
		Cell cell;
		cell.id = id;
		cell.type = type;
		cell.value = value;
		cell.dimensions = ComponentDimensions(x,y,w,h,r);
		btmp.cells.push_back(cell);
	}

	// TODO: continue from here...

};


