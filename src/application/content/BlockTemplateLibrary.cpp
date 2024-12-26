#ifndef _BlockTemplateLibrary
#define _BlockTemplateLibrary

#include "./ItemId.cpp"
#include "./BlockTemplate.cpp"
#include "CellTypes.cpp"
#include "ItemDim.cpp"
#include "Link.cpp"

/*
	A collection of block-templates, as well as functions
	for managing them and caching useful content logistics.
	
	Content addition and removal will also be managed through this structure
	since it may need to update or clear caches based on changes to content.
*/
struct BlockTemplateLibrary {
	Map<ItemId, BlockTemplate> templates;

	BlockTemplateLibrary() {}
	
	// ============================================================
	// Content logistics
	// ------------------------------------------------------------
	
	/*
		Returns a map with the number of instances of all templates that appear
		in this BlockTemplate's tree (including itself).
	*/
	Map<ItemId, Map<ItemId, int>> getUsedTemplateCount_cache;
	Map<ItemId, int>& getUsedTemplateCount(ItemId templateId) {
		// check if already cached.
		if(getUsedTemplateCount_cache.contains(templateId)) return getUsedTemplateCount_cache[templateId];
		// add self to use-count.
		Map<ItemId, int> used;
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
	
	/* Returns true if template with id occurs anywhere in given BlockTemplate's tree. */
	bool containsTemplate(ItemId templateId, ItemId id) {
		return getUsedTemplateCount(templateId).contains(id);
	}
	
	int totalCellsInTree(ItemId templateId) {
		const auto used = getUsedTemplateCount(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].cells.size();
		return sum;
	}
	int totalLinksInTree(ItemId templateId) {
		const auto used = getUsedTemplateCount(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].links.size();
		return sum;
	}
	int totalBlocksInTree(ItemId templateId) {
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
	Map<ItemId, Map<ItemId, Map<ItemId, Vector<Link>>>> getOutputtingLinks_cache;
	Map<ItemId, Map<ItemId, Vector<Link>>>& getOutputtingLinks(ItemId templateId) {
		// check if already cached.
		if(getOutputtingLinks_cache.contains(templateId)) return getOutputtingLinks_cache[templateId];
		// collect links into lists based on output source block.
		Map<ItemId, Map<ItemId, Vector<Link>>> map;
		const BlockTemplate btmp = this->templates[templateId];
		for(const auto link : btmp.links) {
			map[link.src.bid][link.src.cid].push_back(link);
			assert(map[link.src.bid][link.src.cid].size() > 0);
		}
		// add to cache and return.
		return getOutputtingLinks_cache[templateId] = map;
	}

	// ============================================================
	// Content modification
	// ------------------------------------------------------------

	void clear_caches() {
		this->getUsedTemplateCount_cache.clear();
		this->getOutputtingLinks_cache.clear();
	}

	void new_template(String templateId, String name, String desc, float innerW, float innerH, float placeW, float placeH) {
		BlockTemplate btmp;
		btmp.templateId = templateId;
		btmp.name = name;
		btmp.desc = desc;
		btmp.innerW = innerW;
		btmp.innerH = innerH;
		btmp.placeW = placeW;
		btmp.placeH = placeH;
		this->templates[templateId] = btmp;
		this->clear_caches();
	}

	void add_cell(String templateId, String id, ItemDim dim, u32 type, u32 value) {
		BlockTemplate& btmp = this->templates[templateId];
		Cell item;
		item.id = id;
		item.dim = dim;
		item.type = type;
		item.value = value;
		item.initProperties();
		assert(item.taskOrder < NUM_CELL_TYPES);
		this->templates[templateId].cells.push_back(item);
		this->clear_caches();
	}

	void add_link(
		String templateId,
		String id,
		LinkAddress src,
		LinkAddress dst,
		u32 clr
	) {
		BlockTemplate& btmp = this->templates[templateId];
		Link item;
		item.id = id;
		item.src = src;
		item.dst = dst;
		item.clr = clr;
		this->templates[templateId].links.push_back(item);
		this->clear_caches();
	}

	void add_block(String templateId, String id, String tid, ItemDim dim) {
		Block item;
		item.id = id;
		item.templateId = tid;
		item.dim = dim;
		this->templates[templateId].blocks.push_back(item);
		this->clear_caches();
	}
};

#endif
