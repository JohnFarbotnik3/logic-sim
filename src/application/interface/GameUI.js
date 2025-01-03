
// TODO: migrate this to Svelte
export class GameUI {

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
	//DONE

	
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



