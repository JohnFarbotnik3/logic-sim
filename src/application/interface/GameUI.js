
// TODO: migrate this to Svelte
export class GameUI {

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
	//DONE
	
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
		this.hotkey_btn_blocks = menu_button;

		// tooltip.
		this.block_info_tooltip = new Tooltip({ id: `block_info_tooltip`, parent: document.body });
		// template buttons.
		const wrapper = new Div({ id: `block_template_btns_grid_wrapper`, parent: menu_panel, style: "overflow-y:scroll;" });
		this.block_buttons_grid = new Grid({ id: `block_template_btns_grid`, parent: wrapper, style: "grid-template-columns: 60px 1fr 30px;" });
		this.rebuild_block_buttons();
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

};



