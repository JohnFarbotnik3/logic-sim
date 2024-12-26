
// TODO: add cursor-locking that can be toggled with "l"(ock) key
// TODO: bundle into class

const input_handlers = new Map();// Map<type, Map<name, func(event)>>
const INPUT_HANDLER_TYPES = {
	"mousemove"	: "mousemove"	,
	"mousedown"	: "mousedown"	,
	"mouseup"	: "mouseup"		,
	"wheel"		: "wheel"		,
	"keydown"	: "keydown"		,
	"keyup"		: "keyup"		,
};

function addInputHandler(type, name, func) {
	console.debug("addInputHandler(type, name, func)", type, name, func)
	if(!input_handlers.has(type)) input_handlers.set(type, new Map());
	const map = input_handlers.get(type);
	if(map.has(name)) removeInputHandler(type, name);
	window.addEventListener(type, func);
	map.set(name, func);
	return true;
}

function removeInputHandler(type, name) {
	const map = input_handlers.has(type);
	if(!map) return false;
	const func = map.get(name);
	if(!func) return false;
	window.removeEventListener(type, func);
	map.delete(name);
	return true;
}

const keydown_curr	= new Map();
const keydown_prev	= new Map();
const keydown_delta	= new Map();
let keydown_event	= null;
const button_curr	= new Map();
const button_prev	= new Map();
const button_delta	= new Map();
let button_event	= null;
let cursor_curr		= [0.0, 0.0];
let cursor_prev		= [0.0, 0.0];
let cursor_delta	= [0.0, 0.0];
let cursor_event	= null;
let wheel_curr		= [0.0, 0.0];
let wheel_prev		= [0.0, 0.0];
let wheel_delta		= [0.0, 0.0];
let wheel_event		= null;
let dragbeg_pos		= [0.0, 0.0];
let dragend_pos		= [0.0, 0.0];
let dragbeg_event	= null;
let dragend_event	= null;
let dragbeg_event_prev	= null;
let dragend_event_prev	= null;
let dragbeg_event_delta	= 0;
let dragend_event_delta	= 0;

function updateInputDeltas() {
	for(const key of keydown_curr.keys()) {
		const curr = keydown_curr.get(key) ? 1 : 0;
		const prev = keydown_prev.get(key) ? 1 : 0;
		const delta = curr - prev;
		keydown_delta.set(key, delta);
		keydown_prev.set(key, curr);
	}
	for(const key of button_curr.keys()) {
		const curr = button_curr.get(key) ? 1 : 0;
		const prev = button_prev.get(key) ? 1 : 0;
		const delta = curr - prev;
		button_delta.set(key, delta);
		button_prev.set(key, curr);
	}
	for(let i=0;i<cursor_curr.length;i++) {
		cursor_delta[i] = cursor_curr[i] - cursor_prev[i];
		cursor_prev[i] = cursor_curr[i];
	}
	for(let i=0;i<wheel_curr.length;i++) {
		wheel_delta[i] = wheel_curr[i] - wheel_prev[i];
		wheel_prev[i] = wheel_curr[i];
	}
	dragbeg_event_delta = ((dragbeg_event & !dragbeg_event_prev) ? 1 : 0) - ((!dragbeg_event & dragbeg_event_prev) ? 1 : 0);
	dragend_event_delta = ((dragend_event & !dragend_event_prev) ? 1 : 0) - ((!dragend_event & dragend_event_prev) ? 1 : 0);
	dragbeg_event_prev = dragbeg_event;
	dragend_event_prev = dragend_event;
}

function clearInputEvents() {
	keydown_event	= null;
	button_event	= null;
	cursor_event	= null;
	wheel_event		= null;
	dragbeg_event	= null;
	dragend_event	= null;
}

function defaultHandler_mousemove	(event) {
	const { clientX, clientY } = event;
	const { x, y, width, height } = GameUI.getCanvas().getClientRects()[0];
	let mx = Math.min(Math.max((clientX - x) / width , 0.0), 1.0);
	let my = Math.min(Math.max((clientY - y) / height, 0.0), 1.0);
	mx = (mx * 2.0 - 1.0) * +1.0 * cameraAspectRatio;
	my = (my * 2.0 - 1.0) * -1.0;
	cursor_curr[0] = mx;
	cursor_curr[1] = my;
}
function defaultHandler_mousedown	(event) {
	//console.debug("defaultHandler_mousedown", event);
	button_event = event;
	const { button } = event;
	button_curr.set(button, true);
	dragbeg_pos[0] = cursor_curr[0];
	dragbeg_pos[1] = cursor_curr[1];
	dragbeg_event = event;
}
function defaultHandler_mouseup		(event) {
	//console.debug("defaultHandler_mouseup", event);
	button_event = event;
	const { button } = event;
	button_curr.set(button, false);
	if((dragbeg_pos[0] !== cursor_curr[0]) | (dragbeg_pos[1] !== cursor_curr[1])) dragend_event = event;
	dragend_pos[0] = cursor_curr[0];
	dragend_pos[1] = cursor_curr[1];
}
function defaultHandler_wheel		(event) {
	//console.debug("defaultHandler_wheel", event);
	wheel_event = event;
	const { wheelDeltaX, wheelDeltaY } = event;
	wheel_curr[0] = -wheelDeltaX;
	wheel_curr[1] = -wheelDeltaY;
}
function defaultHandler_keydown		(event) {
	//console.debug("defaultHandler_keydown", event);
	keydown_event = event;
	const { key } = event;
	keydown_curr.set(key.toLowerCase(), true);
}
function defaultHandler_keyup		(event) {
	//console.debug("defaultHandler_keyup", event);
	keydown_event = event;
	const { key } = event;
	keydown_curr.set(key.toLowerCase(), false);
}

addInputHandler(INPUT_HANDLER_TYPES["mousemove"], "default", defaultHandler_mousemove	);
addInputHandler(INPUT_HANDLER_TYPES["mousedown"], "default", defaultHandler_mousedown	);
addInputHandler(INPUT_HANDLER_TYPES["mouseup"]	, "default", defaultHandler_mouseup		);
addInputHandler(INPUT_HANDLER_TYPES["wheel"]	, "default", defaultHandler_wheel		);
addInputHandler(INPUT_HANDLER_TYPES["keydown"]	, "default", defaultHandler_keydown		);
addInputHandler(INPUT_HANDLER_TYPES["keyup"]	, "default", defaultHandler_keyup		);



