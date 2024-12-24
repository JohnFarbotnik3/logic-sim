
// global structures
let   gameServer		= null;
const gameData			= new GameData();
const gameControls		= new GameControls();

class Main {

	doUpdate = false;
	onUpdate = null;
	
	async init() {
		await GameServer_wasm.module_ready_promise.then(() => {
			gameServer = new GameServer_wasm();
			console.log("gameServer", gameServer);
		});
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
			const rootTemplateId = gameData.rootBlock.templateId;
			const t_s0 = Date.now();
			if(gameData.shouldRebuild | gameData.shouldReset) {
				const keepCellValues = !gameData.shouldReset;
				gameServer.send_templates(gameData.blockTemplates, rootTemplateId);
				gameServer.simulation_rebuild(rootTemplateId, keepCellValues);
				gameData.shouldRebuild = false;
				gameData.shouldReset = false;
			}
			const t_s1 = Date.now();
			if(gameData.simulationIsRunning) gameServer.simulation_update(gameData.simulationSpeed);
			const t_s2 = Date.now();
			Performance.increment_time("sim.rebuild", t_s1-t_s0);
			Performance.increment_time("sim.update ", t_s2-t_s1);
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
const main = new Main();

