import { GameData } from "./GameData"
import { GameControls } from "./interface/GameControls"
import { GameServer_wasm } from "./server/GameServer_wasm"
import { TEST_BLOCKS_OBJECT } from "./GameInit_json"
//import { GameUI } from "./interface/GameUI";
import { GameUI } from "./interface/GameUI_v2";

// global structures
export let   gameServer		= null;
export const gameData		= new GameData();
export const gameControls	= new GameControls();
export const gameUI			= new GameUI();

class Main {

	doUpdate = false;
	onUpdate = null;
	
	async init() {
		// load game server.
		gameServer = new GameServer_wasm();
		await gameServer.isReady;
		console.log("gameServer is ready");

		// load block data.
		gameData.importTemplates(JSON.stringify(TEST_BLOCKS_OBJECT));
		// set root block.
		let templateId = null;
		for(const tid of gameData.blockTemplates.keys()) { templateId = tid; break; }
		gameData.setRootBlockTemplate(templateId);

		// restart update cycle.
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
export const main = new Main();

