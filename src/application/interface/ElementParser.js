
class ElementParser {
	static parse(obj) {
		const { tag, children } = obj;
		const customProps = { tag, children };
		const elem = document.createElement(tag);
		for(const [key, value] of Object.entries(obj)) {
			if(!customProps.hasOwnProperty(key)) elem[key] = value;
		}
		if(children) {
			for(const child of children) elem.appendChild(this.parse(child));
		}
		return elem;
	}
};

