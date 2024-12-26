
class TextArea extends UIElement {
	constructor(props) {
		const customProps = {};
		super("textarea", props, customProps);
		this.element.classList.add("TextArea");
		this.element.classList.add("outline");
	}
};

