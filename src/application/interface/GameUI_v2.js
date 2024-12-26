import { gameControls } from "../Main"

export class GameUI {

	// Interface modes.
	currentMode = null;
	MODES = {
		// content editing modes.
		SELECT:				"Select",
		SET_VALUES:			"Cell values",
		PLACE_CELLS:		"Place cells",
		PLACE_LINKS:		"Place links",
		PLACE_BLOCKS:		"Place blocks",
		// other panel modes.
		EDIT_ROOT_BLOCK:	"Root Block",
		FILE:				"File",
	};
	setCurrentMode(mode) {
		console.log("GameUI.setCurrentMode(mode)", mode);
		this.currentMode = mode;
	}

};
