#ifndef _BlockTemplateLibrary
#define _BlockTemplateLibrary

#include "./ItemId.cpp"
#include "./BlockTemplate.cpp"
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
	Map<ItemId, Map<ItemId, int>> _countUsedTemplatesInTree_cache;
	Map<ItemId, int>& _countUsedTemplatesInTree(ItemId templateId) {
		// check if already cached.
		if(_countUsedTemplatesInTree_cache.contains(templateId)) return _countUsedTemplatesInTree_cache[templateId];
		// add self to use-count.
		Map<ItemId, int> used;
		used[templateId] = 1;
		// sum across child blocks.
		const BlockTemplate btmp = this->templates[templateId];
		for(const auto& [id, block] : btmp.blocks) {
			// NOTE: when values are accessed with '[]' that do not yet exist, c++ maps zero-initialize them.
			const auto map = _countUsedTemplatesInTree(block.templateId);
			for(const auto& [tid, count] : map) used[tid] += count;
		}
		// add to cache and return.
		return _countUsedTemplatesInTree_cache[templateId] = used;
	}
	Map<ItemId, int>& countUsedTemplatesInTree(ItemId templateId) {
		_countUsedTemplatesInTree_cache.clear();
		return _countUsedTemplatesInTree(templateId);
	}

	int totalCellsInTree(ItemId templateId) {
		const auto used = countUsedTemplatesInTree(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].cells.size();
		return sum;
	}
	int totalLinksInTree(ItemId templateId) {
		const auto used = countUsedTemplatesInTree(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].links.size();
		return sum;
	}
	int totalBlocksInTree(ItemId templateId) {
		const auto used = countUsedTemplatesInTree(templateId);
		int sum = 0;
		for(const auto& [tid, count] : used) sum += count * templates[tid].blocks.size();
		return sum;
	}

	// ============================================================
	// Simulation helpers
	// ------------------------------------------------------------
	
	/*
		Returns map containing all links in each template,
		sorted into per-cell lists based on link source-address.
	*/
	Map<ItemId, Map<ItemId, Map<ItemId, Vector<Link>>>> getOutputtingLinks() {
		Map<ItemId, Map<ItemId, Map<ItemId, Vector<Link>>>> map;
		for(const auto& [tid, btmp] : this->templates) {
			for(const auto& [id, link] : btmp.links) {
				map[tid][link.src.bid][link.src.cid].push_back(link);
				assert(map[tid][link.src.bid][link.src.cid].size() > 0);
			}
		}
		return map;
	}
};

#endif
