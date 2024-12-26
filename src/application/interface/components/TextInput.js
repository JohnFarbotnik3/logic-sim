
class TextInput extends UIElement {
	constructor(props) {
		const { type } = props;
		const customProps = { type };
		super("input", props, customProps);
		this.element.classList.add("TextInput");
		this.element.classList.add("outline");
		this.element.type = type;
	}
};

