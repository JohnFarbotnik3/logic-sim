import {
	load_page,
	place_cell,
	place_link,
	place_block,
	LINK_BIASES,
	create_block_template,
	click_drag,
} from "./helpers";

/*
	This is a more advanced tes for ensuring that app remains stable and correct when
	creating + deleting templates, as well as when creating and removing items
	at various levels of nesting.
*/
describe("Placement (advanced)", { testIsolation: false }, () => {
	it("loads page", () => { load_page(); });

	it("creates a new block-template", () => {
		create_block_template(9, 9, "New Parent Block", "New Block Description");
	});

	const d = 3;
	it("places test blocks (and cells)", () => {
		place_block(-d, -d, "Test Block");
		place_block(+d, -d, "Test Block");
		place_block(+d, +d, "Test Block");
		place_block(-d, +d, "Test Block");
		place_cell(0, 0, "NOT");
	});

	it("connects cells across block instances", () => {
		// TODO: create place_link_in_child(), which places link inside nth child block in root block,
		// scaling (x,y) coordinates according to child-block content-transformation.
		place_link(0, 0, LINK_BIASES.OUTPUT);
		place_link(+d, +d, LINK_BIASES.NONE);

		place_link(0, 0, LINK_BIASES.INPUT_A);
		place_link(-d+2.5, -d-2, LINK_BIASES.NONE);

		click_drag([-1.1,0], [5,5]);
		click_drag([4,4], [7,4]);
	});

	/*	TODO:
		- test link replacement when attaching a new link to already bound input (in root block)
		- test link restrictions by biasing towards an already bound child-block cell-input
			(links shouldnt be allowed to target immutable child link points even when nearest)
		- delete a linked cell in child block, this should delete exactly the links which are connected to it
		- delete a linked cell in the frame-counter, and observe appearance from test block and parent block.
	*/

});
