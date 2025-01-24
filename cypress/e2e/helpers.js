
// general testing API info:
// https://docs.cypress.io/api/table-of-contents

// canvas visibility issues:
// https://github.com/cypress-io/cypress/issues/28289

// test isolation:
// https://docs.cypress.io/app/core-concepts/test-isolation

// content helpers.
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

export function move_to(x, y) {
	main.gameRenderer.camera.move_to(x,y);
}

// element helpers.
export function is_visible(elem) {
	return elem.should('be.visible');
}

// https://docs.cypress.io/api/commands/click
// https://stackoverflow.com/questions/62305001/how-to-click-and-hold-in-cypress
export function click_canvas() {
	// moves cursor to center.
	cy.get("#canvas").click({ position:"center" });
	//const rect = canvas.parentElement.getBoundingClientRect();
	// triggers the event handlers I actually use.
	cy.get("#canvas").trigger('mousedown', { button: 0 });
	cy.wait(100);
	cy.get("#canvas").trigger('mouseup', { button: 0 });
};

// panel openers.
export function open_panel_cells() {
	if(!is_visible(cy.get("#panel_Cells"))) cy.get("#panel_button_Cells").click();
}
export function open_panel_links() {
	if(!is_visible(cy.get("#panel_Links"))) cy.get("#panel_button_Links").click();
}

// cell placement.
export function select_cell_type(typestr) {
	return cy.get("#panel_cells_button_" + typestr).click();
}
export const place_cell = (typestr, x, y) => {
	open_panel_cells();
	select_cell_type(typestr).then(() => { move_to(x, y); click_canvas(); });
};

// link placement.
export function place_link = (p0, p1) {

}












