import * as helpers from "./helpers";

/*
	This is a basic test for ensuring items can be placed in root block.
*/
describe("Placement (basic)", { testIsolation: false }, () => {
	it("loads page", () => {
		helpers.load_page();
	});

	it("places cells", () => {
		helpers.get_panel_button_cells().click();
		helpers.place_cell("OR"		, 3, 0);
		helpers.place_cell("NOT"	, 6, 1);
		helpers.place_cell("AND"	, 6, -1);
	});

	it("places links", () => {
		//TODO
	});
});
