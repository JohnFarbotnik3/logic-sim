
class UIElement {
	constructor(tag, props, customProps) {
		// remove element if element with id already exists.
		if(props.id) document.getElementById(props.id)?.remove();
		// create element with given tag.
		const element = this.element = document.createElement(tag);
		// apply custom property behaviour.
		let propName;
		propName = "parent";		if(props[propName]) { this.parentElement = props[propName]; delete props[propName]; }
		propName = "parentElement";	if(props[propName]) { this.parentElement = props[propName]; delete props[propName]; }
		propName = "classList";		if(props[propName]) { this.classList = props[propName]; delete props[propName]; }
		propName = "children";		if(props[propName]) { this.children  = props[propName]; delete props[propName]; }
		// copy properties to element.
		for(const [k,v] of Object.entries(props)) if(!customProps[k]) element[k] = v;
	}
	// getters and setters.
	get value(     ) { return this.element.value; }
	set value(value) { return this.element.value = value; }
	get style(     ) { return this.element.style; }
	set style(value) { return this.element.style = value; }
	get title(     ) { return this.element.title; }
	set title(value) { return this.element.title = value; }
	get parent(     ) { return this.element.parentElement; }
	set parent(value) { return value.appendChild(this.element); }
	get parentElement(     ) { return this.element.parentElement; }
	set parentElement(value) { return value.appendChild(this.element); }
	get children(     ) { return this.element.children; }
	set children(value) {
		for(const child of this.children) child.remove();
		for(const child of value) this.element.appendChild(child.element);
	}
	get classList(     ) { return this.element.classList; }
	set classList(value) {
		const classList = this.element.classList;
		for(const className of classList.keys()) classList.remove(className); 
		for(const className of value) classList.add(className);
	}
	get onclick(     ) { return this.element.onclick; }
	set onclick(value) { return this.element.onclick = value; }
	get innerText(     ) { return this.element.innerText; }
	set innerText(value) { return this.element.innerText = value; }
	get innerHTML(     ) { return this.element.innerHTML; }
	set innerHTML(value) { return this.element.innerHTML = value; }
	// method overrides.
	appendChild(elem) { this.element.appendChild(elem); }
	appendParent(elem) { elem.appendChild(this.element); }
	remove() { this.element.remove(); }
	click() { this.element.click(); }
	focus() { this.element.focus(); }
	blur() { this.element.blur(); }
	
};


