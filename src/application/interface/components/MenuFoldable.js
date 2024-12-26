
class MenuFoldable extends UIElement {
	constructor(props) {
		const				{spanText, isOpen, contentStyle, checkboxStyle} = props;
		const customProps = {spanText, isOpen, contentStyle, checkboxStyle};
		super("div", props, customProps);
		const {id} = props;
		// add extra attributes.
		this._isOpen = false;
		this._stayOpen = false;
		// modify primary menu element.
		this.style = props.style ?? "";
		this.classList = ["menu", "outline"];
		// header which contains span and checkbox.
		this.header = new Div({id: `${id}_header`});
		this.header.style = "height:fit-content; cursor:pointer; padding:5px; display:flex; justify-content:center; position:relative;";
		this.header.onclick = (event) => this.onclickHeader(event, this);
		this.header.classList = ["header", "no_select"];
		this.header.appendParent(this.element);
		// checkbox for indicating menu should stay open (unless user manually closes menu).
		this.checkbox = new Checkbox({id: `${id}_checkbox`});
		this.checkbox.title = "keep this menu open";
		this.checkbox.classList = ["checkbox"];
		this.checkbox.style = "height:18px; width:18px; cursor:pointer; position:absolute; left:5px;" + (checkboxStyle ?? "");
		this.checkbox.onclick = (event) => this.onclickCheckbox(event, this);
		this.checkbox.appendParent(this.header);
		// header span with menu text.
		this.span = new Span({id: `${id}_span`, innerText:spanText});
		this.span.style = "height:fit-content; left:20px; right:0px;";
		this.span.classList = ["span"];
		this.span.appendParent(this.header);
		// area where menu contents goes.
		this.contents = new Div({id: `${id}_contents`});
		this.contents.style = "display:block; padding:5px;" + (contentStyle ?? "");
		this.contents.classList = ["contents", "outline"];
		this.contents.appendParent(this.element);
		// start open or closed.
		if(isOpen) this.open(); else this.close();
	}
	appendChild(elem) {
		this.contents.appendChild(elem);
	}
	get isOpen() { return this._isOpen; }
	open  (force=false) { this._isOpen=true;  this.contents.style.display="block"; }
	close (force=false) { this._isOpen=false; this.contents.style.display="none"; }
	toggle(force=false) {
		if(this.isOpen & (!this._stayOpen | force)) this.close(true); else this.open(true);
	}
	onclickHeader(event, _this) {
		_this.toggle(true);
	}
	onclickCheckbox(event, _this) {
		event.stopPropagation();
		_this._stayOpen = _this.checkbox.checked;
	}
};

