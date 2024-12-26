
class InputTable extends UIElement {
	constructor(props) {
		const { tablename, params, inputWidth } = props;
		const customProps = { tablename, params, inputWidth };
		super("div", props, customProps);
		this.classList.add("InputTable");
		const { id } = props;
		this._enabled = true;
		this.header = new Div  ({ parent: this.element, id: `${id}_label_${name}2`, innerText:tablename,
			style:"grid-column-start:1; grid-column-end:3; text-align:center; padding:5px;"
		});
		this.labels = [];
		this.inputs = [];
		for(let i=0;i<params.length;i++) {
			const [name, value, oninput] = params[i];
			const label = new Div  ({ parent: this.element, id: `${id}_label_${name}`, innerText:name });
			const input = new Input({ parent: this.element, id: `${id}_input_${name}`, oninput, value });
			label.classList.add("Label");
			this.labels.push(label);
			this.inputs.push(input);
			if(inputWidth) input.style.width = `${inputWidth}px`;
		}
	}
	inputIfEnabled(func) {
		if(this.enabled) func();
	}
	setValue(index, value, update) {
		const elem = this.inputs[index].element;
		elem.value = value;
		if(this.enabled & update) elem.oninput({target: elem});
	}
	get enabled() { return this._enabled; }
	set enabled(value) {
		this._enabled = value;
		for(const input of this.inputs) input.element.disabled = !value;
		for(const input of this.inputs) input.element.style.opacity = value ? 1.0 : 0.3;
		for(const label of this.labels) label.element.style.opacity = value ? 1.0 : 0.5;
		this.header.style.opacity = value ? 1.0 : 0.5;
	}
};

