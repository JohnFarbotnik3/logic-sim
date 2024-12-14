
class Tooltip extends UIElement {
	constructor(props) {
		const customProps = {};
		super("div", props, customProps);
		this.element.classList.add("Tooltip");
	}
	show(element, content, style) {
		// replace previous content with new content.
		// supports strings and elements.
		for(const child of this.element.children) child.remove(); 
		if(content) this.element.append(content);
		// set position of tooltip based on hovered element.
		const rect = element.getBoundingClientRect();
		const { x, y, width, height, top, right, bottom, left } = rect;
		this.style.position = "absolute";
		this.style.left = `${left + width}px`;
		this.style.top = `${top}px`;
		this.style.visibility = "";
		if(style) this.style = this.style + style;
		// get self bounding rect and correct position if out-of-bounds.
		const selfrect = this.element.getBoundingClientRect();
		const toofar = selfrect.bottom - window.innerHeight;
		if(toofar > 0) this.style.top = `${top - toofar - 5}px`;
	}
	hide() {
		this.style.visibility = "hidden";
	}
};

