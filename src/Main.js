

class Main {

	doUpdate = false;
	onUpdate = null;
	
	async init() {
		GameInit.init();
		GameUI.init();
		await this.updateRestart();
	}

	async updateRestart() {
		GameRenderer.init();
		let prom = null;
		if(this.doUpdate) {
			prom = new Promise((res, rej) => { this.onUpdate = res; });
			this.doUpdate = false;
		}
		if(prom) {
			console.debug("[restart] waiting for rendering to exit");
			await prom;
		}
		console.debug("[restart] restarting");
		this.doUpdate = true;
		requestAnimationFrame(this.update);
	}

	async update(currentTime) {
		try {
			const t0 = Date.now();
			const _this = main;
			Performance.reset();
			gameData.frameCounter++;
			GameUI.update_hotkeys();
			await gameData.verifyLinksCanFindTargets();
			gameControls.update();
			await gameData.verifyLinksCanFindTargets();
			simulation.update();
			GameRenderer.render();
			if(_this.doUpdate) requestAnimationFrame(_this.update);
			else if(_this.onUpdate) _this.onUpdate(true);
			const t1 = Date.now();
			Performance.increment_time("main.update", t1-t0);
			Performance.log_all();
		} catch(error) {
			GameUI.showCrashPopup(error, "application crashed during Main.update()");
			throw(error);
		}
	}
};

// static structures
const gameData			= new GameData();
const gameControls		= new GameControls();
const simulation		= new GameSimulation();
const main				= new Main();



