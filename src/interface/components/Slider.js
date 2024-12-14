
class Slider extends UIElement {
	constructor(props) {
		const { min, max, step, value, oninput, getText, style_input, style_label } = props;
		const customProps = { min, max, step, value, oninput, getText, style_input, style_label };
		super("div", props, customProps);
		this.element.min = min;
		this.element.max = max;
		this.element.step = step;
		this.element.value = value;
		this.oninput = oninput;
		this.getText = getText;
		const { id } = props;
		const input = this.input = ElementParser.parse({
			id:`id_input`, tag:"input", type:"range", min, max, step, value, style:style_input??"",
			oninput:(event) => { Slider._oninput(this, event); }
		});
		const label = this.label = ElementParser.parse({ id:`id_label`, tag:"div", style:style_label??"" });
		label.innerText = this.getText();
		this.appendChild(input);
		this.appendChild(label);
	}
	static _oninput(_this, event) { _this._oninput(event); }
	_oninput(event) {
		this.oninput(event);
		this.label.innerText = this.getText();
	}
};

