import { ItemCollection } from "./ItemCollection"
import { Cell } from "../content/Cell";
import { InputProps, INPUT_TYPES } from "../../components/Input";
import { gameData } from "../Main.js";

export class GameUI {
	// ============================================================
	// Interface modes.
	// ------------------------------------------------------------

	currentMode = null;
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
	setCurrentMode(mode) {
		console.log("GameUI.setCurrentMode(mode)", mode);
		this.currentMode = mode;
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
	// Helpers
	// ------------------------------------------------------------

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
	// Canvas
	// ------------------------------------------------------------

	// ============================================================
	// Selection
	// ------------------------------------------------------------

	collectionSelected		= new ItemCollection();
	collectionHovered		= new ItemCollection();
	collectionTranslating	= new ItemCollection();

	clearCollections() {
		this.collectionSelected.clear();
		this.collectionHovered.clear();
		this.collectionTranslating.clear();
	}

	changedContent() { CachedValue_Content.onChange(); }
	changedRendering() { CachedValue_Rendering.onChange(); }

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

	info_select = [
		"- Select items by clicking them, or by dragging to select all items in drag-area.",
		"- Delete selected items by pressing 'DELETE' key.",
		"- Move selected items by hovering over any selected item, then clicking and dragging cursor.",
	].join("\n");

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

	// TODO: test
	timeout = setTimeout(() => this.on_selection_update(), 2000);

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

	place_dim_cell		= [1,1,0];// [w,h,r]
	place_preview_cell	= null;

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

	wire_colour_r = 255;
	wire_colour_g = 255;
	wire_colour_b = 200;

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

	place_dim_block		= [1,1,0];// [w,h,r]
	place_preview_block	= null;

	onclick_block_type(event, tid) {
		// update mode and preview.
		if(tid) {
			const dim = new ComponentDimensions(0,0,1,1,0);
			this.place_preview_block = new Block(dim, tid);
		}
		else tid = this.place_preview_block?.templateId;
		const safe = tid && !gameData.blockTemplates.get(tid).containsRootBlockTemplate();
		if(this.place_preview_block && safe) this.setCurrentMode(this.MODES.PLACE_BLOCK);
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
		gameData.setRootBlockTemplate(templateId);
	}
	onclick_block_place(event, templateId) {
		this.onclick_block_type(event, templateId);
		const template = gameData.blockTemplates.get(templateId);
		this.block_inputs.setValue(0, template.placeW, true);
		this.block_inputs.setValue(1, template.placeH, true);
	}
	onclick_block_remove(event, templateId) {
		gameData.deleteBlockTemplate(templateId);
	}

	oninput_block_w(value) { this.place_dim_block[0] = value; }
	oninput_block_h(value) { this.place_dim_block[1] = value; }
	oninput_block_r(value) { this.place_dim_block[2] = value / 360; }

	info_place_blocks = [
		"- To place blocks, click the block's name in the list of available block-templates.",
		"- To edit a block, click the 'Edit' button beside the desired block's name.",
		"- To remove a block-template, click the 'X' button beside the desired block's name.",
	].join("\n");

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
		const list = [];
		for(const [tid, template] of gameData.blockTemplates.entries()) {
			const rootId = gameData.rootBlock.templateId;
			const isEditing	= rootId === tid;
			const canPlace	= !template.containsTemplate(rootId);
			const canRemove	= gameData.canDeleteBlockTemplate(tid);
			const info = { templateId:tid, isEditing, canPlace, canRemove };
			list.push(info);
		}
		this.update_template_list_callback(list);
	}

	/*
		Generate tooltip with generated html containing info about template usage.
	*/
	onmouseenter_block_place(event, templateId) {}// TODO
	onmouseleave_block_place(event, templateId) { this.hide_tooltip(); }
	onmouseenter_block_remove(event, templateId) {}// TODO
	onmouseleave_block_remove(event, templateId) { this.hide_tooltip(); }

	on_major_blocklib_change() {
		this.setCurrentMode(null);
		this.clearCollections();
		if(this.block_buttons_grid) this.update_template_list();
		if(this.rootbt_panel) this.refresh_rootbt_inputs();
	}
	on_minor_blocklib_change() {
		if(this.block_buttons_grid) this.update_template_list();
		if(this.rootbt_panel) this.refresh_rootbt_inputs();
	}


};
