
/*
	Since BlockTemplates are shared when drawing,
	some sort of tree structure is required to associate simulation data
	with each virtual block instance in the template tree.
	
	The renderer will try to retrieve values from the simulation
	using "bmap" and "cmap", to then set template cell values.
	
	Note that in order to persist the maximum number of cell values despite various content changes,
	the entire simulation-block tree must be built and kept so that values can be transferred to new tree.
	(or to at least help with organization if using a "diff" based strategy for small content changes.)
*/
class SimulationTreeBlock {
	constructor(template, blockId, ibeg) {
		/* TemplateId for this simulation block */
		this.template = template;
		/* BlockId of this simulation block inside parent. */
		this.blockId = blockId;
		/* Start and end indices in cell buffer. */
		this.ibeg = ibeg;
		this.iend = ibeg;
		this.numCells = 0;
		/* Map of child simulation blocks in simblock buffer. */
		this.bmap = new Map();	// Map<blockId, index>
		/* Map of cells in simulation data, temporarily replaced with output values if being used for rebuilding. */
		this.cmap = new Map();	// Map<cellId, index>
		
		// assign cell indices.
		for(const cell  of template.cells ) {
			this.cmap.set(cell.id, (ibeg + this.numCells));
			this.numCells++;
		}
		// initialize children.
		for(const block of template.blocks) this.bmap.set(block.id, null);// pre-allocate slots.
		for(const block of template.blocks) {
			const sb = new SimulationTreeBlock(block.template, block.id, (ibeg + this.numCells));
			this.bmap.set(block.id, sb);
			this.numCells += block.template.totalCellsInTree();
		}
		this.iend = ibeg + this.numCells;
	}
	getSimblock(blockId) {
		return blockId === ComponentId.THIS_BLOCK ? this : this.bmap.get(blockId);
	}
	hasCellIndex(cellId       ) { return this.cmap.has(cellId); }
	getCellIndex(cellId       ) { return this.cmap.get(cellId); }
};



