#include "../Imports.cpp"
#include "../content/ItemId.cpp"
#include "../content/BlockTemplateLibrary.cpp"

struct SimulationBlock {
	/* TemplateId for this simulation block */
	ItemId	templateId;
	/* BlockId of this simulation block inside parent. */
	ItemId	blockId;
	/* Indices of children in simblock array. */
	Map<ItemId, u32> bmap;
	/* Indices of cells in simulation data. */
	Map<ItemId, u32> cmap;
	/* Reference to parent simblock. */
	SimulationBlock* parent;
	
	SimulationBlock(ItemId templateId, ItemId blockId, SimulationBlock* parent) {
		this->templateId	= templateId;
		this->blockId		= blockId;
		this->parent		= parent;
	}
};

struct SimulationTree {
	/* Array of simblocks. First block is root block. */
	Vector<SimulationBlock> simblocks;
	/* a copy of the BlockTemplateLibrary this tree is based on. */
	BlockTemplateLibrary library;
	
	SimulationTree() {}
	SimulationTree(BlockTemplateLibrary library) {
		this->library = library;
	}
	
	BlockTemplate& getTemplate(ItemId templateId) {
		return this->library.templates[templateId];
	}
	BlockTemplate& getTemplate(SimulationBlock& simblock) {
		return this->library.templates[simblock.templateId];
	}
	const SimulationBlock& getSimblock(const SimulationBlock& simblock, ItemId blockId) {
		return blockId == ItemId::THIS_BLOCK ? simblock : this->simblocks[simblock.bmap.at(blockId)];
	}
	/* Get cell index based on called simblock and link address (blockId + cellId). */
	u32 getCellIndex(const SimulationBlock& simblock, ItemId blockId, ItemId cellId) {
		return this->getSimblock(simblock, blockId).cmap.at(cellId);
	}
	
	void initNode(SimulationBlock& simblock) {
		// create and push child simblocks.
		const BlockTemplate btmp = this->getTemplate(simblock.templateId);
		int initIndex = this->simblocks.size();
		int nextIndex = this->simblocks.size();
		for(const Block& block : btmp.blocks) {
			this->simblocks.emplace_back(block.templateId, block.id, &simblock);
			simblock.bmap[block.id] = nextIndex++;
		}
		// initialize children.
		for(int x=initIndex;x<nextIndex;x++) this->initNode(this->simblocks[x]);
	}
	void initTree(ItemId rootTemplateId) {
		this->simblocks.clear();
		SimulationBlock& simblock = this->simblocks.emplace_back(rootTemplateId, ItemId::NONE, nullptr);
		this->initNode(simblock);
	}
};



