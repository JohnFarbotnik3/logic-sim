import { gameControls } from "../Main";
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
	// Canvas
	// ------------------------------------------------------------
	//TODO


	// ============================================================
	// Selection
	// ------------------------------------------------------------
	//TODO

	oninput_select_c_v(value) {
		console.log(value);
	}

	table_select_cells = {
		title: "Cells",
		enabled: true,
		style: "width: 120px;",
		inputs: [
			new InputProps("initial value"	, INPUT_TYPES.u32, 0, this.oninput_select_c_v),
			new InputProps("cell width"		, INPUT_TYPES.f32, 1, this.oninput_select_c_w),
			new InputProps("cell height"	, INPUT_TYPES.f32, 1, this.oninput_select_c_h),
			new InputProps("rotation (deg)"	, INPUT_TYPES.f32, 0, this.oninput_select_c_r),
		]
	};

	table_select_blocks = {
		title: "Blocks",
		enabled: false,
		style: "width: 120px;",
		inputs: [
			new InputProps("initial value"	, INPUT_TYPES.u32, 0, this.oninput_select_c_v),
			new InputProps("cell width"		, INPUT_TYPES.f32, 1, this.oninput_select_c_w),
			new InputProps("cell height"	, INPUT_TYPES.f32, 1, this.oninput_select_c_h),
			new InputProps("rotation (deg)"	, INPUT_TYPES.f32, 0, this.oninput_select_c_r),
		]
	};


};
