
class Popup extends UIElement {
	constructor(props) {
		const { content, onsubmit, oncancel, cancelText, submitText } = props;
		const customProps = { content, onsubmit, oncancel, cancelText, submitText };
		super("div", props, customProps);
		const { id } = props;
		this.element.classList.add("Popup_outer");
		const inner = new Div({ id:id+"_inner", parent:this, classList:["Popup_inner", "outline"] });
		this.contentElem = new Div({ id:id+"_content", parent:inner, classList:["Popup_content"] });
		this.content = content;
		this.onsubmit = onsubmit;
		this.oncancel = oncancel;
		const footer = new Div({ id:id+"_footer", parent:inner, classList:["Popup_footer"] });
		const btn_cancel = new Button({ id:id+"_btn_cancel", parent:footer, innerText:cancelText??"Cancel", onclick:()=>Popup.onclick_oncancel(this) });
		const btn_submit = new Button({ id:id+"_btn_submit", parent:footer, innerText:submitText??"Submit", onclick:()=>Popup.onclick_onsubmit(this) });
		this.element.onclick = (event) => { if(event.target === this.element) Popup.onclick_oncancel(this); }
	}
	get content(     ) { return this.contentElem.children; }
	set content(value) { return this.contentElem.children = value; }
	static onclick_onsubmit(_this) { _this.onclick_onsubmit(); }
	static onclick_oncancel(_this) { _this.onclick_oncancel(); }
	close() { this.element.remove(); }
	onclick_onsubmit() { if(this.onsubmit) { if(this.onsubmit()) this.close(); } else this.close(); }
	onclick_oncancel() { if(this.oncancel) this.oncancel(); this.close(); }
};

