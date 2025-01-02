import { ItemCollection } from "./ItemCollection"
import {
	Cell,
	Link,
	Block,
	ComponentId,
	ComponentDimensions,
	CELL_PROPERTIES,
} from "../content/exports";
import { InputProps, INPUT_TYPES } from "../../components/Input";
import { main } from "../Main.js";
import { InputHandlerSet } from "./InputHandlerSet";
import {
	Vector3D,
	Vector2D,
	VectorUtil,
	VerificationUtil,
	PromiseUtil,
} from "../lib/exports";
import { CachedValue_Content, CachedValue_Rendering } from "../misc/CachedValue";

export class GameUI {
	// ============================================================
	// Init
	// ------------------------------------------------------------

	init() {
		// create input handler.
		this.input = new InputHandlerSet();
	}

	// ============================================================
	// Update
	// ------------------------------------------------------------

	MODES = {
		// content editing modes.
		SELECT:			"Select",
		SET_VALUES:		"Outputs",
		PLACE_CELLS:	"Cells",
		PLACE_LINKS:	"Links",
		PLACE_BLOCKS:	"Blocks",
		// other panel modes.
		ROOT_BLOCK:		"Template",
		FILE:			"File",
	};
	currentMode = this.MODES.SELECT;
	setCurrentMode_callback = null;
	setCurrentMode(mode) {
		console.log("GameUI_v2.setCurrentMode(mode)", mode);
		this.currentMode = mode;
		PromiseUtil.tryUntilTruthy(() => this.setCurrentMode_callback, [], 100, 20)
			.then((func) => func(mode))
			.catch(() => console.error("failed to call setCurrentMode_callback"));
	}

	get buttonDownL() { return this.input.button_prev.get(0); }
	get buttonDownR() { return this.input.button_prev.get(2); }
	get clickDeltaL() { return this.input.button_delta.get(0); }
	get clickDeltaR() { return this.input.button_delta.get(2); }
	get dragBegan() { return (this.clickDeltaL === +1) && this.isCanvasHovered && this.isCanvasActive; }
	get dragEnded() { return (this.clickDeltaL === -1) && this.isCanvasHovered && this.isCanvasActive; }

	update() {
		const camera = main.gameRenderer.camera;
		const input = this.input;
		input.updateInputDeltas();

		// get canvas normalized cursor position.
		const [clientX, clientY] = input.cursor_curr;
		const { x, y, width, height } = this.getCanvas().getClientRects()[0];
		let mx = Math.min(Math.max((clientX - x) / width , 0.0), 1.0);
		let my = Math.min(Math.max((clientY - y) / height, 0.0), 1.0);
		mx = (mx * 2.0 - 1.0) * +1.0 * camera.aspectRatio;
		my = (my * 2.0 - 1.0) * -1.0;
		const canvas_xy = [mx, my];

		// update cursor position (compute z-intersect)
		const linePos   = new Vector3D(camera.pos.slice());
		const lineVec   = new Vector3D(camera.getRayDirection(canvas_xy));
		const planePos  = new Vector3D([0,0,0]);
		const planeVecA = new Vector3D([1,0,0]);
		const planeVecB = new Vector3D([0,1,0]);
		const [success, position] = VectorUtil.collision_line_plane_3d(linePos, lineVec, planePos, planeVecA, planeVecB);
		this.cursor_pos.set(position, 0);

		// update cursor drag area
		if(this.dragBegan  ) this.cursor_dragBeg.set(this.cursor_pos, 0);
		if(this.buttonDownL) {
			this.cursor_dragEnd.set(this.cursor_pos, 0);
			const drag_points = new Float32Array([
				...this.cursor_dragBeg,
				...this.cursor_dragEnd,
			]);
			this.cursor_dragAABB.set(VectorUtil.get_AABB_from_points_2d(drag_points, 0, 6, 3), 0);
		}

		// update hovered items.
		this.updateHoveredItems();

		// select, translate, or delete items.
		if(this.currentMode === this.MODES.SELECT) {
			this.update_mode_select();
		} else {
			this.collectionSelected.clear();
			this.collectionTranslating.clear();
			this.cursor_isSelecting = false;
			this.cursor_isTranslating = false;
		}

		// set cell values.
		if(this.currentMode === this.MODES.SET_VALUES) {
			this.update_mode_setval();
		}

		// place cells.
		if(this.currentMode === this.MODES.PLACE_CELLS) {
			this.update_mode_place_cells();
		}

		// place links.
		if(this.currentMode === this.MODES.PLACE_LINKS) {
			this.update_mode_place_links();
		} else {
			this.wire_buttonStep = 0;
		}

		// place blocks.
		if(this.currentMode === this.MODES.PLACE_BLOCKS) {
			this.update_mode_place_blocks();
		}

		this.update_hotkeys();

		// clear input events
		this.input.clearInputEvents();
	}

	update_hotkeys() {
		const active = !this.isInputElementActive;
		const input = this.input;
		const camera = main.gameRenderer.camera;
		//if(active & input.getKeydownDelta("p") === +1) GameUI.clickButton(this.hotkey_btn_play);
		if(active & input.getKeydownDelta("x") === +1) this.setCurrentMode(this.MODES.SELECT);
		if(active & input.getKeydownDelta("v") === +1) this.setCurrentMode(this.MODES.SET_VALUES);
		if(active & input.getKeydownDelta("c") === +1) this.setCurrentMode(this.MODES.PLACE_CELLS);
		if(active & input.getKeydownDelta("l") === +1) this.setCurrentMode(this.MODES.PLACE_LINKS);
		if(active & input.getKeydownDelta("b") === +1) this.setCurrentMode(this.MODES.PLACE_BLOCKS);
		if(active) {
			const moveU = input.getKeydown("w") | input.getKeydown("ArrowUp");
			const moveL = input.getKeydown("a") | input.getKeydown("ArrowLeft");
			const moveD = input.getKeydown("s") | input.getKeydown("ArrowDown");
			const moveR = input.getKeydown("d") | input.getKeydown("ArrowRight");
			const moveSpeed = (input.getKeydown("shift") ? 0.5 : 5.0) * camera.FOV;
			if(moveU) camera.move(0,+moveSpeed,0);
			if(moveD) camera.move(0,-moveSpeed,0);
			if(moveL) camera.move(-moveSpeed,0,0);
			if(moveR) camera.move(+moveSpeed,0,0);
			const zoomSpeed = 0.025;
			if(input.getKeydown("e")) camera.zoom(1 - zoomSpeed);
			if(input.getKeydown("q")) camera.zoom(1 + zoomSpeed);
		}
		if(this.isCanvasHovered) {
			// apply mouse input
			if(input.wheel_event) camera.zoom(1 + input.wheel_curr[1]*0.001);
		}
	}


	// ============================================================
	// Helpers.
	// ------------------------------------------------------------

	get isInputElementActive() {
		const elem = document.activeElement;
		const tag = elem.tagName.toLowerCase();
		if(tag == "input" | tag == "textarea") return true;
		return false;
	};

	unfocus(elem) {
		elem.blur();
	}

	clickButton(elem) {
		if(!elem.toggled) {
			elem.focus();
			elem.click();
			elem.blur();
		}
	}

	// ============================================================
	// Svelte Element Map
	// ------------------------------------------------------------

	elementMap = new Map();// Map<id, element>
	getElement(id) {
		return this.elementMap.get(id);
	}
	setElement(id, elem) {
		return this.elementMap.set(id, elem);
	}
	setElementValue(id, value) {
		const elem = this.elementMap.get(id);
		if(elem) elem.value = value;
		else console.error(`setElementValue(): elem with id ${id} not found`);
	}
	setElementEnabled(id, enabled) {
		const elem = this.elementMap.get(id);
		if(elem) elem.disabled = !enabled;
		else console.error(`setElementEnabled(): elem with id ${id} not found`);
	}

	// ============================================================
	// Canvas
	// ------------------------------------------------------------

	get isCanvasActive() { return !this.isInputElementActive; }

	isCanvasHovered = true;
	canvas_onmouseenter() { this.isCanvasHovered = true; }
	canvas_onmouseleave() { this.isCanvasHovered = false; }
	window_onresize() {
		console.log(`resizing canvas`);
		const canvas = this.getCanvas();
		const cw = canvas.width;
		const ch = canvas.height;
		const rect = canvas.parentElement.getBoundingClientRect();
		const ratio = Math.min(rect.width / cw, rect.height / ch);
		canvas.width  = Math.floor(rect.width);
		canvas.height = Math.floor(rect.height);
		main.recreateRenderer(canvas);
	}

	listener_window_onresize = null;
	listener_canvas_onmouseenter = null;
	listener_canvas_onmouseleave = null;
	listener_canvas_contextmenu = null;

	canvas = null;
	getCanvas() { return this.canvas; }
	setCanvas(newCanvas) {
		// remove old event listeners.
		if(this.canvas) {
			const canvas = this.canvas;
			canvas.removeEventListener("mouseenter"	, this.listener_canvas_onmouseenter);
			canvas.removeEventListener("mouseleave"	, this.listener_canvas_onmouseleave);
			canvas.removeEventListener("contextmenu", this.listener_canvas_contextmenu);
			window.removeEventListener("resize"		, this.listener_window_onresize);
		}
		// add new event listeners.
		const canvas = this.canvas = newCanvas;
		this.listener_canvas_onmouseenter	= (ev) => this.canvas_onmouseenter.call(this);
		this.listener_canvas_onmouseleave	= (ev) => this.canvas_onmouseleave.call(this);
		this.listener_canvas_contextmenu	= (ev) => ev.preventDefault();
		this.listener_window_onresize		= (ev) => this.window_onresize.call(this);
		canvas.addEventListener("mouseenter"	, this.listener_canvas_onmouseenter);
		canvas.addEventListener("mouseleave"	, this.listener_canvas_onmouseleave);
		canvas.addEventListener("contextmenu"	, this.listener_canvas_contextmenu);
		window.addEventListener("resize"		, this.listener_window_onresize);
		this.window_onresize();
	}

	// ============================================================
	// Tooltip
	// ------------------------------------------------------------

	tooltip_elem = null;//TODO
	show_tooltip(hoveredElem, htmlContent) {
		tooltip_elem.style.display = "";
		tooltip_elem.innerHTML = htmlContent;
		// TODO - place tooltip near hoveredElem, confined to window space if needed.
	}
	hide_tooltip() {
		tooltip_elem.style.display = "none";
	}

	// ============================================================
	// Popups.
	// ------------------------------------------------------------

	link_delete_popup = null;
	showLinkDeletionPopup(deletionList, text, onsubmit, oncancel) {
		const wrapper = new Div({ id:"link_delete_popup_wrapper", style:"display: flex; flex-direction: column;" });
		const header = new Div({ id:"link_delete_popup_header", parent:wrapper, innerText:text });
		for(const [template, links] of deletionList) {
			const tid = template.templateId;
			const elem = new Div({ id:`link_delete_popup_elem_${tid}`, parent:wrapper, innerText:`${template.name} (${links.length}x)` });
		}
		this.link_delete_popup = new Popup({ id:"link_delete_popup", parent:document.body, content:[wrapper], onsubmit, oncancel });
	}

	showCrashPopup(error, text) {
		//TODO: re-enable this (after overhaul)!
		//alert(text + "\n\n" + error);
	}

	// ============================================================
	// Content modification.
	// ------------------------------------------------------------

	changedContent  () { CachedValue_Content  .onChange(); }
	changedRendering() { CachedValue_Rendering.onChange(); }

	add_cell (item) { main.blockLibrary.rootBlock.insertCell (item); }
	add_link (item) { main.blockLibrary.rootBlock.insertLink (item); }
	add_block(item) { main.blockLibrary.rootBlock.insertBlock(item); this.on_minor_blocklib_change(); }
	add_text (item) { main.blockLibrary.rootBlock.insertText (item); }
	rem_cell (item) { main.blockLibrary.rootBlock.deleteCell (item); }
	rem_link (item) { main.blockLibrary.rootBlock.deleteLink (item); }
	rem_block(item) { main.blockLibrary.rootBlock.deleteBlock(item); this.on_minor_blocklib_change(); }
	rem_text (item) { main.blockLibrary.rootBlock.deleteText (item); }
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
		this.changedRendering();
	}
	translate_item(item,dx,dy) {
		if(dx === 0 & dy === 0) return;
		item.dimensions.x += dx;
		item.dimensions.y += dy;
		this.changedRendering();
	}

	// ============================================================
	// Item placement.
	// ------------------------------------------------------------

	place_dim_cell		= [1,1,0];// [w,h,r]
	place_dim_block		= [1,1,0];// [w,h,r]
	place_preview_cell	= null;
	place_preview_block	= null;

	get_render_preview_cell() {
		if(this.currentMode === this.MODES.PLACE_CELLS) return this.place_preview_cell;
		else return null;
	}
	get_render_preview_block() {
		if(this.currentMode === this.MODES.PLACE_BLOCKS) return this.place_preview_block;
		else return null;
	}

	place_cursor_xy() {
		const mult = this.cursor_snap;
		const minv = 1.0 / mult;
		const pos = this.cursor_pos.slice();
		const ofs = [0, 0];
		main.gameRenderer.renderBlock.contentTran.applyOffset(ofs, 0, 2, 2);
		const x = Math.round((pos[0] - ofs[0]) * minv) * mult;
		const y = Math.round((pos[1] - ofs[1]) * minv) * mult;
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

	update_mode_place_cells() {
		if(!this.place_preview_cell) return;
		// update preview item.
		this.place_placementUpdate_cell();
		// create new item and add it to root block template.
		if(this.isCanvasHovered && (this.clickDeltaL == +1)) this.place_placementPlace_cell();
	}
	update_mode_place_blocks() {
		if(!this.place_preview_block) return;
		// update preview item.
		this.place_placementUpdate_block();
		// create new item and add it to root block template.
		if(this.isCanvasHovered && (this.clickDeltaL == +1)) this.place_placementPlace_block();
	}

	// ============================================================
	// Selection
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

	update_mode_select() {
		// update state and selection.
		if(!this.buttonDownL) this.collectionTranslating.clear();
		if(this.dragBegan) {
			let isTranslating = false;
			let holdingShift = this.input.getKeydown("Shift");
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
					this.on_selection_update();
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
		if(this.dragEnded) {
			if(this.cursor_isSelecting) {
				this.selectAllItemsInDragArea();
				this.on_selection_update();
			}
		}
		if(!this.buttonDownL) {
			this.cursor_isSelecting = false;
			this.cursor_isTranslating = false;
		}
		if(this.cursor_isTranslating) this.translateAllSelectedItems();
		if(this.input.getKeydownDelta("Delete") === +1) this.deleteSelectedItems();
	}

	clearCollections() {
		this.collectionSelected.clear();
		this.collectionHovered.clear();
		this.collectionTranslating.clear();
	}
	isItemInDragArea(item) {
		const aabb = main.gameRenderer.renderBlock.get_axis_aligned_bounding_box(item);
		VerificationUtil.verifyType_throw(aabb, Float32Array);
		return VectorUtil.collision_aabb_aabb_2d(aabb, this.cursor_dragAABB);
	}
	isItemHovered(item) {
		const aabb = main.gameRenderer.renderBlock.get_axis_aligned_bounding_box(item);
		VerificationUtil.verifyType_throw(aabb, Float32Array);
		return VectorUtil.collision_aabb_point_2d(aabb, this.cursor_pos);
	}
	selectAllItemsInDragArea() {
		const block = main.blockLibrary.rootBlock;
		for(const item of block.cells ) if(this.isItemInDragArea(item)) this.collectionSelected.cells .add(item);
		for(const item of block.texts ) if(this.isItemInDragArea(item)) this.collectionSelected.texts .add(item);
		for(const item of block.blocks) if(this.isItemInDragArea(item)) this.collectionSelected.blocks.add(item);
	}
	updateHoveredItems() {
		this.collectionHovered.clear();
		const block = main.blockLibrary.rootBlock;
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
	deleteSelectedItems() {
		const block = main.blockLibrary.rootBlock;
		for(const item of this.collectionSelected.cells ) this.rem_cell(item);
		for(const item of this.collectionSelected.texts ) this.rem_text(item);
		for(const item of this.collectionSelected.blocks) this.rem_block(item);
		this.clearCollections();
	}

	info_select = [
		"- Select items by clicking them, or by dragging to select all items in drag-area.",
		"- Delete selected items by pressing 'DELETE' key.",
		"- Move selected items by hovering over any selected item, then clicking and dragging cursor.",
	].join("\n");

	get_selected_cells () { return [...this.collectionSelected.cells .values()]; }
	get_selected_blocks() { return [...this.collectionSelected.blocks.values()]; }
	items_set_v (items, value) { if(items.length > 0) { this.changedContent();   for(const item of items) item.value = value; } }
	items_set_w (items, value) { if(items.length > 0) { this.changedRendering(); for(const item of items) item.dimensions.w = value; } }
	items_set_h (items, value) { if(items.length > 0) { this.changedRendering(); for(const item of items) item.dimensions.h = value; } }
	items_set_r (items, value) { if(items.length > 0) { this.changedRendering(); for(const item of items) item.dimensions.r = value / 360; } }
	oninput_select_c_v (value) { const items = this.get_selected_cells(); this.items_set_v (items, value); console.log("X", value) }
	oninput_select_c_w (value) { const items = this.get_selected_cells(); this.items_set_w (items, value); }
	oninput_select_c_h (value) { const items = this.get_selected_cells(); this.items_set_h (items, value); }
	oninput_select_c_r (value) { const items = this.get_selected_cells(); this.items_set_r (items, value); }
	oninput_select_b_w (value) { const items = this.get_selected_blocks(); this.items_set_w (items, value); }
	oninput_select_b_h (value) { const items = this.get_selected_blocks(); this.items_set_h (items, value); }
	oninput_select_b_r (value) { const items = this.get_selected_blocks(); this.items_set_r (items, value); }
	table_select_cells = {
		title: "Cells",
		style: "width: 120px;",
		inputs: [
			new InputProps("tselcv", "initial value"	, INPUT_TYPES.u32, 0, this.oninput_select_c_v),
			new InputProps("tselcw", "width"			, INPUT_TYPES.dim, 1, this.oninput_select_c_w),
			new InputProps("tselch", "height"			, INPUT_TYPES.dim, 1, this.oninput_select_c_h),
			new InputProps("tselcr", "rotation (deg)"	, INPUT_TYPES.f32, 0, this.oninput_select_c_r),
		]
	};
	table_select_blocks = {
		title: "Blocks",
		style: "width: 120px;",
		inputs: [
			new InputProps("tselbw", "width"			, INPUT_TYPES.dim, 1, this.oninput_select_b_w),
			new InputProps("tselbh", "height"			, INPUT_TYPES.dim, 1, this.oninput_select_b_h),
			new InputProps("tselbr", "rotation (deg)"	, INPUT_TYPES.f32, 0, this.oninput_select_b_r),
		]
	};

	on_selection_update() {
		{
			const props = this.table_select_cells.inputs;
			const selected = this.get_selected_cells();
			const enabled = selected.length > 0;
			for(let x=0;x<props.length;x++) this.setElementEnabled(props[x].id, enabled);
			if(selected.length > 0) {
				const first_item = selected[0]
				const initial = [
					first_item.value,
					first_item.dimensions.w,
					first_item.dimensions.h,
					first_item.dimensions.r * 360,
				];
				for(let x=0;x<props.length;x++) this.setElementValue(props[x].id, initial[x]);
			}
		}
		{
			const props = this.table_select_blocks.inputs;
			const selected = this.get_selected_blocks();
			const enabled = selected.length > 0;
			for(let x=0;x<props.length;x++) this.setElementEnabled(props[x].id, enabled);
			if(selected.length > 0) {
				const first_item = selected[0]
				const initial = [
					first_item.dimensions.w,
					first_item.dimensions.h,
					first_item.dimensions.r * 360,
				];
				for(let x=0;x<props.length;x++) this.setElementValue(props[x].id, initial[x]);
			}
		}
	}

	// ============================================================
	// Values
	// ------------------------------------------------------------

	setval_value_lmb = 0xffffffff;
	setval_value_rmb = 0x00000000;

	update_mode_setval() {
		if(this.isCanvasHovered && this.buttonDownL) this.setval_hovered(this.setval_value_lmb);
		if(this.isCanvasHovered && this.buttonDownR) this.setval_hovered(this.setval_value_rmb);
	}
	setval_hovered(val) {
		for(const item of this.collectionHovered.cells) {
			gameServer.simulation_set_cell_value(ComponentId.THIS_BLOCK, item.id, val);
			if(item.type === CELL_PROPERTIES.CONSTANT.type) item.value = val;
		}
	}

	oninput_setval_lmb(value) { this.setval_value_lmb = value; }
	oninput_setval_rmb(value) { this.setval_value_rmb = value; }

	info_setval = [
		"- Set the output value of cells by hovering over them while the left or right mouse-button is down.",
	].join("\n");

	table_setval = {
		title: "Set cell values",
		style: "width: 120px;",
		inputs: [
			new InputProps("tsetvl", "value (LMB)", INPUT_TYPES.u32, "0xFFFFFFFF", this.oninput_setval_lmb),
			new InputProps("tsetvr", "value (RMB)", INPUT_TYPES.u32, "0x00000000", this.oninput_setval_rmb),
		]
	};

	// ============================================================
	// Cells
	// ------------------------------------------------------------

	onclick_cell_type(event, cellType) {
		// update mode and preview.
		if(cellType) this.place_preview_cell = new Cell(cellType, 0x0);
		if(this.place_preview_cell) this.setCurrentMode(this.MODES.PLACE_CELLS);
		else this.setCurrentMode(null);
		// set which button is in toggled state.
		const key = "panel_cell_btn_toggled";
		let elem = this.getElement(key);
		elem?.setAttribute("toggled", false);
		elem = event.target;
		elem?.setAttribute("toggled", true);
		this.setElement(key, elem);
	}

	oninput_cell_w(value) { this.place_dim_cell[0] = value; }
	oninput_cell_h(value) { this.place_dim_cell[1] = value; }
	oninput_cell_r(value) { this.place_dim_cell[2] = value / 360; }

	info_place_cells = [
		"- To place cells, click one of the cell types (ex. XOR), then clicking on canvas.",
	].join("\n");

	table_place_cells = {
		title: "Cell properties",
		style: "width: 120px;",
		inputs: [
			new InputProps("tpcw", "width"			, INPUT_TYPES.dim, "1", this.oninput_cell_w),
			new InputProps("tpch", "height"			, INPUT_TYPES.dim, "1", this.oninput_cell_h),
			new InputProps("tpcr", "rotation (deg)"	, INPUT_TYPES.f32, "0", this.oninput_cell_r),
		]
	};

	// ============================================================
	// Link
	// ------------------------------------------------------------

	wire_buttonStep			= 0;
	wire_cell_targets		= [];// Array<[point, bid, cid, tgt]>
	wire_cell_target_nearest= null;
	wire_target1			= null;
	wire_target2			= null;
	wire_colour_r = 255;
	wire_colour_g = 255;
	wire_colour_b = 200;

	get_wire_colour() {
		return	(this.wire_colour_r << 24) |
				(this.wire_colour_g << 16) |
				(this.wire_colour_b <<  8) | 255;
	}

	update_mode_place_links() {
		// highlight nearest link-point.
		const blocklib = main.blockLibrary;
		const targets = blocklib.get_all_cell_targets();
		this.wire_cell_targets = targets;
		const first_target = (this.wire_buttonStep > 0) ? this.wire_target1[3] : Cell.LINK_TARGET.NONE;
		this.wire_cell_target_nearest = blocklib.get_nearst_cell_target(targets, this.cursor_pos, first_target);
		// bind nearest cell link-point.
		if(this.wire_buttonStep === 0 && this.dragBegan) {
			this.wire_target1 = this.wire_cell_target_nearest;
			const success = this.wire_target1 !== null;
			if(success) this.wire_buttonStep = 1;
		}
		// bind nearest cell link-point if compatible with the first.
		if(this.wire_buttonStep === 1 && this.dragBegan) {
			this.wire_target2 = this.wire_cell_target_nearest;
			const tgt1 = this.wire_target1[3];
			const tgt2 = this.wire_target2[3];
			const OUTPUT = Cell.LINK_TARGET.OUTPUT;
			const success = (tgt1 != tgt2) & ((tgt1 == OUTPUT) | (tgt2 == OUTPUT));
			if(success) this.wire_buttonStep = 2;
		}
		// add new link, or replace an already existing one if it has same input.
		if(this.wire_buttonStep === 2) {
			const OUTPUT = Cell.LINK_TARGET.OUTPUT;
			const target1 = this.wire_target1;
			const target2 = this.wire_target2;
			let targetSrc = (target1[3] === OUTPUT) ? target1 : target2;
			let targetDst = (target1[3] !== OUTPUT) ? target1 : target2;
			const [point_src, bid_src, cid_src, tgt_src] = targetSrc;
			const [point_dst, bid_dst, cid_dst, tgt_dst] = targetDst;
			const clr = this.get_wire_colour();
			const item = new Link(bid_src, bid_dst, cid_src, cid_dst, tgt_dst, clr);
			this.add_link(item);
			console.log("NEW LINK", item);
			const success = true;
			if(success) this.wire_buttonStep = 0;
		}
		// erase any hovered wires.
		if(this.buttonDownR) {
			this.wire_buttonStep = 0;
			this.deleteHoveredLinks();
		}
	}

	isLinkHovered(link) {
		const points = main.gameRenderer.renderBlock.l_points.get(link.id);
		const pointC = new Vector2D(this.cursor_pos.slice(0,2));
		const pointA = new Vector2D(points.slice(0,2));
		const pointB = new Vector2D(points.slice(3,5));
		const nearest = VectorUtil.nearestPoint_point_line_segment_2d(pointC, pointA, pointB);
		const nearest3d = new Vector3D([nearest[0], nearest[1], 0.0]);
		const distance = nearest3d.add(this.cursor_pos, -1.0).hypot();
		return distance <= this.cursor_radius;
	}
	deleteHoveredLinks() {
		const block = main.blockLibrary.rootBlock;
		const del = new Set();
		for(const item of block.links) if(this.isLinkHovered(item)) del.add(item);
		for(const item of del.keys()) this.rem_link(item);
	}

	get_link_draw_points() {
		if(this.currentMode !== this.MODES.PLACE_LINKS) return [];
		if(!this.wire_cell_target_nearest) return [];
		const points = [];
		const [point0, bid, cid, tgt] = this.wire_cell_target_nearest;
		points.push(this.wire_cell_target_nearest[0]);
		if(this.wire_buttonStep >= 1) points.push(this.wire_target1[0]);
		if(this.wire_buttonStep >= 2) points.push(this.wire_target2[0]);
		return points;
	}

	oninput_link_colour_r(value) { this.wire_colour_r = value; }
	oninput_link_colour_g(value) { this.wire_colour_g = value; }
	oninput_link_colour_b(value) { this.wire_colour_b = value; }

	info_place_links = [
		"- To place links, click near desired input/output of first cell,",
		"then click again near desired output/input of second cell.",
	].join("\n");

	table_place_links = {
		title: "Link properties",
		style: "width: 120px;",
		inputs: [
			new InputProps("tplr", "red"	, INPUT_TYPES.u8, this.wire_colour_r, this.oninput_link_colour_r),
			new InputProps("tplg", "green"	, INPUT_TYPES.u8, this.wire_colour_g, this.oninput_link_colour_g),
			new InputProps("tplb", "blue"	, INPUT_TYPES.u8, this.wire_colour_b, this.oninput_link_colour_b),
		]
	};

	// ============================================================
	// Texts
	// ------------------------------------------------------------

	// TODO: implement.

	// TODO: add EditInputs for placement settings.
	// ^ x-align, y-align, fg-colour, bg-colour, outline-colour, font-size.

	// ============================================================
	// Blocks
	// ------------------------------------------------------------

	onclick_block_type(event, tid) {
		// update mode and preview.
		if(tid) {
			const dim = new ComponentDimensions(0,0,1,1,0);
			this.place_preview_block = new Block(dim, tid);
		}
		else tid = this.place_preview_block?.templateId;
		const safe = tid && !main.blockLibrary.containsRootTemplate(tid);
		if(this.place_preview_block && safe) this.setCurrentMode(this.MODES.PLACE_BLOCKS);
		else this.setCurrentMode(null);
		// set which button is in toggled state.
		const key = "panel_block_btn_toggled";
		let elem = this.getElement(key);
		elem?.setAttribute("toggled", false);
		elem = event.target;
		elem?.setAttribute("toggled", true);
		this.setElement(key, elem);
	}

	onclick_block_edit(event, templateId) {
		main.set_root_block_template(templateId);
	}
	onclick_block_place(event, templateId) {
		this.onclick_block_type(event, templateId);
		// update place-W and place-H inputs.
		const inputs = this.table_place_blocks.inputs;
		const template = main.blockLibrary.templates.get(templateId);
		this.setElementValue(inputs[0].id, template.placeW);
		this.setElementValue(inputs[1].id, template.placeH);
		this.oninput_block_w(template.placeW);
		this.oninput_block_h(template.placeH);
	}
	onclick_block_remove(event, templateId) {
		main.blockLibrary.deleteBlockTemplate(templateId);
	}

	info_place_blocks = [
		"- To place blocks, click the block's name in the list of available block-templates.",
		"- To edit a block, click the 'Edit' button beside the desired block's name.",
		"- To remove a block-template, click the 'X' button beside the desired block's name.",
	].join("\n");

	oninput_block_w(value) { this.place_dim_block[0] = value; }
	oninput_block_h(value) { this.place_dim_block[1] = value; }
	oninput_block_r(value) { this.place_dim_block[2] = value / 360; }
	table_place_blocks = {
		title: "Block properties",
		style: "width: 120px;",
		inputs: [
			new InputProps("tpbw", "width"			, INPUT_TYPES.dim, "1", this.oninput_block_w),
			new InputProps("tpbh", "height"			, INPUT_TYPES.dim, "1", this.oninput_block_h),
			new InputProps("tpbr", "rotation (deg)"	, INPUT_TYPES.f32, "0", this.oninput_block_r),
		]
	};

	/* update callback, set by the list element when if loads. */
	update_template_list_callback = null;
	update_template_list() {
		const blocklib = main.blockLibrary;
		// check if root block has not been assigned yet (happens during init).
		if(!blocklib.rootBlock) return;
		// generate template info list.
		const list = [];
		for(const [tid, template] of blocklib.templates.entries()) {
			const rootId = blocklib.rootBlock.templateId;
			const isEditing	= rootId === tid;
			const canPlace	= !blocklib.containsRootTemplate(tid);
			const canRemove	= blocklib.canDeleteBlockTemplate(tid);
			const info = { templateId:tid, name:template.name, isEditing, canPlace, canRemove };
			list.push(info);
		}
		PromiseUtil.tryUntilTruthy(() => this.update_template_list_callback, [], 100, 20)
			.then((func) => func(list))
			.catch(() => console.error("failed to call update_template_list_callback"));
	}

	/*
		Generate tooltip with generated html containing info about template usage.
	*/
	onmouseenter_block_place(event, templateId) {}// TODO
	onmouseleave_block_place(event, templateId) { this.hide_tooltip(); }
	onmouseenter_block_remove(event, templateId) {}// TODO
	onmouseleave_block_remove(event, templateId) { this.hide_tooltip(); }

	on_major_blocklib_change() {
		this.clearCollections();
		this.update_template_list();
		if(this.rootbt_panel) this.refresh_rootbt_inputs();
	}
	on_minor_blocklib_change() {
		this.update_template_list();
		if(this.rootbt_panel) this.refresh_rootbt_inputs();
	}


};
