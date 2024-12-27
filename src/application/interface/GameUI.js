import { gameControls } from "../Main"

// TODO: migrate this to Svelte
export class GameUI {
	static init() {
		this.panelArea = document.querySelector("#canvasWrapper");
		this.sidebar = document.querySelector("#toolPanel");
		// header menus.
		this.init_play_header();
		// sidebar menus.
		this.init_select_panel();
		this.init_setval_panel();
		this.init_cell_panel();
		this.init_link_panel();
		this.init_block_panel();
		this.init_rootbt_panel();
		this.init_file_panel();
		// init listeners
		window.addEventListener("resize", this.windowOnResize);
		window.addEventListener("load", () => {
			this.windowOnResize();
			setTimeout(() => this.windowOnResize(), 0);
		});
		this.windowOnResize();
		this.getCanvasPromise().then(canvas => {
			canvas.addEventListener("mouseenter", this.canvas_onEnter);
			canvas.addEventListener("mouseleave", this.canvas_onLeave);
			canvas.addEventListener("contextmenu", (e) => e.preventDefault());
		});
	}
	
	static hotkey_btn_play		= null;
	static hotkey_btn_select	= null;
	static hotkey_btn_values	= null;
	static hotkey_btn_cells		= null;
	static hotkey_btn_links		= null;
	static hotkey_btn_blocks	= null;
	static update_hotkeys() {
		const active = !this.isInputElementActive;
		if(active & gameControls.getKeydownDelta("p") === +1) GameUI.clickButton(this.hotkey_btn_play);
		if(active & gameControls.getKeydownDelta("x") === +1) GameUI.clickButton(this.hotkey_btn_select);
		if(active & gameControls.getKeydownDelta("v") === +1) GameUI.clickButton(this.hotkey_btn_values);
		if(active & gameControls.getKeydownDelta("c") === +1) GameUI.clickButton(this.hotkey_btn_cells);
		if(active & gameControls.getKeydownDelta("l") === +1) GameUI.clickButton(this.hotkey_btn_links);
		if(active & gameControls.getKeydownDelta("b") === +1) GameUI.clickButton(this.hotkey_btn_blocks);
		if(active) {
			const moveU = gameControls.getKeydown("w") | gameControls.getKeydown("ArrowUp");
			const moveL = gameControls.getKeydown("a") | gameControls.getKeydown("ArrowLeft");
			const moveD = gameControls.getKeydown("s") | gameControls.getKeydown("ArrowDown");
			const moveR = gameControls.getKeydown("d") | gameControls.getKeydown("ArrowRight");
			const moveSpeed = (gameControls.getKeydown("shift") ? 0.5 : 5.0) * cameraFOV;
			if(moveU) cameraMove(0,+moveSpeed,0);
			if(moveD) cameraMove(0,-moveSpeed,0);
			if(moveL) cameraMove(-moveSpeed,0,0);
			if(moveR) cameraMove(+moveSpeed,0,0);
			const zoomSpeed = 0.025;
			if(gameControls.getKeydown("e")) cameraZoom(1 - zoomSpeed);
			if(gameControls.getKeydown("q")) cameraZoom(1 + zoomSpeed);
		}
		if(this.isCanvasHovered) {
			// apply mouse input
			if(wheel_event) cameraZoom(1 + wheel_curr[1]*0.001);
		}
	}
	
	// ============================================================
	// canvas
	// ------------------------------------------------------------
	
	static getCanvas() {
		return document.querySelector("#canvas");
	}
	static getCanvasPromise() {
		return new Promise((resolve, reject) => {
			const itv = setInterval(() => {
				const canvas = document.querySelector("#canvas");
				if(canvas) {
					clearInterval(itv);
					resolve(canvas);
				}
			});
		});
	}
	
	static get isCanvasActive() { return !GameUI.isInputElementActive; }
	
	static isCanvasHovered = true;
	static canvas_onEnter(event) { GameUI.isCanvasHovered = true; }
	static canvas_onLeave(event) { GameUI.isCanvasHovered = false; }
	
	static windowOnResize(event) {
		// fit canvas
		console.log(`windowOnResize()`);
		const canvas = GameUI.getCanvas();
		const cw = canvas.width;
		const ch = canvas.height;
		const rect = canvas.parentElement.getBoundingClientRect();
		const ratio = Math.min(rect.width / cw, rect.height / ch);
		canvas.width  = Math.floor(rect.width);
		canvas.height = Math.floor(rect.height);
		main.updateRestart();
	}
	
	// ============================================================
	// helpers
	// ------------------------------------------------------------
	
	static panelArea;
	static sidebar;
	
	static get isInputElementActive() {
		const elem = document.activeElement;
		const tag = elem.tagName.toLowerCase();
		if(tag == "input" | tag == "textarea") return true;
		return false;
	};
	
	static unfocus(elem) {
		elem.blur();
	}
	
	static clickButton(elem) {
		if(!elem.toggled) {
			elem.focus();
			elem.click();
			elem.blur();
		}
	}
	
	
	static set_toggled_button_in_map(map, key) {
		for(const [key, elem] of map.entries()) elem.toggled = false;
		const elem = map.get(key);
		if(elem) elem.toggled = true;
	}
	
	static set_toggled_button_or_none(map, key, modeFilter) {
		for(const [key, elem] of map.entries()) elem.toggled = false;
		const elem = map.get(key);
		const match = (gameControls.cursor_mode === modeFilter);
		if(elem && match) elem.toggled = true;
	}
	
	static parse_f32(event) {
		const value = Number(event.target.value);
		const valid = !Number.isNaN(value);
		return [value, valid];
	}
	
	static parse_u32(event) {
		const value = Number(event.target.value);
		const valid = !Number.isNaN(value) & (0 < value) & (value <= 0xffffffff);
		return [value, valid];
	}
	
	static parse_str(event) {
		const value = String(event.target.value).trim();
		const valid = value && value.length > 0;
		return [value, valid];
	}
	
	// ============================================================
	// refresh UI elements
	// ------------------------------------------------------------
	
	static current_open_panel = null;
	static set_open_panel(elem) {
		if(elem && elem == this.current_open_panel) {
			elem.style.visibility = "hidden";
			this.current_open_panel = null;
		} else {
			if(this.current_open_panel) this.current_open_panel.style.visibility = "hidden";
			this.current_open_panel = elem;
			if(elem) elem.style.visibility = "visible";
		}
	}
	
	static current_toggled_panel_button = null;
	static set_toggled_panel_button(elem) {
		if(GameUI.current_toggled_panel_button) GameUI.current_toggled_panel_button.toggled = false;
		if(elem) elem.toggled = true;
		GameUI.current_toggled_panel_button = elem;
	}
	
	static current_toggled_mode_button = null;
	static set_toggled_mode_button(elem) {
		if(GameUI.current_toggled_mode_button) GameUI.current_toggled_mode_button.toggled = false;
		if(elem) elem.toggled = true;
		GameUI.current_toggled_panel_button = elem;
	}
	
	// ============================================================
	// Root Template
	// ------------------------------------------------------------
	
	static rootbt_panel = null;
	static rootbt_name = null;
	static rootbt_desc = null;
	static rootbt_inputs = null;
	
	static init_rootbt_panel() {
		// panel and button.
		const menu_panel = this.rootbt_panel = new PanelColumn({ parent:this.panelArea, id:"rootbt_panel", style:"" });
		const menu_button = new Button({ parent:this.sidebar, id:"rootbt_panel_button", innerText:"Root", classList:["PanelButton"] });
		menu_button.onclick = () => {
			this.set_open_panel(menu_panel);
			this.set_toggled_panel_button(menu_button);
			gameControls.set_mode_none();
		};
		menu_button.title = [
			"- To modify properties of the current block-template, edit the desired fields, then press 'Submit'.",
			"- To reset fields, press 'Cancel'.",
		].join("\n");
		// inputs.
		const label_name = new Div({ parent:menu_panel, id:"rootbt_label_name", innerText:"Name", style:"margin-top:10px;" });
		this.rootbt_name = new TextInput({ parent:menu_panel, id:"rootbt_inputs_name", style:"margin-bottom:20px;" });
		const label_desc = new Div({ parent:menu_panel, id:"rootbt_label_desc", innerText:"Description" });
		this.rootbt_desc = new  TextArea({ parent:menu_panel, id:"rootbt_inputs_desc", style:"margin-bottom:20px; height:90px;" });
		this.rootbt_inputs = new InputTable({ parent:menu_panel, id:"rootbt_inputs_temp", tablename: "Properties", inputWidth:60, params: [
				["internal width "		, "", null],
				["internal height"		, "", null],
				["default block width "	, "", null],
				["default block height"	, "", null],
			],
		});
		const btn_grid = new Grid({ parent:menu_panel, id:"rootbt_btn_grid", style:"display:grid; grid-template-columns: 1fr 1fr;" });
		const btn_cancel = new Button({ parent:btn_grid, id:"rootbt_btn_cancel", innerText:"Cancel", onclick:GameUI.onclick_rootbt_cancel });
		const btn_submit = new Button({ parent:btn_grid, id:"rootbt_btn_submit", innerText:"Submit", onclick:GameUI.onclick_rootbt_submit });
		GameUI.refresh_rootbt_inputs();
	}
	
	static refresh_rootbt_inputs() {
		if(!gameData?.rootBlock?.template) return;
		const template = gameData.rootBlock.template;
		const input_name = GameUI.rootbt_name;
		const input_desc = GameUI.rootbt_desc;
		const input_table = GameUI.rootbt_inputs;
		input_name.value = template.name;
		input_desc.value = template.desc;
		input_table.setValue(0, template.width, false);
		input_table.setValue(1, template.height, false);
		input_table.setValue(2, template.placeW, false);
		input_table.setValue(3, template.placeH, false);
	}
	static onclick_rootbt_cancel() {
		GameUI.refresh_rootbt_inputs();
	}
	static onclick_rootbt_submit() {
		const template = gameData.rootBlock.template;
		const input_name = GameUI.rootbt_name;
		const input_desc = GameUI.rootbt_desc;
		const input_table = GameUI.rootbt_inputs;
		const errors = [];
		{
			const [value,valid] = GameUI.parse_str({ target: input_name });
			if(valid) template.name = value;
			else errors.push(`name (${value}) is not valid.`);
		}{
			const [value,valid] = GameUI.parse_str({ target: input_desc });
			if(valid) template.desc = value;
			//else errors.push(`description (${value}) is not valid.`);
		}{
			const [value,valid] = GameUI.parse_u32({ target: input_table.inputs[0] });
			if(valid) template.width = value;
			else errors.push(`internal width (${value}) is not valid.`);
		}{
			const [value,valid] = GameUI.parse_u32({ target: input_table.inputs[1] });
			if(valid) template.height = value;
			else errors.push(`internal height (${value}) is not valid.`);
		}{
			const [value,valid] = GameUI.parse_u32({ target: input_table.inputs[2] });
			if(valid) template.placeW = value;
			else errors.push(`default block width (${value}) is not valid.`);
		}{
			const [value,valid] = GameUI.parse_u32({ target: input_table.inputs[3] });
			if(valid) template.placeH = value;
			else errors.push(`default block height (${value}) is not valid.`);
		}
		if(errors.length > 0) alert("failed to submit some or all of given inputs:\n"+errors.join("\n"));
		GameUI.refresh_rootbt_inputs();
		gameData.setRootBlockTemplate_minor(template.templateId);
	}
	
	
	// ============================================================
	// Selection
	// ------------------------------------------------------------
	// DONE

	// ============================================================
	// Values
	// ------------------------------------------------------------
	// DONE

	// ============================================================
	// Cells
	// ------------------------------------------------------------
	// DONE
	
	// ============================================================
	// Links
	// ------------------------------------------------------------
	
	static init_link_panel() {
		// panel and button.
		const menu_panel = new PanelColumn({ parent:this.panelArea, id:"link_panel" });
		const menu_button = new Button({ parent:this.sidebar, id:"link_panel_button", innerText:"Links", classList:["PanelButton"] }); 
		menu_button.onclick = () => {
			this.set_open_panel(menu_panel);
			this.set_toggled_panel_button(menu_button);
			gameControls.set_mode_place_links();
		};
		menu_button.title = [
			"- To place links, click near desired input/output of first cell, then click again near desired output/input of second cell.",
		].join("\n");
		this.hotkey_btn_links = menu_button;
		// inputs.
		const link_inputs = new InputTable({ parent:menu_panel, id:"link_inputs", tablename: "Properties", inputWidth:40, params: [
				["red"	, "255", this.oninput_link_colour_r],
				["green", "255", this.oninput_link_colour_g],
				["blue"	, "255", this.oninput_link_colour_b],
			],
		});
	}
	
	static colour_mask(value, component, change) {
		const shift = [24, 16, 8][component];
		const mask = 0xff << shift;
		return (value & ~mask) | (mask & (Math.min(Math.max(Math.round(change), 0), 255) << shift));
	}
	static oninput_link_colour_r(event) { const [value, valid] = GameUI.parse_u32(event); if(valid) gameControls.wire_colour = GameUI.colour_mask(gameControls.wire_colour, 0, value); }
	static oninput_link_colour_g(event) { const [value, valid] = GameUI.parse_u32(event); if(valid) gameControls.wire_colour = GameUI.colour_mask(gameControls.wire_colour, 1, value); }
	static oninput_link_colour_b(event) { const [value, valid] = GameUI.parse_u32(event); if(valid) gameControls.wire_colour = GameUI.colour_mask(gameControls.wire_colour, 2, value); }
	
	// ============================================================
	// Texts
	// ------------------------------------------------------------
	
	// TODO: implement.
	
	// TODO: add EditInputs for placement settings.
	// ^ x-align, y-align, fg-colour, bg-colour, outline-colour, font-size.
	
	// ============================================================
	// Blocks
	// ------------------------------------------------------------
	
	static block_buttons_edit = new Map();// Map<templateId, elem>
	static block_buttons_place = new Map();// Map<templateId, elem>
	static block_buttons_remove = new Map();// Map<templateId, elem>
	static block_buttons_grid = null;
	static block_info_tooltip = null;// TODO - implement Tooltip component.
	static block_inputs = null;
	
	static set_handlers_block_info_tooltip(btn, content) {
		const elem = btn.element;// TODO: UIElement should pass handlers along.
		elem.onmouseenter = () => this.block_info_tooltip.show(elem, content);
		elem.onmouseleave = () => this.block_info_tooltip.hide();
	}
	
	static get_template_dependant_list(tid) {
		const list = gameData.getTemplateDependents(tid)
			.map(([template, count, direct]) => (
				{ tag:"div", style:"color:lightblue;", innerText:`${template.name} (${count}x${direct ? ", contains template directly" : ""})` }
			));
		const wrapper = { tag:"div", style:"display:grid; grid-template-columns: 1fr", children:list };
		return wrapper;
	}
	
	static update_block_buttons_edit() {
		const currentTID = gameData.rootBlock.templateId;
		for(const [tid, btn] of this.block_buttons_edit.entries()) btn.toggled = currentTID === tid;
		for(const [tid, btn] of this.block_buttons_edit.entries()) btn.enabled = currentTID !== tid;
	}
	static update_block_buttons_place() {
		this.set_toggled_button_or_none(this.block_buttons_place, gameControls.place_preview_block?.templateId, gameControls.CURSOR_MODE.PLACE_BLOCK);
		for(const [tid, btn] of this.block_buttons_place.entries()) {
			btn.enabled = !gameData.blockTemplates.get(tid).containsRootBlockTemplate();
			const base_style = "width:max-content; padding:5px;";
			const root_id = gameData.rootBlock.templateId;
			let content_1 = null;
			if(btn.enabled)
				content_1 = { tag:"div", style:base_style+"color:lightgreen;", innerText:"This template is safe to place." };
			else
				content_1 = { tag:"div", style:base_style, children: [
					{ tag:"div", style:"color:pink; margin-bottom:10px;", innerText:"Root template is used by:" },
					this.get_template_dependant_list(root_id),
				]};
			const template = gameData.blockTemplates.get(tid);
			let content_2 = { tag:"div", style:base_style+"background:#000a;", children: [
				{ tag:"div", style:"margin-bottom: 5px;", innerText:`${template.name}` },
				{ tag:"div", style:"margin-bottom: 5px; color:lightblue;", innerText:`ID:` },
				{ tag:"div", style:"margin-bottom: 5px; margin-left: 20px; max-width:40vw;", innerText:`${template.templateId}` },
				{ tag:"div", style:"margin-bottom: 0px; color:lightblue;", innerText:`Description:` },
				{ tag:"div", style:"margin-bottom: 5px; margin-left: 20px; max-width:40vw;", innerText:`${template.desc}` },
				{ tag:"div", style:"margin-bottom: 20px;" },
				content_1,
			]};
			this.set_handlers_block_info_tooltip(btn, ElementParser.parse(content_2));
		}
	}
	static update_block_buttons_remove() {
		for(const [tid, btn] of this.block_buttons_remove.entries()) {
			btn.enabled = gameData.canDeleteBlockTemplate(tid);
			const base_style = "width:max-content; padding:5px;";
			let content_1 = null;
			if(btn.enabled)
				content_1 = { tag:"div", style:base_style+"color:lightgreen;", innerText:"This template is safe to remove." };
			else {
				if(gameData.rootBlock.templateId === tid)
					content_1 = { tag:"div", style:base_style+"color:pink;", innerText:"This template is being edited." };
				else
					content_1 = { tag:"div", style:base_style, children: [
						{ tag:"div", style:"color:pink; margin-bottom:10px;", innerText:"This template is used by:" },
						this.get_template_dependant_list(tid),
					]};
			}
			let content_2 = { tag:"div", style:base_style+"background:#000a;", children: [content_1] };
			this.set_handlers_block_info_tooltip(btn, ElementParser.parse(content_2));
		}
	}
	static update_block_buttons() {
		this.update_block_buttons_edit();
		this.update_block_buttons_place();
		this.update_block_buttons_remove();
	}
	
	static onclick_block_edit(templateId) {
		gameData.setRootBlockTemplate(templateId);
	}
	static onclick_block_place(templateId) {
		gameControls.set_mode_place_blocks(templateId);
		this.update_block_buttons();
		const template = gameData.blockTemplates.get(templateId);
		this.block_inputs.setValue(0, template.placeW, true);
		this.block_inputs.setValue(1, template.placeH, true);
	}
	static onclick_block_remove(templateId) {
		gameData.deleteBlockTemplate(templateId);
	}
	
	static rebuild_block_buttons() {
		// remove buttons corresponding to templates that don't exist.
		for(const [tid, elem] of this.block_buttons_place.entries()) {
			if(!gameData.blockTemplates.has(tid)) {
				this.block_buttons_edit.get(tid).remove();
				this.block_buttons_edit.delete(tid);
				this.block_buttons_place.get(tid).remove();
				this.block_buttons_place.delete(tid);
				this.block_buttons_remove.get(tid).remove();
				this.block_buttons_remove.delete(tid);
			}
		}
		// create buttons corresponding to templates that don't have buttons yet.
		const grid = this.block_buttons_grid;
		for(const [tid, template] of gameData.blockTemplates.entries()) {
			if(!this.block_buttons_place.has(tid)) {
				this.block_buttons_edit  .set(tid, new Button({id:`block_btns_e_${tid}`, parent:grid, onclick:()=>this.onclick_block_edit  (tid), innerText:"Edit"}));
				this.block_buttons_place .set(tid, new Button({id:`block_btns_p_${tid}`, parent:grid, onclick:()=>this.onclick_block_place (tid), innerText:template.name}));
				this.block_buttons_remove.set(tid, new Button({id:`block_btns_r_${tid}`, parent:grid, onclick:()=>this.onclick_block_remove(tid), innerText:"X"}));
			} else {
				this.block_buttons_place .get(tid).innerText = template.name;
			}
		}
		// update button states.
		this.update_block_buttons_edit();
		this.update_block_buttons_place();
		this.update_block_buttons_remove();
	}
	
	static init_block_panel() {
		// panel and button.
		const menu_panel = new PanelColumn({ parent:this.panelArea, id:"block_panel", style:"" });
		const menu_button = new Button({ parent:this.sidebar, id:"block_panel_button", innerText:"Blocks", classList:["PanelButton"] });
		menu_button.onclick = () => {
			this.set_open_panel(menu_panel);
			this.set_toggled_panel_button(menu_button);
			if(this.current_open_panel === menu_panel) gameControls.set_mode_place_blocks();
		};
		menu_button.title = [
			"- To place blocks, click the block's name in the list of available block-templates.",
			"- To edit a block, click the 'Edit' button beside the desired block's name.",
			"- To remove a block-template, click the 'X' button beside the desired block's name.",
		].join("\n");
		this.hotkey_btn_blocks = menu_button;
		// settings.
		this.block_inputs = new InputTable({ parent:menu_panel, id:"block_inputs", tablename: "Properties", inputWidth: 50, params: [
				["block width"		, "1", this.oninput_block_w],
				["block height"		, "1", this.oninput_block_h],
				["rotation (deg)"	, "0", this.oninput_block_r],
			],
		});
		// tooltip.
		this.block_info_tooltip = new Tooltip({ id: `block_info_tooltip`, parent: document.body });
		// template buttons.
		const wrapper = new Div({ id: `block_template_btns_grid_wrapper`, parent: menu_panel, style: "overflow-y:scroll;" });
		this.block_buttons_grid = new Grid({ id: `block_template_btns_grid`, parent: wrapper, style: "grid-template-columns: 60px 1fr 30px;" });
		this.rebuild_block_buttons();
	}
	
	static oninput_block_w(event) { try { gameControls.place_dim_block[0] = Number(event.target.value);     } catch(error) { console.error(error); }}
	static oninput_block_h(event) { try { gameControls.place_dim_block[1] = Number(event.target.value);     } catch(error) { console.error(error); }}
	static oninput_block_r(event) { try { gameControls.place_dim_block[2] = Number(event.target.value)/360; } catch(error) { console.error(error); }}
	
	static on_major_blocklib_change() {
		gameControls.place_stopBlockPlacement();
		gameControls.clearCollections();
		if(this.block_buttons_grid) this.rebuild_block_buttons();
		if(this.rootbt_panel) this.refresh_rootbt_inputs();
	}
	static on_minor_blocklib_change() {
		if(this.block_buttons_grid) this.rebuild_block_buttons();
		if(this.rootbt_panel) this.refresh_rootbt_inputs();
	}
	
	// ============================================================
	// file menu
	// ------------------------------------------------------------
	
	static file_menu = null;
	static textarea_import = null;
	static textarea_export = null;
	static new_block_popup = null;
	static buttons_file = new Map();// Map<value, Button>
	
	static init_file_panel() {
		// panel and button.
		const menu_panel = this.file_menu = new PanelColumn({ parent:this.panelArea, id:"file_panel", style:"" });
		const menu_button = new Button({ parent:this.sidebar, id:"file_panel_button", innerText:"File", classList:["PanelButton"] });
		menu_button.onclick = () => {
			this.set_open_panel(menu_panel);
			this.set_toggled_panel_button(menu_button);
			gameControls.set_mode_none();
		};
		menu_button.title = [
			"- To create a new block, click 'New Block', then fill in block details.",
			"- To import block-templates, paste text into text-area below 'Import' button, then press 'Import' button.",
			"- To export block-templates, press 'Export' button. This will put a text representation of all loaded block-templates into the text-area below.",
		].join("\n");
		// panel contents.
		const btn_new = new Button({id: `file_btn_new`, parent: menu_panel, innerText: "New Block",
			style:"margin:unset; width:inherit;", title: "Create a new block template." });
		const btn_import = new Button  ({id: `file_btn_import`, parent: menu_panel, innerText: "Import",
			style:"margin:unset; margin-top:10px; width:inherit;", title: "Import block-templates from text area." });
		const txt_import = new TextArea({id: `file_txt_import`, parent: menu_panel, style: "height:200px; width:inherit; overflow:scroll;" });
		const btn_export = new Button  ({id: `file_btn_export`, parent: menu_panel, innerText: "Export",
			style:"margin:unset; margin-top:10px; width:inherit;", title: "Export block-template library to text area." });
		const txt_export = new TextArea({id: `file_txt_export`, parent: menu_panel, style: "height:200px; width:inherit; overflow:scroll;" });
		GameUI.buttons_file.set("NEW", btn_new);
		GameUI.buttons_file.set("IMPORT", btn_import);
		GameUI.buttons_file.set("EXPORT", btn_export);
		GameUI.textarea_import = txt_import;
		GameUI.textarea_export = txt_export;
		btn_new.onclick = GameUI.onclick_file_new;
		btn_export.onclick = GameUI.onclick_file_export;
		btn_import.onclick = GameUI.onclick_file_import;
	}
	static onclick_file_new() {
		//this.file_menu.close();
		const wrapper = new Div({ id:"new_block_wrapper", style:"display: flex; flex-direction: column;" });
		const label_w = new Div({ id:"new_block_input_w", parent:wrapper, innerText:"Width" });
		const input_w = new TextInput({ id:"new_block_input_w", parent:wrapper, type:"number" });
		const label_h = new Div({ id:"new_block_input_h", parent:wrapper, innerText:"Height" });
		const input_h = new TextInput({ id:"new_block_input_h", parent:wrapper, type:"number" });
		const label_n = new Div({ id:"new_block_input_n", parent:wrapper, innerText:"Name" });
		const input_n = new TextInput({ id:"new_block_input_n", parent:wrapper, type:"text" });
		const label_d = new Div({ id:"new_block_input_d", parent:wrapper, innerText:"Description" });
		const input_d = new TextArea ({ id:"new_block_input_d", parent:wrapper, style:"width:500px;height:300px;" });
		const onsubmit = () => {
			const w = Number(input_w.value);
			const h = Number(input_h.value);
			const name = input_n.value;
			const desc = input_d.value;
			if(w && h && name) {
				gameData.createNewBlockTemplate(w, h, name, desc);
				GameUI.set_open_panel(null);
				GameUI.set_toggled_panel_button(null);
				return true;
			} else {
				alert("One or more inputs were invalid!\n\n" + JSON.stringify({w,h,name,desc}));
				return false;
			}
		};
		this.new_block_popup = new Popup({ id:"new_block_popup", parent:document.body, content:[wrapper], onsubmit });
	}
	static onclick_file_export() {
		GameUI.textarea_export.value = gameData.exportTemplates();
	}
	static onclick_file_import() {
		const json = GameUI.textarea_import.value;
		gameData.importTemplates(json);
	}
	
	// ============================================================
	// Play, Pause, Reset, Speed.
	// ------------------------------------------------------------
	
	static button_play = null;
	
	static update_play() {
		const value = gameData.simulationIsRunning;
		const btn = GameUI.button_play;
		btn.innerText = value ? "(P) Pause" : "(P) Play";
		btn.title = value ? "Pause simulation" : "Run simulation";
	}
	static toggle_play() {
		gameData.simulationIsRunning = !gameData.simulationIsRunning;
		this.update_play();
	}
	
	static init_play_header() {
		const header = document.querySelector("#header");
		const btn_reset = new Button({id: `play_btn_reset`, parent: header, innerText: "Reset", style:"", title: "Reset simulation data" });
		const btn_play  = new Button({id: `play_btn_play` , parent: header, innerText: "(P) Play", style:"margin-left:5px;" });
		btn_reset.onclick = () => gameData.shouldReset = true;
		btn_play .onclick = () => GameUI.toggle_play();
		this.button_play = btn_play;
		this.hotkey_btn_play = btn_play;
		this.update_play();
		// speed slider.
		const M = 0.5;				// multiplier
		const O = Math.round(1/M);	// step offset
		const N = 20;				// number of steps per order
		const L = (N-O) * 6;		// step limit
		const compute = (step) => M * ((step % (N-O)) + O) * Math.pow(10, Math.floor(step / (N-O)));
		const inverse = (step) => {
			// binary search.
			let min = 0;
			let max = L;
			let cur = L/2;
			while(min<cur && cur<max) {
				const val = compute(cur);
				if(val <= step) { min=cur; cur=(min+max)/2; }
				if(val >= step) { max=cur; cur=(min+max)/2; }
			}
			return cur;
		};
		const V = inverse(gameData.simulationSpeed);
		const oninput = (event) => {
			const value = Number(event.target.value);
			const speed = compute(value);
			gameData.simulationSpeed = speed;
		};
		const getText = () => {
			const speed = gameData.simulationSpeed;
			return ` Speed: ${Number(speed).toFixed(1)} steps/sec.`;
		};
		const slider_speed = new Slider({
			id:"slider_speed", parent: header, min:0, max:L, step:1, value:V, oninput, getText,
			classList:["outline"],
			style:"display:flex; margin-left:20px; padding-left:10px; padding-right:10px;",
			style_label:"align-content:center; margin-left:10px;",
		})
	}
	
	// ============================================================
	// Extra Popups.
	// ------------------------------------------------------------
	
	static link_delete_popup = null;
	static showLinkDeletionPopup(deletionList, text, onsubmit, oncancel) {
		const wrapper = new Div({ id:"link_delete_popup_wrapper", style:"display: flex; flex-direction: column;" });
		const header = new Div({ id:"link_delete_popup_header", parent:wrapper, innerText:text });
		for(const [template, links] of deletionList) {
			const tid = template.templateId;
			const elem = new Div({ id:`link_delete_popup_elem_${tid}`, parent:wrapper, innerText:`${template.name} (${links.length}x)` });
		}
		this.link_delete_popup = new Popup({ id:"link_delete_popup", parent:document.body, content:[wrapper], onsubmit, oncancel });
	}
	
	//static crash_popup = null;
	static showCrashPopup(error, text) {
		alert(text + "\n\n" + error);
	}
	
};



