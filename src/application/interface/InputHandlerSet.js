
export class InputHandlerSet {
	constructor() {
		this.handlers = new Map();// Map<type, Map<name, func(event)>>
		this.keydown_curr	= new Map();
		this.keydown_prev	= new Map();
		this.keydown_delta	= new Map();
		this.keydown_event	= null;
		this.button_curr	= new Map();
		this.button_prev	= new Map();
		this.button_delta	= new Map();
		this.button_event	= null;
		this.cursor_curr	= [0.0, 0.0];
		this.cursor_prev	= [0.0, 0.0];
		this.cursor_delta	= [0.0, 0.0];
		this.cursor_event	= null;
		this.wheel_curr		= [0.0, 0.0];
		this.wheel_prev		= [0.0, 0.0];
		this.wheel_delta	= [0.0, 0.0];
		this.wheel_event	= null;
		this.dragbeg_pos	= [0.0, 0.0];
		this.dragend_pos	= [0.0, 0.0];
		this.dragbeg_event	= null;
		this.dragend_event	= null;
		this.dragbeg_event_prev		= null;
		this.dragend_event_prev		= null;
		this.dragbeg_event_delta	= 0;
		this.dragend_event_delta	= 0;
		this.addInputHandler("mousemove", "default", (ev) => this.defaultHandler_mousemove	.call(this, ev) );
		this.addInputHandler("mousedown", "default", (ev) => this.defaultHandler_mousedown	.call(this, ev) );
		this.addInputHandler("mouseup"	, "default", (ev) => this.defaultHandler_mouseup	.call(this, ev) );
		this.addInputHandler("wheel"	, "default", (ev) => this.defaultHandler_wheel		.call(this, ev) );
		this.addInputHandler("keydown"	, "default", (ev) => this.defaultHandler_keydown	.call(this, ev) );
		this.addInputHandler("keyup"	, "default", (ev) => this.defaultHandler_keyup		.call(this, ev) );
	}

	updateInputDeltas() {
		for(const key of this.keydown_curr.keys()) {
			const curr = this.keydown_curr.get(key) ? 1 : 0;
			const prev = this.keydown_prev.get(key) ? 1 : 0;
			const delta = curr - prev;
			this.keydown_delta.set(key, delta);
			this.keydown_prev.set(key, curr);
		}
		for(const key of this.button_curr.keys()) {
			const curr = this.button_curr.get(key) ? 1 : 0;
			const prev = this.button_prev.get(key) ? 1 : 0;
			const delta = curr - prev;
			this.button_delta.set(key, delta);
			this.button_prev.set(key, curr);
		}
		for(let i=0;i<this.cursor_curr.length;i++) {
			this.cursor_delta[i] = this.cursor_curr[i] - this.cursor_prev[i];
			this.cursor_prev [i] = this.cursor_curr[i];
		}
		for(let i=0;i<this.wheel_curr.length;i++) {
			this.wheel_delta[i] = this.wheel_curr[i] - this.wheel_prev[i];
			this.wheel_prev [i] = this.wheel_curr[i];
		}
		this.dragbeg_event_delta = ((this.dragbeg_event & !this.dragbeg_event_prev) ? 1 : 0) - ((!this.dragbeg_event & this.dragbeg_event_prev) ? 1 : 0);
		this.dragend_event_delta = ((this.dragend_event & !this.dragend_event_prev) ? 1 : 0) - ((!this.dragend_event & this.dragend_event_prev) ? 1 : 0);
		this.dragbeg_event_prev = this.dragbeg_event;
		this.dragend_event_prev = this.dragend_event;
	}

	clearInputEvents() {
		this.keydown_event	= null;
		this.button_event	= null;
		this.cursor_event	= null;
		this.wheel_event	= null;
		this.dragbeg_event	= null;
		this.dragend_event	= null;
	}

	// get map value (case insensitive)
	getKeydown(key) {
		const map = this.keydown_curr;
		return map.get(key) || map.get(key.toLowerCase()) || map.get(key.toUpperCase());
	}
	getKeydownDelta(key) {
		const map = this.keydown_delta;
		return map.get(key) || map.get(key.toLowerCase()) || map.get(key.toUpperCase());
	}

	addInputHandler(type, name, func) {
		// TODO: simplify this by making handlers a single-level map.
		//console.debug("addInputHandler(type, name, func)", type, name, func)
		if(!this.handlers.has(type)) this.handlers.set(type, new Map());
		const map = this.handlers.get(type);
		if(map.has(name)) this.removeInputHandler(type, name);
		window.addEventListener(type, func);
		map.set(name, func);
		return true;
	}

	removeInputHandler(type, name) {
		// TODO: simplify this by making handlers a single-level map.
		const map = this.handlers.get(type);
		if(!map) return false;
		const func = map.get(name);
		if(!func) return false;
		window.removeEventListener(type, func);
		map.delete(name);
		return true;
	}

	defaultHandler_mousemove	(event) {
		const { clientX, clientY } = event;
		this.cursor_curr[0] = clientX;
		this.cursor_curr[1] = clientY;
	}
	defaultHandler_mousedown	(event) {
		//console.debug("defaultHandler_mousedown", event);
		const { button } = event;
		this.button_event = event;
		this.button_curr.set(button, true);
		this.dragbeg_pos[0] = this.cursor_curr[0];
		this.dragbeg_pos[1] = this.cursor_curr[1];
		this.dragbeg_event = event;
	}
	defaultHandler_mouseup		(event) {
		//console.debug("defaultHandler_mouseup", event);
		const { button } = event;
		this.button_event = event;
		this.button_curr.set(button, false);
		if((this.dragbeg_pos[0] !== this.cursor_curr[0]) | (this.dragbeg_pos[1] !== this.cursor_curr[1])) this.dragend_event = event;
		this.dragend_pos[0] = this.cursor_curr[0];
		this.dragend_pos[1] = this.cursor_curr[1];
	}
	defaultHandler_wheel		(event) {
		//console.debug("defaultHandler_wheel", event);
		const { wheelDeltaX, wheelDeltaY } = event;
		this.wheel_event = event;
		this.wheel_curr[0] = -wheelDeltaX;
		this.wheel_curr[1] = -wheelDeltaY;
	}
	defaultHandler_keydown		(event) {
		//console.debug("defaultHandler_keydown", event);
		const { key } = event;
		this.keydown_event = event;
		this.keydown_curr.set(key.toLowerCase(), true);
	}
	defaultHandler_keyup		(event) {
		//console.debug("defaultHandler_keyup", event);
		const { key } = event;
		this.keydown_event = event;
		this.keydown_curr.set(key.toLowerCase(), false);
	}
}
