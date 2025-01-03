
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



