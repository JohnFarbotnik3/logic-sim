import {
	ComponentId,
	ComponentDimensions,
	Cell,
	Link,
	Block,
	BlockTemplate,
} from "./exports";
import { VerificationUtil } from "../lib/exports";
import { main } from "../Main";

export class BlockTemplateLibrary {

	constructor() {
		// list of block templates in this library.
		this.templates = new Map();// Map<templateId, BlockTemplate>
		// template currently being edited.
		this.rootBlock = null;// TODO: move this to Main.
	}

	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	// NOTE: unlike other save/load functions, these convert to and from JSON.

	save() {
		let arr = [];
		for(const [tid, template] of this.templates.entries()) {
			arr.push(template.save());
		}
		return JSON.stringify(arr);
	}

	static load(json) {
		throw("TODO");
	}

	// TODO: change this into a save/load style function.
	importTemplates(json) {
		const value = json.trim();
		if(value.length > 0) try {
			const templates = [];
			const arr = JSON.parse(value);
			console.log("<>arr", arr);
			for(const item of arr) {
				const template = BlockTemplate.load(item);
				this.templates.set(template.templateId, template);
				main.simulationShouldRebuild = true;
			}
		} catch(error) {
			alert("failed to parse import text-area:\n\n" + error.stack);
		}
		if(this.templates.size === 0) {
			main.createNewBlockTemplate(12, 12, "New template", "");
			main.simulationShouldRebuild = true;
		}
		main.gameUI.on_major_blocklib_change();
	}

	// ============================================================
	// Content logistics
	// ------------------------------------------------------------

	/*
		returns a map with the number of instances of all templates that appear
		in this BlockTemplate's tree (including itself).
	*/
	_countUsedTemplatesInTree_cache = new Map();// Map<templateId>
	_countUsedTemplatesInTree(templateId) {
		// check cache.
		console.log("<>templateId",templateId);
		const cache = this._countUsedTemplatesInTree_cache;
		if(cache.has(templateId)) return cache.get(templateId);
		// add self to use-count.
		const used = new Map();// Map<templateId, count>
		used.set(templateId, 1);
		// sum child template use-counts.
		console.log("<>this.templates",this.templates);
		const template = this.templates.get(templateId);
		for(const block of template.blocks) {
			const map = this._countUsedTemplatesInTree(block.templateId);
			for(const [tid,num] of map.entries()) used.set(tid, (used.get(tid) ?? 0) + num);
		}
		// add to cache and return.
		cache.set(templateId, used);
		return used;
	}
	countUsedTemplatesInTree(templateId) {
		if(!templateId) throw("missing templateId");
		this._countUsedTemplatesInTree_cache.clear();
		return this._countUsedTemplatesInTree(templateId);
	}

	containsTemplateInTree(templateId, tid) {
		return this.countUsedTemplatesInTree(templateId).has(tid);
	}
	containsRootTemplateInTree(templateId) {
		return this.countUsedTemplatesInTree(templateId).has(this.rootBlock.templateId);
	}

	// ============================================================
	// Template management
	// ------------------------------------------------------------

	set_root_block_template(templateId) {
		const template = this.templates.get(templateId);
		this.rootBlock = new Block(new ComponentDimensions(0, 0, template.width, template.height, 0), templateId);
	}
	refresh_root_block_template() {
		const templateId = this.rootBlock.templateId;
		const template = this.templates.get(templateId);
		this.rootBlock = new Block(new ComponentDimensions(0, 0, template.width, template.height, 0), templateId);
	}

	createNewBlockTemplate(w, h, name, desc) {
		const dim = new ComponentDimensions(0,0,w,h,0);
		const newTemplate = new BlockTemplate(w,h);
		newTemplate.name = name;
		newTemplate.desc = desc;
		this.templates.set(newTemplate.templateId, newTemplate);
		main.gameUI.on_major_blocklib_change();
		main.set_root_block_template(newTemplate.templateId);
	}

	/* Return all templates that contain templateId. */
	getTemplateDependents(templateId) {
		const deps = [];// [template, useCount][]
		for(const [tid, template] of this.templates.entries()) {
			if(tid !== templateId) {
				const used = new Map();// Map<templateId, count>
				for(const block of template.blocks) {
					const tid = block.templateId;
					used.set(tid, (used.get(tid) ?? 0) + 1);
				}
				if(used.has(templateId)) deps.push([template, used.get(templateId)]);
			}
		}
		return deps;
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
		this.templates.delete(templateId);
		main.gameUI.on_major_blocklib_change();
	}

	get_template_dependency_chain(templateId, tid) {
		// check if block is contained in this template
		const template = this.templates.get(templateId);
		for(const block of template.blocks) if(block.templateId === tid) {
			const btmp = this.templates.get(block.templateId);
			return [template, btmp];
		}
		// get set of unique templates in this template.
		const tids = new Set();
		for(const block of template.blocks) tids.add(block.templateId);
		// get (first) chain of containment among templates.
		for(const subtid of tids.keys()) {
			const chain = this.get_template_dependency_chain(subtid, tid);
			if(chain) return [template, ...chain];
		}
		// no dependency chain found.
		return null;
	}
	get_root_template_dependency_chain(templateId) {
		return this.get_template_dependency_chain(templateId, this.rootBlock.templateId);
	}

	// ============================================================
	// Link Utils
	// ------------------------------------------------------------

	/*
		Return a list of links from all templates in library which point
		to a particular cell in the given template.
	*/
	getLinksThatPointToCellInTemplate(templateId, cid, includeSelf) {
		const list = [];// [template, link[]][]
		for(const [tid, template] of this.templates.entries()) {
			// skip this template if ignoring internal links.
			if(tid === templateId && !includeSelf) continue;
			// get mapping from blockIds to templateIds.
			const tidmap = new Map();// Map<bid, tid>
			for(const block of template.blocks) tidmap.set(block.id, block.templateId);
			// find links pointing to cell with given id in given template.
			const arr = [];
			for(const link of template.links) {
				const {bid_src, bid_dst, cid_src, cid_dst, tgt_src, tgt_dst} = link;
				const tid_src = (bid_src === ComponentId.THIS_BLOCK) ? tid : tidmap.get(bid_src);
				const tid_dst = (bid_dst === ComponentId.THIS_BLOCK) ? tid : tidmap.get(bid_dst);
				if((tid_src === templateId & cid_src === cid) | (tid_dst === templateId & cid_dst === cid)) arr.push(link);
			}
			if(arr.length > 0) list.push([template, arr]);
		}
		console.debug("<>getLinksThatPointToCellInTemplate(templateId, cid, includeSelf)", templateId, cid, includeSelf, list);
		return list;
	}

	/*
		Return a list of links from all templates in library which point
		to a particular cell in the given template,
		but the cell is missing (which means something went wrong).
	*/
	getLinksThatCantFindTargets() {
		// get set of cells which template each contains.
		const cidmap = new Map();// Map<tid, Set<cid>>
		for(const [tid, template] of this.templates.entries()) {
			const cids = new Set();
			for(const cell of template.cells) cids.add(cell.id);
			cidmap.set(tid, cids);
		}
		// find links with missing cell-src or cell-dst.
		const list = [];// [template, link[]][]
		for(const [tid, template] of this.templates.entries()) {
			// get mapping from blockIds to templateIds.
			const tidmap = new Map();// Map<bid, tid>
			for(const block of template.blocks) tidmap.set(block.id, block.templateId);
			// find links pointing to *missing* cell with given id in given template.
			const arr = [];
			for(const link of template.links) {
				const {bid_src, bid_dst, cid_src, cid_dst, tgt_src, tgt_dst} = link;
				const tid_src = (bid_src === ComponentId.THIS_BLOCK) ? tid : tidmap.get(bid_src);
				const tid_dst = (bid_dst === ComponentId.THIS_BLOCK) ? tid : tidmap.get(bid_dst);
				const found_src = cidmap.get(tid_src).has(cid_src);
				const found_dst = cidmap.get(tid_dst).has(cid_dst);
				if(!found_src | !found_dst) arr.push(link);
			}
			if(arr.length > 0) list.push([template, arr]);
		}
		return list;
	}

	deleteLinksInTemplateLinkList(list) {
		for(const [template, links] of list) {
			for(const link of links) {
				template.removeLink(link);
				main.onRootContentChanged_remLink(link);
			}
		}
	}

	verifyLinksCanFindTargets() {
		const deletionList = this.getLinksThatCantFindTargets();
		const promise = new Promise((resolve, reject) => {
			if(deletionList.length === 0) resolve(true);
			else {
				const onsubmit = () => {
					console.debug("<>verifyLinksCanFindTargets submit");
					this.deleteLinksInTemplateLinkList(deletionList);
					main.gameUI.hideLinkDeletionPopup();
					resolve(true);
				};
				const oncancel = () => {
					console.debug("<>verifyLinksCanFindTargets cancel");
					main.gameUI.hideLinkDeletionPopup();
					resolve(false);
				};
				const text = "WARNING - links in the following templates failed to find targets (delete links?):";
				main.gameUI.showLinkDeletionPopup(deletionList, text, onsubmit, oncancel);
			}
		});
		return promise;
	}
};
