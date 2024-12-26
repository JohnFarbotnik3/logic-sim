import { CachedValue_Content, CachedValue_Rendering } from "./misc/CachedValue";


export class GameData {
	
	// ============================================================
	// misc
	// ------------------------------------------------------------
	
	// main block currently being edited.
	rootBlock = null;
	
	// current frame number.
	frameCounter = 0;
	
	// simulation speed - steps per second.
	simulationSpeed = 60;
	simulationIsRunning = true;
	// true if simulation should rebuild.
	shouldRebuild = true;
	// true if simulation should rebuild and reset cell values.
	shouldReset = true;

	// ============================================================
	// BlockTemplate Library.
	// ------------------------------------------------------------
	// TODO: bundle this stuff into a BTLibrary class.

	// list of loaded block templates.
	blockTemplates = new Map();// Map<templateId, BlockTemplate>
	
	setRootBlockTemplate(templateId) {
		const template = this.blockTemplates.get(templateId);
		this.rootBlock = new Block(new ComponentDimensions(0, 0, template.width,template.height, 0), template.templateId);
		CachedValue_Content.onChange();
		gameData.shouldRebuild = true;
		GameUI.on_major_blocklib_change();
	}
	setRootBlockTemplate_minor(templateId) {
		const template = this.blockTemplates.get(templateId);
		this.rootBlock = new Block(new ComponentDimensions(0, 0, template.width,template.height, 0), template.templateId);
		CachedValue_Content.onChange();
		GameUI.on_minor_blocklib_change();
	}
	
	/* Return all templates that contain templateId. */
	getTemplateDependents(templateId) {
		const deps = [];
		for(const [tid, template] of this.blockTemplates.entries()) {
			if(tid !== templateId) {
				const counts = template.countUsedTemplates();
				let direct = false;
				for(const block of template.blocks) if(block.templateId === templateId) { direct=true; break; }
				if(counts.has(templateId)) deps.push([template, counts.get(templateId), direct]);
			}
		}
		return deps;
	}
	
	createNewBlockTemplate(w, h, name, desc) {
		const dim = new ComponentDimensions(0,0,w,h,0);
		const newTemplate = new BlockTemplate(w,h);
		newTemplate.name = name;
		newTemplate.desc = desc;
		this.blockTemplates.set(newTemplate.templateId, newTemplate);
		GameUI.on_major_blocklib_change();
		this.setRootBlockTemplate(newTemplate.templateId);
	}
	
	canDeleteBlockTemplate(templateId) {
		if(templateId === this.rootBlock.templateId) return false;
		const deps = this.getTemplateDependents(templateId);
		if(deps.length > 0) return false;
		return true;
	}
	deleteBlockTemplate(templateId) {
		if(templateId === this.rootBlock.templateId) {
			alert("cannot delete template while it is being edited");
			return;
		}
		const deps = this.getTemplateDependents(templateId);
		if(deps.length > 0) {
			let depstrs = [];
			for(const [template, count] of deps) depstrs.push(`[${template.templateId}] "${template.name}" contains ${count} instance(s)`);
			alert(`cannot delete template as other templates depend on it:\n\n${depstrs.join("\n")}`);
			return;
		}
		console.log("deleting template", templateId);
		this.blockTemplates.delete(templateId);
		GameUI.on_major_blocklib_change();
	}
	
	exportTemplates() {
		let arr = [];
		for(const [tid, template] of this.blockTemplates.entries()) {
			arr.push(template.save());
		}
		return JSON.stringify(arr);
	}
	
	importTemplates(json) {
		const value = json;
		let templates = [];
		if(json.trim().length > 0) try {
			const arr = JSON.parse(value.trim());
			for(const item of arr) templates.push(BlockTemplate.load(item));
		} catch(error) {
			alert("failed to parse import text-area:\n\n" + error);
			if(gameData.blockTemplates.size === 0) this.createNewBlockTemplate(12, 12, "New template", "");
			return;
		}
		for(const template of templates) {
			this.blockTemplates.set(template.templateId, template);
			gameData.shouldRebuild = true;
		}
		GameUI.on_major_blocklib_change();
	}
	
	// ============================================================
	// Content change handlers.
	// ------------------------------------------------------------
	onRootContentChanged_addCell(cell) { gameData.shouldRebuild = true; }
	onRootContentChanged_remCell(cell) { gameData.shouldRebuild = true; }
	onRootContentChanged_addLink(link) { gameData.shouldRebuild = true; }
	onRootContentChanged_remLink(link) { gameData.shouldRebuild = true; }
	onRootContentChanged_addBlock(block) { gameData.shouldRebuild = true; }
	onRootContentChanged_remBlock(block) { gameData.shouldRebuild = true; }

	// ============================================================
	// Link deletion and verification.
	// ------------------------------------------------------------
	
	verifyLinksCanFindTargets() {
		const deletionList = BlockTemplate.getLinksThatCantFindTargets();
		const promise = new Promise((resolve, reject) => {
			const onsubmit = () => {
				BlockTemplate.deleteLinksInTemplateLinkList(deletionList);
				resolve(true);
				return true;
			};
			const oncancel = () => {
				resolve(false);
				return true;
			};
			const text = "WARNING - links in the following templates failed to find targets (delete links?):";
			if(deletionList.length > 0)	GameUI.showLinkDeletionPopup(deletionList, text, onsubmit, oncancel);
			else						onsubmit();
		});
		return promise;
	}
	
	// ============================================================
	// Cached Render Block.
	// ------------------------------------------------------------
	
	// maximum recursive drawing depth for blocks.
	maxDrawDepth = 2;
	
	_renderBlock() {
		const block = this.rootBlock;
		const etran = new Transformation2D();
		const ctran = RenderTreeBlock.get_content_transformation(block, etran);
		const depth = 0;
		const renblock = new RenderTreeBlock(null, block, etran, depth, this.maxDrawDepth);
		return renblock;
	}
	_renderBlock_cache = new CachedValue_Rendering(() => this._renderBlock());
	get renderBlock() { return this._renderBlock_cache.value; }
	
	// ============================================================
	// structors
	// ------------------------------------------------------------
	constructor() {}
};

