
class InputValue extends UIElement {
	constructor(props) {
		const { oninput, innerText, value } = props;
		const customProps = { oninput, innerText };
		super("div", props, customProps);
		this.classList.add("InputValue");
		// label.
		const { id } = props;
		const label = new Div  ({ parent: this.element, id: `${id}_label`, innerText });
		label.classList.add("Label");
		// input.
		const input = new Input({ parent: this.element, id: `${id}_input`, oninput, value });
	}
};

