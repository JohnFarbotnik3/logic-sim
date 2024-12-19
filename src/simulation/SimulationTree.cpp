
struct SimulationBlock {
	/* TemplateId for this simulation block */
	ComponentId	templateId;
	/* BlockId of this simulation block inside parent. */
	ComponentId	blockId;
	/* Indices of children in simblock array. */
	Map<ComponentId, u32> bmap;
	/* Indices of cells in simulation data. */
	Map<ComponentId, u32> cmap;
	/* Reference to parent simblock. */
	SimulationBlock* parent;
	
	SimulationBlock(ComponentId templateId, ComponentId blockId, SimulationBlock* parent) {
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
	
	SimulationTree(BlockTemplateLibrary library) {
		this->library = library;
	}
	
	BlockTemplate getTemplate(ComponentId templateId) {
		return this->library.templates[templateId];
	}
	BlockTemplate getTemplate(SimulationBlock& simblock) {
		return this->library.templates[simblock.templateId];
	}
	SimulationBlock& getSimblock(SimulationBlock& simblock, ComponentId blockId) {
		return blockId === ComponentId.THIS_BLOCK ? simblock : this->simblocks[simblock.bmap.get(blockId)];
	}
	/* Get cell index based on called simblock and link address (blockId + cellId). */
	u32 getCellIndex(SimulationBlock& simblock, ComponentId blockId, ComponentId cellId) {
		return this->getSimblock(simblock, blockId).cmap[cellId];
	}
	
	void initNode(SimulationBlock& simblock) {
		// create and push child simblocks.
		const BlockTemplate btmp = this->getTemplate(simblock.templateId);
		int initIndex = this->simblocks.size();
		int nextIndex = this->simblocks.size();
		for(const Block block : btmp.blocks) {
			this->simblocks.emplace_back(block.templateId, block.id, &simblock);
			simblock.bmap[block.id] = nextIndex++;
		}
		// initialize children.
		for(int x=initIndex;x<nextIndex;x++) this->initNode(this->simblocks[x]);
	}
	void initTree(ComponentId rootTemplateId) {
		this->simblocks.clear();
		this->simblocks.emplace_back(rootTemplateId, ComponentId.NONE, nullptr);
		this->initNode(simblock);
	}
};



