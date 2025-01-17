import { VerificationUtil } from "../lib/VerificationUtil"
import { main } from "../Main";
import {
	ComponentId,
	ComponentDimensions,
	Cell,
	Link,
	Text,
} from "./exports";
import { CachedValue_Rendering } from "../CachedValue";

/*
	A Block is a placeholder that refers to some BlockTemplate.
	they are a compact way for data to be stored in blocks,
	as well as allowing allowing convenient updates to templates
	that can be reflected in blocks that use them.
	
	Rather than have their own instance of a template,
	blocks actually share the same BlockTemplate object, so they take turns
	applying their transformation to template contents before drawing or editing.
*/
export class Block {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(...args) {
		this.dimensions	= null;				// ComponentDimensions.
		this.id			= ComponentId.NONE;	// ComponentId		id uniquely identifying item.
		this.templateId	= ComponentId.NONE;	// ComponentId		id uniquely identifying BlockTemplate.
		// constructor overloads.
		const _INDEX = VerificationUtil.getConstructorOverloadIndex_throw(args, [
			[],
			[ComponentDimensions, Number],
		]);
		if(_INDEX === 1) {
			const [dim, templateId] = args;
			this.dimensions	= dim;
			this.id			= ComponentId.next();
			this.templateId	= templateId;
		}
	}
	
	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	
	save() {
		const { dimensions, id, templateId } = this;
		return {
			dim: dimensions.save(),
			id, templateId
		};
	}
	static load(obj) {
		const newobj = new Block();
		Object.assign(newobj, obj);
		newobj.dimensions = ComponentDimensions.load(obj.dim);
		return newobj;
	}
	clone() {
		return Block.load(this.save());
	}
	
	// ============================================================
	// Delegate methods.
	// ------------------------------------------------------------
	
	get template() { return main.blockLibrary.templates.get(this.templateId); }
	get templateWidth () { return this.template.width; }
	get templateHeight() { return this.template.height; }
	set templateWidth (value) { this.template.width  = value; }
	set templateHeight(value) { this.template.height = value; }
	get cells () { return this.template.cells; }
	get links () { return this.template.links; }
	get texts () { return this.template.texts; }
	get blocks() { return this.template.blocks; }
	
	// ============================================================
	// Item creation and deletion
	// ------------------------------------------------------------
	
	// TODO: these functions should probably go in BlockTemplate instead...
	
	insertCell (item) { VerificationUtil.verifyType_throw(item, Cell ); 									this.template.insertCell (item); CachedValue_Rendering.onChange(); main.onRootContentChanged_addCell (item); return item; }
	insertLink (item) { VerificationUtil.verifyType_throw(item, Link ); this.cleanupBeforeInsertLink(item); this.template.insertLink (item); CachedValue_Rendering.onChange(); main.onRootContentChanged_addLink (item); return item; }
	insertText (item) { VerificationUtil.verifyType_throw(item, Text ); 									this.template.insertText (item); CachedValue_Rendering.onChange(); 											 return item; }
	insertBlock(item) { VerificationUtil.verifyType_throw(item, Block); 									this.template.insertBlock(item); CachedValue_Rendering.onChange(); main.onRootContentChanged_addBlock(item); return item; }
	
	deleteCell (item) { VerificationUtil.verifyType_throw(item, Cell );
		this.cleanupBeforeDeleteCell(item).then((confirmed) => {
			console.debug("<>deleteCell() confirmed", confirmed);
			if(!confirmed) return;
			this.template.removeCell (item); CachedValue_Rendering.onChange(); main.onRootContentChanged_remCell (item);
		});
	}
	deleteLink (item) { VerificationUtil.verifyType_throw(item, Link ); 												this.template.removeLink (item); CachedValue_Rendering.onChange(); main.onRootContentChanged_remLink (item); }
	deleteText (item) { VerificationUtil.verifyType_throw(item, Text ); 												this.template.removeText (item); CachedValue_Rendering.onChange(); 											 }
	deleteBlock(item) { VerificationUtil.verifyType_throw(item, Block); this.cleanupBeforeDeleteBlock(item);			this.template.removeBlock(item); CachedValue_Rendering.onChange(); main.onRootContentChanged_remBlock(item); }
	
	cleanupBeforeInsertLink(link) {
		// since blocks do not contain themselves,
		// we can assume matching block id means the link targets this block.
		if(link.bid_src === this.id) link.bid_src = ComponentId.THIS_BLOCK;
		if(link.bid_dst === this.id) link.bid_dst = ComponentId.THIS_BLOCK;
		// check if link with matching input target is already present. (if so, replace link.)
		for(const other of this.links) if(Link.hasSameDstTarget(link, other)) {
			this.deleteLink(other);
			main.onRootContentChanged_remLink(other);
			break;
		}
	}
	
	cleanupBeforeDeleteBlock(block) {
		for(const link of this.links.slice()) if(link.isConnectedToBlock(block.id)) this.deleteLink(link);
	}
	
	cleanupBeforeDeleteCell(cell) {
		/*
			other templates may have links that point at this cell.
			this code gathers links from said templates which
			would have to be deleted (for linking consistency) if the cell is deleted.
		*/
		const tid = this.templateId;
		const cid = cell.id;
		const includeSelf = false;
		const deletionList = main.blockLibrary.getLinksThatPointToCellInTemplate(tid, cid, includeSelf);
		console.debug("deletionList", deletionList);
		// show popup.
		const promise = new Promise((resolve, reject) => {
			console.debug("<>cleanupBeforeDeleteCell promise", deletionList);
			if(deletionList.length === 0) {
				resolve(true);
			}
			else {
				const onsubmit = () => {
					console.debug("<>cleanupBeforeDeleteCell submit");
					main.blockLibrary.deleteLinksInTemplateLinkList(deletionList);
					main.gameUI.hideLinkDeletionPopup();
					resolve(true);
				};
				const oncancel = () => {
					console.debug("<>cleanupBeforeDeleteCell cancel");
					main.gameUI.hideLinkDeletionPopup();
					resolve(false);
				};
				const text = "WARNING - links in the following templates will also be deleted:";
				main.gameUI.showLinkDeletionPopup(deletionList, text, onsubmit, oncancel);
			}
		}).then(confirmed => {
			// delete links in this block which point to cell.
			// TODO: link.isConnectedToCell(cell.id) needs to be improved --> what if child template has cell with same Id!
			if(confirmed) for(const link of this.links.slice()) if(link.isConnectedToCell(cell.id)) this.deleteLink(link);
			return confirmed;
		});
		return promise;
	}
	
};



