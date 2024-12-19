
struct SimulationBlock {
	/* TemplateId for this simulation block */
	ComponentId	templateId;
	/* BlockId of this simulation block inside parent. */
	ComponentId	blockId;
	/* Indices of children in simblock array. */
	Map<ComponentId, u32> bmap;
	/* Indices of cells in simulation data. */
	Map<ComponentId, u32> cmap;
	
	SimulationBlock(ComponentId templateId, ComponentId blockId) {
		this->templateId	= templateId;
		this->blockId		= blockId;
	}
	
	bool hasCellIndex(cellId) { return this->cmap.has(cellId); }
	bool getCellIndex(cellId) { return this->cmap.get(cellId); }
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
	SimulationBlock getSimblock(simblock, blockId) {
		return blockId === ComponentId.THIS_BLOCK ? simblock : this->simblocks[simblock.bmap.get(blockId)];
	}
	
	void initNode(SimulationBlock& simblock) {
		// create and push child simblocks.
		const BlockTemplate btmp = this->getTemplate(simblock.templateId);
		int initIndex = this->simblocks.size();
		int nextIndex = this->simblocks.size();
		for(const Block block : btmp.blocks) {
			simblock.bmap[block.id] = nextIndex++;
			this->simblocks.emplace_back(block.templateId, block.id);
		}
		// initialize children.
		for(int x=initIndex;x<nextIndex;x++) this->initNode(this->simblocks[x]);
	}
	void initTree(ComponentId rootTemplateId) {
		this->simblocks.clear();
		this->simblocks.emplace_back(rootTemplateId, ComponentId.NONE);
		this->initNode(simblock);
	}
};



