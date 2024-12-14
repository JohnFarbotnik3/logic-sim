
class Checkbox extends UIElement {
	constructor(props) {
		const customProps = {};
		super("input", props, customProps);
		this.element.type = "checkbox";
	}
};

