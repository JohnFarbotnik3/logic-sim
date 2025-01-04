import { TEST_BLOCKS_OBJECT } from "./GameInit_json"
import { GameServer_wasm } from "./server/GameServer_wasm"
import { GameUI, GameRenderer } from "./interface/exports";
import { BlockTemplateLibrary } from "./content/exports";
import { CachedValue_Rendering } from "./CachedValue";
import { Performance } from "./Performance";

class Main {
	constructor() {
		this.gameServer		= null;
		this.gameUI			= null;
		this.gameRenderer	= null;
		this.blockLibrary	= null;
		// current frame number.
		this.frameCounter = 0;
		// true if simulation should rebuild.
		this.simulationShouldRebuild = true;
		// true if simulation should rebuild and reset cell values.
		this.simulationShouldReset = true;
		// simulation speed - steps per second.
		this.simulationSpeed = 60;
		this.simulationDatePrev = 0;
		this.simulationIsRunning = true;
		// maximum recursive drawing depth for blocks.
		this.maxDrawDepth = 2;
	}

	async init() {
		// init interface.
		this.gameUI = new GameUI();
		this.gameUI.init();

		// load game server.
		this.gameServer = new GameServer_wasm();
		await this.gameServer.isReady;
		console.log("gameServer is ready");

		// load block data.
		this.blockLibrary = new BlockTemplateLibrary();
		this.blockLibrary.importTemplates(JSON.stringify(TEST_BLOCKS_OBJECT));
		console.log("loaded templates", this.blockLibrary.templates);

		// set root block.
		let templateId = null;
		for(const tid of this.blockLibrary.templates.keys()) { templateId = tid; break; }
		this.set_root_block_template(templateId);

		// start update cycle.
		requestAnimationFrame((t) => this.update.call(this, t));
	}

	recreateRenderer(canvas) {
		this.gameRenderer = new GameRenderer(canvas);
	}

	async update(currentTime) {
		try {
			// return early if renderer has not been created yet.
			if(!this.gameRenderer) {
				console.log("game renderer is not ready yet!");
				requestAnimationFrame((t) => this.update.call(this, t));
				return;
			}
			// update cycle.
			Performance.reset();
			const t0 = Date.now();
			this.frameCounter++;
			const blocklib = this.blockLibrary;
			await blocklib.verifyLinksCanFindTargets();
			this.gameUI.update();
			await blocklib.verifyLinksCanFindTargets();
			const rootTemplateId = blocklib.rootBlock.templateId;
			const t_s0 = Date.now();
			if(this.simulationShouldRebuild | this.simulationShouldReset) {
				console.log("REBUILDING SIMULATION");
				const keepCellValues = !this.simulationShouldReset;
				this.gameServer.send_templates(blocklib.templates, rootTemplateId);
				this.gameServer.simulation_rebuild(rootTemplateId, keepCellValues);
				this.simulationShouldRebuild = false;
				this.simulationShouldReset = false;
			}
			const t_s1 = Date.now();
			if(this.simulationDatePrev === 0) this.simulationDatePrev = Date.now();
			const prevStep = Math.floor(this.simulationSpeed * 0.001 * this.simulationDatePrev);
			const currStep = Math.floor(this.simulationSpeed * 0.001 * Date.now());
			const numSteps = currStep - prevStep;
			this.gameServer.simulation_update(numSteps);
			this.simulationDatePrev = Date.now();
			const t_s2 = Date.now();
			this.gameRenderer.render();
			const t1 = Date.now();
			Performance.increment_time("sim.rebuild", t_s1-t_s0);
			Performance.increment_time("sim.update ", t_s2-t_s1);
			Performance.increment_time("main.update", t1-t0);
			Performance.log_all();
			requestAnimationFrame((t) => this.update.call(this, t));
		} catch(error) {
			this.gameUI.showCrashPopup(error, "application crashed during Main.update()");
			throw(error);
		}
	}

	// ============================================================
	// Content change handlers.
	// ------------------------------------------------------------
	onRootContentChanged_addCell(cell) { this.simulationShouldRebuild = true; }
	onRootContentChanged_remCell(cell) { this.simulationShouldRebuild = true; }
	onRootContentChanged_addLink(link) { this.simulationShouldRebuild = true; }
	onRootContentChanged_remLink(link) { this.simulationShouldRebuild = true; }
	onRootContentChanged_addBlock(block) { this.simulationShouldRebuild = true; }
	onRootContentChanged_remBlock(block) { this.simulationShouldRebuild = true; }

	// ============================================================
	// Template Library
	// ------------------------------------------------------------

	set_root_block_template(templateId) {
		this.blockLibrary.set_root_block_template(templateId);
		CachedValue_Rendering.onChange();
		this.simulationShouldRebuild = true;
		this.gameUI.on_major_blocklib_change();
		this.gameUI.root_template_reset_inputs();
	}
	refresh_root_block_template() {
		this.blockLibrary.refresh_root_block_template();
		CachedValue_Rendering.onChange();
		this.gameUI.on_minor_blocklib_change();
	}

};
export const main = new Main();

