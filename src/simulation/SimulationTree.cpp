#include "../Imports.cpp"
#include "../content/ItemId.cpp"
#include "../content/BlockTemplateLibrary.cpp"
#include "./SimulationCell.cpp"

struct SimulationBlock {
	/* TemplateId for this simulation block */
	ItemId	templateId;
	/* BlockId of this simulation block inside parent. */
	ItemId	blockId;
	/*
		Reference to parent simblock.

		WARNING: alignment is a serious yet silent issue in emscripten builds,
		so this has to be the first argument. If "Index out of bounds" issues happen
		somewhere else in the code, alignment may be the actual cause - see:
		https://github.com/emscripten-core/emscripten/issues/11544
	*/
	u32 parentIndex;
	u32 padding;
	/* Indices of children in simblock array. */
	Map<ItemId, u32> bmap;
	/* Indices of cells in simulation data. */
	Map<ItemId, u32> cmap;

	SimulationBlock(ItemId templateId, ItemId blockId, u32 parentIndex) {
		this->templateId	= templateId;
		this->blockId		= blockId;
		this->parentIndex	= parentIndex;
	}
};

struct SimulationTree {
	/* Array of simblocks. First block is root block. */
	Vector<SimulationBlock> simblocks;
	/* a copy of the BlockTemplateLibrary this tree is based on. */
	BlockTemplateLibrary library;
	/* Root template this tree was generated with. */
	ItemId rootTemplateId;

	static const u32 INDEX_NONE = 0xffffffff;
	static const u32 INDEX_ROOT = 0x0;

	SimulationTree() {}
	SimulationTree(BlockTemplateLibrary library, ItemId rootTemplateId) {
		this->library = library;// TODO: make sure this library is a deep-copy rather than a shallow copy.
		this->rootTemplateId = rootTemplateId;
		this->initTree(rootTemplateId);
	}
	
	BlockTemplate& getTemplate(ItemId templateId) {
		return this->library.templates[templateId];
	}
	BlockTemplate& getTemplate(const SimulationBlock& simblock) {
		return this->library.templates[simblock.templateId];
	}
	const u32 getCellIndex(const SimulationBlock& simblock, ItemId blockId, ItemId cellId) {
		if(blockId == ItemId::THIS_BLOCK) return simblock.cmap.at(cellId);
		else return this->simblocks[simblock.bmap.at(blockId)].cmap.at(cellId);
	}
	SimulationBlock& getParent(const SimulationBlock& simblock) {
		return this->simblocks[simblock.parentIndex];
	}

	void initNode(const u32 index) {
		// create and push child simblocks.
		const SimulationBlock& simblock = this->simblocks[index];
		const BlockTemplate& btmp = this->getTemplate(simblock);
		u32 initIndex = this->simblocks.size();
		u32 nextIndex = this->simblocks.size();
		for(const Block& block : btmp.blocks) {
			this->simblocks.push_back(SimulationBlock(block.templateId, block.id, index));
			this->simblocks[index].bmap[block.id] = nextIndex++;
		}
		// initialize children.
		for(u32 x=initIndex;x<nextIndex;x++) this->initNode(x);
	}
	void initTree(ItemId rootTemplateId) {
		this->simblocks.clear();
		this->simblocks.push_back(SimulationBlock(rootTemplateId, ItemId::NONE, SimulationTree::INDEX_NONE));
		this->initNode(SimulationTree::INDEX_ROOT);
	}

	/* Moves values from old array to new array, using old and new simtrees. */
	static void transferCellValues(
		SimulationTree& newtree,
		SimulationTree& oldtree,
		Vector<SimulationCell>& newCellbuf,
		u32* olddata
	) {
		// generate queue of [new, old] simblock-index pairs.
		const u32 sz = std::min<u32>(oldtree.simblocks.size(), newtree.simblocks.size()) * 2 + 2;
		u32 arr[sz];
		u32 pos = 0;
		u32 len = 0;
		arr[len++] = 0;
		arr[len++] = 0;
		while(pos < len) {
			assert(pos+2 <= sz);
			SimulationBlock& newsb = newtree.simblocks[arr[pos++]];
			SimulationBlock& oldsb = oldtree.simblocks[arr[pos++]];
			for(const auto& [bid, new_ind] : newsb.bmap) {
				if(oldsb.bmap.contains(bid)) {
					const u32 old_ind = oldsb.bmap.at(bid);
					arr[len++] = new_ind;
					arr[len++] = old_ind;
				}
			}
		}
		assert(pos == len);
		// iterate through simblock index pairs, transferring cell values from old-data to new-data.
		pos = 0;
		while(pos < len) {
			SimulationBlock& newsb = newtree.simblocks[arr[pos++]];
			SimulationBlock& oldsb = oldtree.simblocks[arr[pos++]];
			for(const auto& [cid, new_ind] : newsb.cmap) {
				if(oldsb.cmap.contains(cid)) {
					const u32 old_ind = oldsb.cmap.at(cid);
					newCellbuf[new_ind].values[LINK_TARGETS.OUTPUT] = olddata[old_ind];
				}
			}
		}
	}

};



