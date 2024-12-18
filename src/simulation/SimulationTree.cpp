
struct SimulationBlock {
	/* TemplateId for this simulation block */
	ComponentId	templateId;
	/* BlockId of this simulation block inside parent. */
	ComponentId	blockId;
	/* Map of indices of children in simblock array. */
	Map<ComponentId, u32> bmap;
	/* Map of indices of cells in simulation data. */
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
	BlockTemplateLibrary templates;
	
	SimulationTree(BlockTemplateLibrary templates) {
		this->templates = templates;
	}
	
	BlockTemplate getTemplate(ComponentId templateId) {
		return this->templates.getTemplate(templateId);
	}
	BlockTemplate getTemplate(SimulationBlock& simblock) {
		return this->templates.getTemplate(simblock.templateId);
	}
	SimulationBlock getSimblock(simblock, blockId) {
		return blockId === ComponentId.THIS_BLOCK ? simblock : this->simblocks[simblock.bmap.get(blockId)];
	}
	
	void initNode(ComponentId templateId, ComponentId blockId) {
		const BlockTemplate btemp = this->getTemplate(templateId);
		const SimulationBlock simblock(templateId, blockId);
		this->simblocks.push_back(simblock);
		simblock.bmap.reserve(bt.blocks.length());
		for(const Block block : btemp.blocks) {
			simblock.bmap[bid] = this->simblocks.size();
			this->initNode(block.templateId, block.id);
		}
	}
	void initTree(ComponentId rootTemplateId) {
		this->simblocks.clear();
		this->initNode(rootTemplateId, ComponentId.NONE);
	}
};



