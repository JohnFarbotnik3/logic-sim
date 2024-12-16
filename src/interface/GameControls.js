
class GameControls {
	update() {
		// update deltas
		updateInputDeltas();
		
		// update game input
		const isCanvasActive = GameUI.isCanvasActive;
		const isCanvasHovered = GameUI.isCanvasHovered;
		
		// update cursor position (compute z-intersect)
		const linePos   = new Vector3D(cameraPos.slice());
		const lineVec   = new Vector3D(getCameraRayDirection(cursor_curr));
		const planePos  = new Vector3D([0,0,0]);
		const planeVecA = new Vector3D([1,0,0]);
		const planeVecB = new Vector3D([0,1,0]);
		const [success, position] = VectorUtil.collision_line_plane_3d(linePos, lineVec, planePos, planeVecA, planeVecB);
		this.cursor_pos.set(position, 0);
		
		// useful state abbreviations.
		const mousePos = this.cursor_pos;
		const mouseMoved = (cursor_delta[0] != 0.0) | (cursor_delta[1] != 0.0);
		const buttonDownL = button_prev.get(0);
		const buttonDownR = button_prev.get(2);
		const clickDeltaL = button_delta.get(0);
		const clickDeltaR = button_delta.get(2);
		const dragBegan  = (clickDeltaL === +1) /*Boolean(dragbeg_event_prev)*/ && isCanvasHovered;
		const dragEnded  = (clickDeltaL === -1) /*Boolean(dragend_event_prev)*/ && isCanvasHovered;
		
		// update cursor drag area
		if(dragBegan  ) this.cursor_dragBeg.set(mousePos, 0);
		if(buttonDownL) {
			this.cursor_dragEnd.set(mousePos, 0);
			const drag_points = new Float32Array([
				...this.cursor_dragBeg,
				...this.cursor_dragEnd,
			]);
			this.cursor_dragAABB.set(VectorUtil.get_AABB_from_points_2d(drag_points, 0, 6, 3), 0);
		}
		
		// update hovered items.
		this.updateHoveredItems();
		
		// select, translate, or delete items.
		if(this.cursor_mode === this.CURSOR_MODE.SELECT) {
			// update state and selection.
			if(!buttonDownL) this.collectionTranslating.clear();
			if(dragBegan) {
				let isTranslating = false;
				let holdingShift = this.getKeydown("Shift");
				if(!holdingShift) {
					const hoveredAndSelected = this.collectionHovered.intersection(this.collectionSelected);
					console.log("hoveredAndSelected.count()", hoveredAndSelected.count());
					if(hoveredAndSelected.count() > 0) {
						// translate selected.
						this.collectionTranslating.addFromCollection(this.collectionSelected);
					} else {
						// replace selected with first hovered component.
						this.collectionSelected.clear();
						this.collectionSelected.addFirstComponentFromCollection(this.collectionHovered);
						this.collectionTranslating.clear();
						this.collectionTranslating.addFromCollection(this.collectionSelected);
						GameUI.update_select_inputs();
					}
					console.log("this.collectionHovered", this.collectionHovered);
					console.log("this.collectionSelected", this.collectionSelected);
					console.log("this.collectionTranslating", this.collectionTranslating);
					isTranslating = this.collectionTranslating.count() > 0;
					if(isTranslating) {
						this.translate_start.set(this.cursor_pos);
						this.translate_prev .set(this.cursor_pos);
						this.translate_curr .set(this.cursor_pos);
					}
				}
				this.cursor_isTranslating	=  isTranslating;
				this.cursor_isSelecting		= !isTranslating;
				if(!holdingShift && !isTranslating) this.collectionSelected.clear();
			}
			if(dragEnded) {
				if(this.cursor_isSelecting) {
					this.selectAllItemsInDragArea();
					GameUI.update_select_inputs();
				}
			}
			if(!buttonDownL) {
				this.cursor_isSelecting = false;
				this.cursor_isTranslating = false;
			}
			if(this.cursor_isTranslating) this.translateAllSelectedItems();
			if(this.getKeydownDelta("Delete") === +1) this.deleteSelectedItems();
		} else {
			//this.collectionHovered.clear();
			this.collectionSelected.clear();
			this.collectionTranslating.clear();
		}
		
		// set cell values.
		if(this.cursor_mode === this.CURSOR_MODE.SET_VALUES) {
			if(isCanvasHovered && buttonDownL) this.setval_hovered_lmb();
			if(isCanvasHovered && buttonDownR) this.setval_hovered_rmb();
		}
		
		// place cells.
		if(this.cursor_mode === this.CURSOR_MODE.PLACE_CELL) {
			// update preview item.
			this.place_placementUpdate_cell();
			// create new item and add it to root block template.
			if(isCanvasHovered && (clickDeltaL == +1)) this.place_placementPlace_cell();
		}
		
		// place links.
		/* 
			Links in child blocks are immutable, however links can be added
			in and between child-blocks when editing parent block.
			Note that the parent block is the owner of said links.
		*/
		if(this.cursor_mode === this.CURSOR_MODE.PLACE_LINK) {
			const step0 = this.wire_buttonStep==0;
			const step1 = this.wire_buttonStep==1;
			const step2 = this.wire_buttonStep==2;
			// highlight nearest link-point.
			this.wire_allTargetsValid = false;// TODO - implement change detection.
			if(mouseMoved | !this.wire_allTargetsValid) this.wire_updateNearestTarget();
			// bind nearest cell link-point.
			if(dragBegan && step0) {
				if(this.wire_bindTarget1()) this.wire_buttonStep = 1;
			}
			// bind nearest cell link-point if compatible with the first.
			if(dragBegan && step1) {
				if(this.wire_bindTarget2()) this.wire_buttonStep = 2;
			}
			// add new link, or replace an already existing one if it has same input.
			if(step2) {
				if(this.wire_addNewLink()) this.wire_buttonStep = 0;
			}
			// erase any hovered wires.
			if(buttonDownR) this.deleteHoveredLinks();
		} else {
			this.wire_buttonStep = 0;
		}
		
		// place blocks.
		if(this.cursor_mode === this.CURSOR_MODE.PLACE_BLOCK) {
			// update preview item.
			this.place_placementUpdate_block();
			// create new item and add it to root block template.
			if(isCanvasHovered && (clickDeltaL == +1)) this.place_placementPlace_block();
		}
		
		// clear input events
		clearInputEvents();
	}
	
	// ============================================================
	// input helpers.
	// ------------------------------------------------------------
	// get map value (case insensitive)
	getKeydown(key) {
		const map = keydown_curr;
		return map.get(key) || map.get(key.toLowerCase()) || map.get(key.toUpperCase());
	}
	getKeydownDelta(key) {
		const map = keydown_delta;
		return map.get(key) || map.get(key.toLowerCase()) || map.get(key.toUpperCase());
	}
	
	// ============================================================
	// placement modes.
	// ------------------------------------------------------------
	static CURSOR_MODE = ({
		NONE:			"None",
		SELECT:			"Select",
		SET_VALUES:		"Set cell values",
		PLACE_CELL:		"Place cells",
		PLACE_LINK:		"Place links",
		PLACE_TEXT:		"Place text",
		PLACE_BLOCK:	"Place blocks",
	});
	get CURSOR_MODE() {
		return GameControls.CURSOR_MODE;
	}
	cursor_mode = GameControls.CURSOR_MODE.SELECT;
	
	set_mode_none() {
		this.cursor_mode = this.CURSOR_MODE.NONE;
	}
	set_mode_select() {
		this.cursor_mode = this.CURSOR_MODE.SELECT;
	}
	set_mode_set_values() {
		this.cursor_mode = this.CURSOR_MODE.SET_VALUES;
	}
	set_mode_place_cells(cellType) {
		if(cellType) this.place_preview_cell = new Cell(cellType, 0x0);
		if(this.place_preview_cell) this.cursor_mode = this.CURSOR_MODE.PLACE_CELL;
		else this.set_mode_none();
	}
	set_mode_place_links() {
		this.cursor_mode = this.CURSOR_MODE.PLACE_LINK;
	}
	set_mode_place_texts() {
		this.cursor_mode = this.CURSOR_MODE.PLACE_TEXT;
	}
	set_mode_place_blocks(templateId) {
		if(templateId) {
			const dim = new ComponentDimensions(0,0,1,1,0);
			this.place_preview_block = new Block(dim, templateId);
		} else {
			const tid = this.place_preview_block?.templateId;
			const safe = tid && !gameData.blockTemplates.get(tid).containsRootBlockTemplate();
			if(!safe) this.place_preview_block = null;
		}
		if(this.place_preview_block) this.cursor_mode = this.CURSOR_MODE.PLACE_BLOCK;
		else this.set_mode_none();
	}
	
	// ============================================================
	// basic content modifying functions.
	// ------------------------------------------------------------
	
	add_cell (item) { gameData.rootBlock.insertCell (item); }
	add_link (item) { gameData.rootBlock.insertLink (item); }
	add_block(item) { gameData.rootBlock.insertBlock(item); GameUI.on_minor_blocklib_change(); }
	add_text (item) { gameData.rootBlock.insertText (item); }
	rem_cell (item) { gameData.rootBlock.deleteCell (item); }
	rem_link (item) { gameData.rootBlock.deleteLink (item); }
	rem_block(item) { gameData.rootBlock.deleteBlock(item); GameUI.on_minor_blocklib_change(); }
	rem_text (item) { gameData.rootBlock.deleteText (item); }
	move_item(item,x,y,w,h,r) {
		const dim = item.dimensions;
		if(
			(dim.x === x) &
			(dim.y === y) &
			(dim.w === w) &
			(dim.h === h) &
			(dim.r === r)
		) return;
		dim.x = x;
		dim.y = y;
		dim.w = w;
		dim.h = h;
		dim.r = r;
		CachedValue_Rendering.onChange();
	}
	translate_item(item,dx,dy) {
		if(dx === 0 & dy === 0) return;
		item.dimensions.x += dx;
		item.dimensions.y += dy;
		CachedValue_Rendering.onChange();
	}
	
	// ============================================================
	// selection and translation.
	// ------------------------------------------------------------
	cursor_isSelecting		= false;// true if items are going to be added to selection.
	cursor_isTranslating	= false;// true if selected items are being moved with the cursor.
	cursor_radius		= 0.5;
	cursor_snap			= 0.5;
	cursor_pos			= new Vector3D();
	cursor_dragBeg		= new Vector3D();
	cursor_dragEnd		= new Vector3D();
	cursor_dragAABB		= new Float32Array(4);// [x,y,x,y]
	translate_start		= new Vector3D();
	translate_prev		= new Vector3D();
	translate_curr		= new Vector3D();
	collectionSelected		= new ItemCollection();
	collectionHovered		= new ItemCollection();
	collectionTranslating	= new ItemCollection();
	isItemInDragArea(item) {
		const aabb = gameData.renderBlock.get_axis_aligned_bounding_box(item);
		VerificationUtil.verifyType_throw(aabb, Float32Array);
		return VectorUtil.collision_aabb_aabb_2d(aabb, this.cursor_dragAABB);
	}
	isItemHovered(item) {
		const aabb = gameData.renderBlock.get_axis_aligned_bounding_box(item);
		VerificationUtil.verifyType_throw(aabb, Float32Array);
		return VectorUtil.collision_aabb_point_2d(aabb, this.cursor_pos);
	}
	isLinkHovered(link) {
		const points = gameData.renderBlock.l_points.get(link.id);
		const pointC = new Vector2D(this.cursor_pos.slice(0,2));
		const pointA = new Vector2D(points.slice(0,2));
		const pointB = new Vector2D(points.slice(3,5));
		const nearest = VectorUtil.nearestPoint_point_line_segment_2d(pointC, pointA, pointB);
		const nearest3d = new Vector3D([nearest[0], nearest[1], 0.0]);
		const distance = nearest3d.add(this.cursor_pos, -1.0).hypot();
		return distance <= this.cursor_radius;
	}
	selectAllItemsInDragArea() {
		const block = gameData.rootBlock;
		for(const item of block.cells ) if(this.isItemInDragArea(item)) this.collectionSelected.cells .add(item);
		for(const item of block.texts ) if(this.isItemInDragArea(item)) this.collectionSelected.texts .add(item);
		for(const item of block.blocks) if(this.isItemInDragArea(item)) this.collectionSelected.blocks.add(item);
	}
	updateHoveredItems() {
		this.collectionHovered.clear();
		const block = gameData.rootBlock;
		for(const item of block.cells ) if(this.isItemHovered(item)) this.collectionHovered.cells .add(item);
		for(const item of block.texts ) if(this.isItemHovered(item)) this.collectionHovered.texts .add(item);
		for(const item of block.blocks) if(this.isItemHovered(item)) this.collectionHovered.blocks.add(item);
	}
	translateAllSelectedItems() {
		this.translate_prev.set(this.translate_curr);
		this.translate_curr.set(this.cursor_pos);
		const m = this.cursor_snap;
		const delta_prev = this.translate_prev.add(this.translate_start, -1.0).round(m);
		const delta_curr = this.translate_curr.add(this.translate_start, -1.0).round(m);
		const move = delta_curr.add(delta_prev, -1.0);
		const dx = move[0];
		const dy = move[1];
		for(const item of this.collectionTranslating.cells ) this.translate_item(item,dx,dy);
		for(const item of this.collectionTranslating.texts ) this.translate_item(item,dx,dy);
		for(const item of this.collectionTranslating.blocks) this.translate_item(item,dx,dy);
	}
	clearCollections() {
		this.collectionSelected.clear();
		this.collectionHovered.clear();
		this.collectionTranslating.clear();
	}
	deleteSelectedItems() {
		const block = gameData.rootBlock;
		for(const item of this.collectionSelected.cells ) this.rem_cell(item);
		for(const item of this.collectionSelected.texts ) this.rem_text(item);
		for(const item of this.collectionSelected.blocks) this.rem_block(item);
		this.clearCollections();
	}
	deleteHoveredLinks() {
		const block = gameData.rootBlock;
		const del = new Set();
		for(const item of block.links) if(this.isLinkHovered(item)) del.add(item);
		for(const item of del.keys()) this.rem_link(item);
	}
	
	// ============================================================
	// cell (simulation-)value setting.
	// ------------------------------------------------------------
	setval_value_lmb = 0xffffffff;
	setval_value_rmb = 0x00000000;
	setval_hovered(val) {
		for(const item of this.collectionHovered.cells) {
			const ind = simulation.root_simulation_block.getCellIndex(item.id);
			simulation.applyCellOutputChange(ind, val);
			if(item.type === CELL_PROPERTIES.CONSTANT.type) item.value = val;
		}
	}
	setval_hovered_lmb() { this.setval_hovered(this.setval_value_lmb); }
	setval_hovered_rmb() { this.setval_hovered(this.setval_value_rmb); }
	
	// ============================================================
	// item placement.
	// ------------------------------------------------------------
	place_dim_cell			= [1,1,0];// [w,h,r]
	place_dim_block			= [2,2,0];// [w,h,r]
	place_preview_cell		= null;
	place_preview_block		= null;
	get_render_preview_cell () { return (this.cursor_mode === this.CURSOR_MODE.PLACE_CELL ) ? this.place_preview_cell  : null; }
	get_render_preview_block() { return (this.cursor_mode === this.CURSOR_MODE.PLACE_BLOCK) ? this.place_preview_block : null; }
	place_cursor_xy() {
		const mult = this.cursor_snap;
		const minv = 1.0 / mult;
		const offset = gameData.renderBlock.contentTran;// NOTE: direct T2D array access.
		const x = Math.round((this.cursor_pos[0] - offset[0]) * minv) * mult;
		const y = Math.round((this.cursor_pos[1] - offset[1]) * minv) * mult;
		return [x,y];
	}
	place_placementUpdate_cell() {
		const [x,y] = this.place_cursor_xy();
		const [w,h,r] = this.place_dim_cell;
		this.move_item(this.place_preview_cell, x,y,w,h,r);
	}
	place_placementUpdate_block() {
		const preview = this.place_preview_block;
		if(!preview) return;
		const [x,y] = this.place_cursor_xy();
		const [w,h,r] = this.place_dim_block;
		this.move_item(this.place_preview_block, x,y,w,h,r);
	}
	place_placementPlace_cell() {
		const item = this.place_preview_cell.clone();
		item.id = ComponentId.next();// ensure that new component has unique id.
		this.add_cell(item);
	}
	place_placementPlace_block() {
		const item = this.place_preview_block.clone();
		item.id = ComponentId.next();// ensure that new component has unique id.
		this.add_block(item);
	}
	place_stopBlockPlacement() {
		this.set_mode_select();
	}
	
	// ============================================================
	// wire placement.
	// ------------------------------------------------------------
	
	wire_buttonStep			= 0;
	wire_allTargets			= [];// Array<[point, bid, cid, tgt]>
	wire_allTargetsValid	= false;
	wire_colour				= 0xffffffff;
	wire_targetNearest		= null;
	wire_target1			= null;
	wire_target2			= null;
	get wire_nearestValid() { return this.wire_targetNearest !== null; }
	get_link_point(blockId, cell, tgt) {
		VerificationUtil.verifyType_throw(cell, Cell);
		let renblock = gameData.renderBlock;
		if(blockId !== ComponentId.THIS_BLOCK && blockId !== gameData.rootBlock.id) renblock = renblock.children.get(blockId);
		if(!renblock) console.error(blockId, gameData.renderBlock.children);
		const points = renblock.c_points.get(cell.id);
		VerificationUtil.verifyType_throw(points, Float32Array);
		return points.slice(tgt*3, tgt*3+3);
	}
	wire_updateTargetsList() {
		this.wire_allTargets = [];
		const OUT = Cell.LINK_TARGET.OUTPUT;
		const INA = Cell.LINK_TARGET.INPUT_A;
		const INB = Cell.LINK_TARGET.INPUT_B;
		// cell targets in rootBlock can be modified (all targets are valid).
		{
			const block = gameData.rootBlock;
			const {out, ina, inb} = block.template.getValidCellTargets(true);
			const blockId = block.id;// NOTE: new link insertion code checks this.
			let tgt;
			tgt=OUT; for(const cell of out.keys()) this.wire_allTargets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INA; for(const cell of ina.keys()) this.wire_allTargets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INB; for(const cell of inb.keys()) this.wire_allTargets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
		}
		// used cell inputs in child-blocks are immutable.
		for(const block of gameData.rootBlock.blocks) {
			const {out, ina, inb} = block.template.getValidCellTargets(false);
			const blockId = block.id;
			let tgt;
			tgt=OUT; for(const cell of out.keys()) this.wire_allTargets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INA; for(const cell of ina.keys()) this.wire_allTargets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INB; for(const cell of inb.keys()) this.wire_allTargets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
		}
		this.wire_allTargetsValid = true;
	}
	wire_updateNearestTarget() {
		const OUT = Cell.LINK_TARGET.OUTPUT;
		const INA = Cell.LINK_TARGET.INPUT_A;
		const INB = Cell.LINK_TARGET.INPUT_B;
		const TGT = (this.wire_buttonStep > 0) ? this.wire_target1[3] : Cell.LINK_TARGET.NONE;
		if(!this.wire_allTargetsValid) this.wire_updateTargetsList();
		if(this.wire_allTargets.length <= 0) { this.wire_targetNearest = null; return; }
		const pos	= this.cursor_pos;
		let ind		= 0;
		let dist	= -1;
		let valid	= false;
		for(let i=0;i<this.wire_allTargets.length;i++) {
			const [point, bid, cid, tgt] = this.wire_allTargets[i];
			if(TGT === Cell.LINK_TARGET.NONE || Cell.canLinkTargets(TGT, tgt)) {
				const d = pos.add(point, -1.0).hypotSquared();
				if(d < dist | !valid) { ind=i; dist=d; valid=true; }
			}
		}
		this.wire_targetNearest = this.wire_allTargets[ind];
	}
	wire_getTargetDrawPoints() {
		const points = [];
		const [point0, bid, cid, tgt] = this.wire_targetNearest;
		points.push(this.wire_targetNearest[0]);
		if(this.wire_buttonStep >= 1) points.push(this.wire_target1[0]);
		if(this.wire_buttonStep >= 2) points.push(this.wire_target2[0]);
		return points;
	}
	wire_bindTarget1() {
		this.wire_target1 = this.wire_targetNearest;
		return this.wire_target1 !== null;
	}
	wire_bindTarget2() {
		this.wire_target2 = this.wire_targetNearest;
		const tgt1 = this.wire_target1[3];
		const tgt2 = this.wire_target2[3];
		const OUTPUT = Cell.LINK_TARGET.OUTPUT;
		return (tgt1 != tgt2) & ((tgt1 == OUTPUT) | (tgt2 == OUTPUT));
	}
	wire_addNewLink() {
		const OUTPUT = Cell.LINK_TARGET.OUTPUT;
		const target1 = this.wire_target1;
		const target2 = this.wire_target2;
		let targetSrc = (target1[3] === OUTPUT) ? target1 : target2;
		let targetDst = (target1[3] !== OUTPUT) ? target1 : target2;
		const [point_src, bid_src, cid_src, tgt_src] = targetSrc;
		const [point_dst, bid_dst, cid_dst, tgt_dst] = targetDst;
		const item = new Link(bid_src, bid_dst, cid_src, cid_dst, tgt_dst, this.wire_colour);
		this.add_link(item);
		console.log("NEW LINK", item);
		return true;
	}
	
};



