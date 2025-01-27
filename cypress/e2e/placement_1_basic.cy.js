import {
	load_page,
	place_cell,
	place_link,
	place_block,
	LINK_BIASES,
} from "./helpers";

/*
	This is a basic test for ensuring items can be placed in root block.
*/
describe("Placement (basic)", { testIsolation: false }, () => {
	it("loads page", () => { load_page(); });

	// TODO - check undo-stack for each newly added item to make sure its properties are correct.
	// ^ add the verification step to the placer-funcitons.

	it("places cells", () => {
		place_cell(3, 0, "NOT");
		place_cell(6, 1, "OR");
		place_cell(6,-1, "AND");
		cy.wait(1000);
	});

	it("places blocks", () => {
		place_block(0, 0, "Frame Counter");
		cy.wait(1000);
	});

	it("places links", () => {
		place_link(3, 0, LINK_BIASES.OUTPUT);
		place_link(6, +1, LINK_BIASES.INPUT_A);

		place_link(3, 0, LINK_BIASES.OUTPUT);
		place_link(6, -1, LINK_BIASES.INPUT_B);

		place_link(0.5, 0, LINK_BIASES.OUTPUT);
		place_link(3,  0, LINK_BIASES.INPUT_A);
		cy.wait(1000);
	});

});
