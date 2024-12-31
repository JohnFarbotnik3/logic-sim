import { GameData } from "./GameData"
import { GameServer_wasm } from "./server/GameServer_wasm"
import { TEST_BLOCKS_OBJECT } from "./GameInit_json"
import { GameUI } from "./interface/GameUI_v2";
import { GameRenderer } from "./render/GameRenderer";
import { Performance } from "./misc/Performance";

// global structures
export let   gameServer		= null;
export const gameData		= new GameData();
export const gameUI			= new GameUI();
export let   gameRenderer	= null;

class Main {
	async init() {
		// load game server.
		gameServer = new GameServer_wasm();
		await gameServer.isReady;
		console.log("gameServer is ready");

		// load block data.
		gameData.importTemplates(JSON.stringify(TEST_BLOCKS_OBJECT));
		console.log("loaded templates", gameData.blockTemplates);

		// set root block.
		let templateId = null;
		for(const tid of gameData.blockTemplates.keys()) { templateId = tid; break; }
		gameData.setRootBlockTemplate(templateId);

		// init interface.
		gameUI.init();

		// start update cycle.
		requestAnimationFrame((t) => this.update.call(this, t));
	}

	recreateRenderer(canvas) {
		gameRenderer = new GameRenderer(canvas);
	}

	async update(currentTime) {
		try {
			Performance.reset();
			const t0 = Date.now();
			gameData.frameCounter++;
			await gameData.verifyLinksCanFindTargets();
			gameUI.update();
			await gameData.verifyLinksCanFindTargets();
			const rootTemplateId = gameData.rootBlock.templateId;
			const t_s0 = Date.now();
			if(gameData.shouldRebuild | gameData.shouldReset) {
				console.log("REBUILDING SIMULATION");
				const keepCellValues = !gameData.shouldReset;
				gameServer.send_templates(gameData.blockTemplates, rootTemplateId);
				gameServer.simulation_rebuild(rootTemplateId, keepCellValues);
				gameData.shouldRebuild = false;
				gameData.shouldReset = false;
			}
			const t_s1 = Date.now();
			if(gameData.simulationIsRunning) gameServer.simulation_update(gameData.simulationSpeed);
			const t_s2 = Date.now();
			gameRenderer.render();
			const t1 = Date.now();
			Performance.increment_time("sim.rebuild", t_s1-t_s0);
			Performance.increment_time("sim.update ", t_s2-t_s1);
			Performance.increment_time("main.update", t1-t0);
			Performance.log_all();
			requestAnimationFrame((t) => this.update.call(this, t));
		} catch(error) {
			gameUI.showCrashPopup(error, "application crashed during Main.update()");
			throw(error);
		}
	}
};
export const main = new Main();

