
class Button extends UIElement {
	constructor(props) {
		const               {toggled, enabled, onclick} = props;
		const customProps = {toggled, enabled, onclick};
		super("button", props, customProps);
		const {id} = props;
		// define properties.
		this._enabled = true;
		this._toggled = false;
		this._onclick = onclick ?? null;
		// run setters.
		this.enabled = enabled ?? true;
		this.toggled = toggled ?? false;
		this.element.onclick = (event) => Button.onclick(this, event);
	}
	get toggled(     ) { return this._toggled; }
	set toggled(value) {
		this._toggled = value;
		if(value)	this.element.classList.   add("toggle_on");
		else		this.element.classList.remove("toggle_on");
	}
	get enabled(     ) { return this._enabled; }
	set enabled(value) {
		const classList = this.element.classList;
		if(value)	classList.remove("disabled");
		else		classList.   add("disabled");
		return this._enabled = value;
	}
	get onclick(     ) { return this._onclick; }
	set onclick(value) { return this._onclick = value; }
	static onclick(_this, event) {
		if(_this.enabled && _this.onclick) _this.onclick(event);
	}
};

