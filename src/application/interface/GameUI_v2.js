import { ItemCollection } from "./ItemCollection"
import { InputProps, INPUT_TYPES } from "../../components/Input";

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
	// Canvas
	// ------------------------------------------------------------
	//TODO


	// ============================================================
	// Selection
	// ------------------------------------------------------------

	collectionSelected		= new ItemCollection();
	collectionHovered		= new ItemCollection();
	collectionTranslating	= new ItemCollection();

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
			new InputProps(this, "tselcv", "initial value"	, INPUT_TYPES.u32, 0, this.oninput_select_c_v),
			new InputProps(this, "tselcw", "cell width"		, INPUT_TYPES.f32, 1, this.oninput_select_c_w),
			new InputProps(this, "tselch", "cell height"	, INPUT_TYPES.f32, 1, this.oninput_select_c_h),
			new InputProps(this, "tselcr", "rotation (deg)"	, INPUT_TYPES.f32, 0, this.oninput_select_c_r),
		]
	};

	table_select_blocks = {
		title: "Blocks",
		style: "width: 120px;",
		inputs: [
			new InputProps(this, "tselbw", "cell width"		, INPUT_TYPES.f32, 1, this.oninput_select_b_w),
			new InputProps(this, "tselbh", "cell height"	, INPUT_TYPES.f32, 1, this.oninput_select_b_h),
			new InputProps(this, "tselbr", "rotation (deg)"	, INPUT_TYPES.f32, 0, this.oninput_select_b_r),
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
			new InputProps(this, "tsetvl", "value (LMB)", INPUT_TYPES.u32, "0xFFFFFFFF", this.oninput_setval_lmb),
			new InputProps(this, "tsetvr", "value (RMB)", INPUT_TYPES.u32, "0x00000000", this.oninput_setval_rmb),

		]
	};


};
