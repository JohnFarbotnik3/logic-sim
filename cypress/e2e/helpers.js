import * as Ids from "../../src/ElementIds.js";
// general testing API info:
// https://docs.cypress.io/api/table-of-contents

// canvas visibility issues:
// https://github.com/cypress-io/cypress/issues/28289

// test isolation:
// https://docs.cypress.io/app/core-concepts/test-isolation

// ============================================================
// cypress helpers.
// ------------------------------------------------------------

export function getById(id) {
	return cy.get("#"+id);
}

// ============================================================
// content helpers.
// ------------------------------------------------------------

export let main = null;
export function load_page() {
	cy.visit("http://localhost:5173/");
	cy.window().its("main").should('exist').then(m => { main = m; });
}
export function get_library() {
	return main.blockLibrary;
}
export function get_root_block() {
	return main.blockLibrary.rootBlock;
}
export function get_root_template() {
	return main.blockLibrary.templates.get(main.blockLibrary.rootBlock.templateId);
}

// ============================================================
// canvas navigation.
// ------------------------------------------------------------

// https://docs.cypress.io/api/commands/click
// https://stackoverflow.com/questions/62305001/how-to-click-and-hold-in-cypress
export function move_to(x, y) {
	getById(Ids.id_canvas).trigger('mousemove', {});
	return cy.wait(100).then(() => main.gameRenderer.camera.move_to(x,y)).then(() => {
		getById(Ids.id_canvas).trigger('mousemove', {});
	});
}
export function center_cursor() {
	getById(Ids.id_canvas).click({ position:"center" });
}
export function canvas_mousedown() {
	getById(Ids.id_canvas).trigger('mousedown', { button: 0 });
}
export function canvas_mouseup() {
	getById(Ids.id_canvas).trigger('mouseup', { button: 0 });
}
export function canvas_click() {
	// move cursor to center.
	center_cursor();
	// trigger the event handlers I actually use.
	canvas_mousedown();
	canvas_mouseup();
};

// ============================================================
// panel openers.
// ------------------------------------------------------------

export function is_visible(elem) {
	return elem.is(':visible');
}
export function open_panel(mode) {
	return getById(Ids.id_panel(mode)).then(elem => {
		if(!is_visible(elem)) getById(Ids.id_panel_btn(mode)).click();
	});
}
export function open_panel_select() { return open_panel("Select"); }
export function open_panel_cells () { return open_panel("Cells" ); }
export function open_panel_links () { return open_panel("Links" ); }
export function open_panel_blocks() { return open_panel("Blocks"); }

// ============================================================
// selection.
// ------------------------------------------------------------

export function click_drag(p0, p1) {
	open_panel_select();
	center_cursor();
	move_to(p0[0], p0[1]);
	canvas_mousedown();
	move_to(p1[0], p1[1]);
	canvas_mouseup();
}

// ============================================================
// cell placement.
// ------------------------------------------------------------

export const place_cell = (x, y, typestr) => {
	open_panel_cells();
	getById(Ids.id_cells_type(typestr)).click();
	move_to(x, y);
	canvas_click();
};

// ============================================================
// link placement.
// ------------------------------------------------------------

export const LINK_BIASES = {
	NONE	: [0, 0],
	OUTPUT	: [+0.1, +0.0],
	INPUT_A	: [-0.1, +0.1],
	INPUT_B	: [-0.1, -0.1],
};
export function move_to_biased(x,y,b) {
	move_to(x+b[0], y+b[1]);
}
export function place_link(x,y,b) {
	open_panel_links();
	move_to_biased(x,y,b);
	canvas_click();
}

// ============================================================
// block placement.
// ------------------------------------------------------------

export function place_block(x, y, name) {
	open_panel_blocks();
	getById(Ids.id_blocks_select(name)).click().trigger('mouseleave', {});;
	move_to(x, y);
	canvas_click();
}

// ============================================================
// block-template creation and modification.
// ------------------------------------------------------------

export function create_block_template(w, h, name, desc) {
	open_panel_blocks();
	getById(Ids.id_blocks_new).click();
	getById(Ids.id_new_template_w).type(w);
	getById(Ids.id_new_template_h).type(h);
	getById(Ids.id_new_template_n).type(name);
	getById(Ids.id_new_template_d).type(desc);
	getById(Ids.id_popup_submit).click();
}










