#include "../Imports.cpp"
#include "../content/ItemId.cpp"
#include "../content/BlockTemplateLibrary.cpp"

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

	static const u32 INDEX_NONE = 0xffffffff;
	static const u32 INDEX_ROOT = 0x0;

	SimulationTree() {}
	SimulationTree(BlockTemplateLibrary library, ItemId rootTemplateId) {
		this->library = library;
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
};



