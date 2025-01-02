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

// TODO: move relevant code from other places into here.
// ^ see c++ implementation for inspiration on what belongs here.
export class BlockTemplateLibrary {

	constructor() {
		// list of block templates in this library.
		this.templates = new Map();// Map<templateId, BlockTemplate>
		// template currently being edited.
		this.rootBlock = null;
	}

	// ============================================================
	// Content logistics
	// ------------------------------------------------------------

	/*
		returns a map with the number of instances of all templates that appear
		in this BlockTemplate's tree (including itself).
	*/
	_countUsedTemplates_cache = new Map();// Map<templateId>
	_countUsedTemplates(templateId) {
		// check cache.
		if(this._countUsedTemplates_cache.has(templateId)) return this._countUsedTemplates_cache.get(templateId);
		// add self to use-count.
		const used = new Map();// Map<templateId, count>
		used.set(templateId, 1);
		// sum child template use-counts.
		const template = this.templates.get(templateId);
		for(const block of template.blocks) {
			const map = this._countUsedTemplates(block.templateId);
			for(const [tid,num] of map.entries()) used.set(tid, (used.get(tid) ?? 0) + num);
		}
		// add to cache and return.
		this._countUsedTemplates_cache.set(templateId, used);
		return used;
	}
	countUsedTemplates(templateId) {
		if(!templateId) throw("missing templateId");
		this._countUsedTemplates_cache.clear();
		return this._countUsedTemplates(templateId);
	}

	containsTemplate(templateId, tid) {
		return this.countUsedTemplates(templateId).has(tid);
	}
	containsTemplateDirectly(templateId, tid) {
		const template = this.templates.get(templateId);
		for(const block of template.blocks) if(tid === block.templateId) return true;
		return false;
	}
	containsRootTemplate(templateId) {
		return this.containsTemplate(templateId, this.rootBlock.templateId);
	}

	// ============================================================
	// Template management
	// ------------------------------------------------------------

	set_root_block_template(templateId) {
		const template = this.templates.get(templateId);
		this.rootBlock = new Block(new ComponentDimensions(0, 0, template.width, template.height, 0), template.templateId);
	}
	refresh_root_block_template(templateId) {
		const template = this.templates.get(templateId);
		this.rootBlock = new Block(new ComponentDimensions(0, 0, template.width, template.height, 0), template.templateId);
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
		const deps = [];// [template, useCount, direct][]
		for(const [tid, template] of this.templates.entries()) {
			if(tid !== templateId) {
				const used = this.countUsedTemplates(tid);
				if(used.has(templateId)) {
					const useCount = used.get(templateId);
					const direct = this.containsTemplateDirectly(tid, templateId);
					deps.push([template, useCount, direct]);
				}
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

	// ============================================================
	// Import, Export
	// ------------------------------------------------------------

	exportTemplates() {
		let arr = [];
		for(const [tid, template] of this.templates.entries()) {
			arr.push(template.save());
		}
		return JSON.stringify(arr);
	}

	importTemplates(json) {
		const value = json;
		if(json.trim().length > 0) try {
			const templates = [];
			const arr = JSON.parse(value.trim());
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
	// Link Utils
	// ------------------------------------------------------------

	get_link_point(blockId, cell, tgt) {
		VerificationUtil.verifyType_throw(cell, Cell);
		let renblock = main.gameRenderer.renderBlock;
		if(blockId !== ComponentId.THIS_BLOCK && blockId !== this.rootBlock.id) renblock = renblock.children.get(blockId);
		const points = renblock.c_points.get(cell.id);
		VerificationUtil.verifyType_throw(points, Float32Array);
		return points.slice(tgt*3, tgt*3+3);
	}

	get_all_cell_targets() {
		const targets = [];
		const OUT = Cell.LINK_TARGET.OUTPUT;
		const INA = Cell.LINK_TARGET.INPUT_A;
		const INB = Cell.LINK_TARGET.INPUT_B;
		// cell targets in rootBlock can be modified (all targets are valid).
		{
			const block = this.rootBlock;
			const {out, ina, inb} = block.template.getValidCellTargets(true);
			const blockId = block.id;// NOTE: new link insertion code checks this.
			let tgt;
			tgt=OUT; for(const cell of out.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INA; for(const cell of ina.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INB; for(const cell of inb.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
		}
		// used cell inputs in child-blocks are immutable.
		for(const block of this.templates.get(this.rootBlock.templateId).blocks) {
			const {out, ina, inb} = block.template.getValidCellTargets(false);
			const blockId = block.id;
			let tgt;
			tgt=OUT; for(const cell of out.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INA; for(const cell of ina.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INB; for(const cell of inb.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
		}
		return targets;
	}

	get_nearst_cell_target(targets, cursor_pos, first_target) {
		if(targets.length <= 0) return null;
		let ind		= 0;
		let dist	= -1;
		let valid	= false;
		for(let i=0;i<targets.length;i++) {
			const [point, bid, cid, tgt] = targets[i];
			if(first_target === Cell.LINK_TARGET.NONE || Cell.canLinkTargets(first_target, tgt)) {
				const d = cursor_pos.add(point, -1.0).hypotSquared();
				if(d < dist | !valid) { ind=i; dist=d; valid=true; }
			}
		}
		return targets[ind];
	}

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
				if((tid_src === tid & cid_src === cid) | (tid_dst === tid & cid_dst === cid)) arr.push(link);
			}
			if(arr.length > 0) list.push([template, arr]);
		}
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
			const onsubmit = () => {
				this.deleteLinksInTemplateLinkList(deletionList);
				resolve(true);
				return true;
			};
			const oncancel = () => {
				resolve(false);
				return true;
			};
			const text = "WARNING - links in the following templates failed to find targets (delete links?):";
			if(deletionList.length > 0)	main.gameUI.showLinkDeletionPopup(deletionList, text, onsubmit, oncancel);
			else						onsubmit();
		});
		return promise;
	}
};
