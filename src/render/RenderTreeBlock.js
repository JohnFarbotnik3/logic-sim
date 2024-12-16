
/*
	This struct stores maps of transformations for the blocks content,
	as well as a map of child transformation-blocks.
*/
class RenderTreeBlock {
	
	// ============================================================
	// Constants.
	// ------------------------------------------------------------
	
	static LINK_POINTS_F32 = new Float32Array([
		1.00, 0.50, 0.00,// output
		0.00, 0.75, 0.00,// input-a
		0.00, 0.25, 0.00,// input-b
	]);
	
	static LINK_POINTS_ARR = ([
		[1.00, 0.50, 0.00],// output
		[0.00, 0.75, 0.00],// input-a
		[0.00, 0.25, 0.00],// input-b
	]);
	
	static LINK_RECTS_ARR = RenderTreeBlock.LINK_POINTS_ARR.map(([x,y,z]) => {
		const s = 0.1;
		return [x-s,y-s,s*2,s*2];
	});
	
	static CELL_AREA_RECTS = ([
		[0.5, 0.0, 0.5, 1.0],// OUTPUT
		[0.0, 0.5, 0.5, 0.5],// INPUT_A
		[0.0, 0.0, 0.5, 0.5],// INPUT_B
	]);
	
	static CELL_RECTS = [
		...RenderTreeBlock.CELL_AREA_RECTS,
		...RenderTreeBlock.LINK_RECTS_ARR,
	];

	// ============================================================
	// Structors.
	// ------------------------------------------------------------
	
	constructor(parent, block, externalTransformation, depth, maxDepth) {
		this.parent			= parent;	// parent transformation block. 
		this.block			= block;	// reference to Block this is associated with.
		this.depth			= depth;
		this.externalTran	= externalTransformation;	// Transformation2D
		this.contentTran	= null;						// Transformation2D
		this.itemTran		= null;						// Transformation2D
		this.item_trans		= new Map();// Map<id, item_transformation>
		this.c_points		= new Map();// Map<id, link_points_f32[3x3]>
		this.l_points		= new Map();// Map<id, link_points_f32[3x2]>
		this.children		= new Map();// Map<id, RenderTreeBlock>
		this.render_data_cells	= [];
		this.render_data_links	= [];
		this.render_data_texts  = [];
		this.render_data_blocks	= [];
		this.is_hovered			= false;
		this.is_selected		= false;
		// ==============================
		// General transformation data.
		// ------------------------------
		
		// initialize item transformations.
		this.itemTran = RenderTreeBlock.get_item_transformation(block, this.externalTran);
		this.contentTran = RenderTreeBlock.get_content_transformation(block, this.externalTran);
		const contran = this.contentTran;
		const template = block.template;
		for(const item of template.cells ) this.item_trans.set(item.id, RenderTreeBlock.get_item_transformation(item, contran));
		for(const item of template.texts ) this.item_trans.set(item.id, RenderTreeBlock.get_item_transformation(item, contran));
		for(const item of template.blocks) this.item_trans.set(item.id, RenderTreeBlock.get_item_transformation(item, contran));
		// initialize cell link-points.
		for(const item of template.cells) {
			const points = RenderTreeBlock.LINK_POINTS_F32.slice();
			const tran = this.item_trans.get(item.id);
			tran.apply(points, 0, points.length, 3);
			this.c_points.set(item.id, points);
		}
		// initialize children.
		if(depth < maxDepth) {
			for(const child of template.blocks) {
				const tb = new RenderTreeBlock(this, child, contran, depth+1, maxDepth);
				this.children.set(child.id, tb);
			}
		}
		// initialize link link-points.
		for(const item of template.links) {
			let points = new Float32Array(6);
			const {bid_src, bid_dst, cid_src, cid_dst, tgt_src, tgt_dst} = item;
			points.set(this.get_cell_link_point(bid_src, cid_src, tgt_src), 0);
			points.set(this.get_cell_link_point(bid_dst, cid_dst, tgt_dst), 3);
			this.l_points.set(item.id, points);
		}
		// initialize item render data.
		for(const item of template.cells ) this.render_data_cells .push(this.get_render_data_cell (item));
		for(const item of template.links ) this.render_data_links .push(this.get_render_data_link (item));
		for(const item of template.texts ) this.render_data_texts .push(this.get_render_data_text (item));
		for(const item of template.blocks) this.render_data_blocks.push(this.get_render_data_block(item));
	}
	
	// ============================================================
	// Initialization helpers.
	// ------------------------------------------------------------
	
	static UNIT_SQUARE_TRANSFORMATION = new Transformation2D(-0.5, -0.5, 1.0, 1.0, 0);
	static get_item_transformation(item, externalTran) {
		const unit = RenderTreeBlock.UNIT_SQUARE_TRANSFORMATION;
		const dim = item.dimensions;
		const itran = new Transformation2D(dim.x, dim.y, dim.w, dim.h, dim.r);
		return externalTran.compose(itran).compose(unit);
	}
	static get_content_transformation(block, externalTran) {
		VerificationUtil.verifyTypes_throw([block, externalTran], [Block, Transformation2D]);
		const template = block.template;
		VerificationUtil.verifyTypes_throw([template], [BlockTemplate]);
		// normalize internal dimensions to unit-square.
		const scale = new Transformation2D(0, 0, 1.0/template.width, 1.0/template.height, 0);
		// apply item transformation.
		const itran = this.get_item_transformation(block, externalTran);
		return itran.compose(scale);
	}
	get_cell_link_point(bid, cid, tgt) {
		const ofs = tgt * 3;
		// if cell is in this block.
		if(bid === ComponentId.THIS_BLOCK)
			return this.c_points.get(cid).slice(ofs,ofs+3);
		// if cell is in initialized child block.
		if(this.children.has(bid))
			return this.children.get(bid).c_points.get(cid).slice(ofs,ofs+3);
		// else, use middle of block.
		const point = new Float32Array([0.5, 0.5, 0.0]);
		const btran = this.item_trans.get(bid);
		btran.apply(point, 0, point.length, 3);
		return point;
	}
	get_axis_aligned_bounding_box(item) {
		const points = [
			0,0,0,
			1,0,0,
			1,1,0,
			0,1,0,
		];
		const tran = this.item_trans.get(item.id);
		tran.apply(points, 0, points.length, 3);
		const aabb = VectorUtil.get_AABB_from_points_2d(points, 0, points.length, 3);
		return aabb;
	}
	
	// ============================================================
	// Update.
	// ------------------------------------------------------------
	
	_update_cell_values(simblock) {
		for(const renderData of this.render_data_cells) {
			const cell		= renderData.cell;
			const cid		= cell.id;
			const vals		= renderData.vals;
			if(simblock) simulation.populateCellValues(simblock, cid, vals);
			const clrs		= renderData.cell_clrs;
			const clr		= cell.clr;
			const clr_off	= GameRenderer.hexColour_scale(clr, 0.5);
			for(let i=0;i<3;i++) clrs[i] = vals[i] ? clr : clr_off;
		}
		for(const [blockId, childRB] of this.children.entries()) childRB._update_cell_values(simblock.getSimblock(blockId));
	}
	
	_update_hover_state() {
		this.is_hovered  = gameControls.collectionHovered .blocks.has(this.block);
		this.is_selected = gameControls.collectionSelected.blocks.has(this.block);
		for(const [blockId, childRB] of this.children.entries()) childRB._update_hover_state();
	}
	
	update() {
		const simblock = simulation.root_simulation_block;
		this._update_cell_values(simblock);
		this._update_hover_state();
	}
	
	// ============================================================
	// Render data generators.
	// ------------------------------------------------------------
	
	get_render_data_cell(item) {
		const cell			= item;
		const tran			= RenderTreeBlock.get_item_transformation(item, this.contentTran);
		const numTargets	= cell.numTargets;
		const vals			= [0x0, 0x0, 0x0];
		const clr			= cell.clr;
		const area_clrs		= [clr, clr, clr];
		const link_clrs		= [0xffeeccff, 0xffeeccff, 0xffeeccff];
		const cell_clrs		= [...area_clrs, ...link_clrs];
		const rdata 		= { cell, tran, numTargets, vals, cell_clrs };
		return rdata;
	}
	
	get_render_data_link(item) {
		const link			= item;
		const points		= this.l_points.get(link.id);
		const p0			= [points[0], points[1]];
		const p1			= [points[3], points[4]];
		const rdata 		= { link, p0, p1 };
		return rdata;
	}
	
	get_render_data_text(item) {
		const text			= item;
		const tran			= RenderTreeBlock.get_item_transformation(item, this.contentTran);
		const rdata 		= { text, tran };
		return rdata;
	}
	
	get_render_data_block(item) {
		const block			= item;
		const tran			= RenderTreeBlock.get_item_transformation(item, this.contentTran);
		const rdata 		= {block, tran};
		return rdata;
	}
	
};



