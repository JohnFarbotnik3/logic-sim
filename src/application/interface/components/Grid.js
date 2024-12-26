
class Grid extends UIElement {
	constructor(props) {
		const customProps = {};
		super("div", props, customProps);
		this.element.style.display = "grid";
	}
};

