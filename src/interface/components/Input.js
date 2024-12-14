
class Input extends UIElement {
	constructor(props) {
		const {} = props;
		const customProps = {};
		super("input", props, customProps);
		this.element.type = "text";
		this.classList.add("Input");
	}
};

