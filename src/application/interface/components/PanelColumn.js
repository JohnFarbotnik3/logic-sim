
class PanelColumn extends UIElement {
	constructor(props) {
		const               {test} = props;
		const customProps = {test};
		super("div", props, customProps);
		const {id} = props;
		this.element.classList.add("PanelColumn");
		this.element.style.visibility = "hidden";
	}
};

