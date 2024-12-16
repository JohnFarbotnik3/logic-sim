
/*
	A Block is a placeholder that refers to some BlockTemplate.
	they are a compact way for data to be stored in blocks,
	as well as allowing allowing convenient updates to templates
	that can be reflected in blocks that use them.
	
	Rather than have their own instance of a template,
	blocks actually share the same BlockTemplate object, so they take turns
	applying their transformation to template contents before drawing or editing.
*/
class Block {
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
		const {
			dimensions,
			id, templateId
		} = this;
		return {
			dimensions: dimensions.save(),
			id, templateId
		};
	}
	static load(obj) {
		const newobj = new Block();
		Object.assign(newobj, obj);
		newobj.dimensions = ComponentDimensions.load(obj.dimensions);
		return newobj;
	}
	clone() {
		return Block.load(this.save());
	}
	
	// ============================================================
	// Delegate methods.
	// ------------------------------------------------------------
	
	get template() {
		const template = gameData.blockTemplates.get(this.templateId);
		VerificationUtil.verifyType_throw(template, BlockTemplate);
		return template;
	}
	
	get templateWidth () { return this.template.width; }
	get templateHeight() { return this.template.height; }
	set templateWidth (value) { this.template.width  = value; }
	set templateHeight(value) { this.template.height = value; }
	get cells () { return this.template.cells; }
	get links () { return this.template.links; }
	get texts () { return this.template.texts; }
	get blocks() { return this.template.blocks; }
	//getCellById (id) { return this.template.getCellById(id); }
	//getBlockById(id) { return id === ComponentId.THIS_BLOCK ? this : this.template.getBlockById(id); }
	
	// ============================================================
	// Item creation and deletion
	// ------------------------------------------------------------
	
	insertCell (item) { VerificationUtil.verifyType_throw(item, Cell ); 									this.template.insertCell (item); CachedValue_Content.onChange(); simulation.onContentChanged_addCell (item); return item; }
	insertLink (item) { VerificationUtil.verifyType_throw(item, Link ); this.cleanupBeforeInsertLink(item); this.template.insertLink (item); CachedValue_Content.onChange(); simulation.onContentChanged_addLink (item); return item; }
	insertText (item) { VerificationUtil.verifyType_throw(item, Text ); 									this.template.insertText (item); CachedValue_Content.onChange(); 											 return item; }
	insertBlock(item) { VerificationUtil.verifyType_throw(item, Block); 									this.template.insertBlock(item); CachedValue_Content.onChange(); simulation.onContentChanged_addBlock(item); return item; }
	
	deleteCell (item) { VerificationUtil.verifyType_throw(item, Cell );	this.cleanupBeforeDeleteCell(item).then((confirmed) => {
		if(!confirmed) return;
		this.template.removeCell (item); CachedValue_Content.onChange(); simulation.onContentChanged_remCell (item);
	}); }
	deleteLink (item) { VerificationUtil.verifyType_throw(item, Link ); 												this.template.removeLink (item); CachedValue_Content.onChange(); simulation.onContentChanged_remLink (item); }
	deleteText (item) { VerificationUtil.verifyType_throw(item, Text ); 												this.template.removeText (item); CachedValue_Content.onChange(); 											 }
	deleteBlock(item) { VerificationUtil.verifyType_throw(item, Block); this.cleanupBeforeDeleteBlock(item);			this.template.removeBlock(item); CachedValue_Content.onChange(); simulation.onContentChanged_remBlock(item); }
	
	cleanupBeforeInsertLink(link) {
		// since blocks do not contain themselves,
		// we can assume matching block id means the link targets this block.
		if(link.bid_src === this.id) link.bid_src = ComponentId.THIS_BLOCK;
		if(link.bid_dst === this.id) link.bid_dst = ComponentId.THIS_BLOCK;
		// check if link with matching input target is already present. (if so, replace link.)
		for(const other of this.links) if(Link.hasSameDstTarget(link, other)) {
			this.deleteLink(other);
			simulation.onContentChanged_remLink(other);
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
		const includeSelf = false;
		const deletionList = gameData.getLinksThatPointToCellInTemplate(this.templateId, cell.id, includeSelf);
		console.debug("deletionList", deletionList);
		const promise = new Promise((resolve, reject) => {
			const onsubmit = () => {
				console.debug("deletionList submit");
				for(const link of this.links.slice()) if(link.isConnectedToCell(cell.id)) this.deleteLink(link);
				gameData.deleteLinksInTemplateLinkList(deletionList);
				resolve(true);
				return true;
			};
			const oncancel = () => {
				console.debug("deletionList cancel");
				resolve(false);
			};
			const text = "WARNING - links in the following templates will also be deleted:";
			if(deletionList.length > 0)	GameUI.showLinkDeletionPopup(deletionList, text, onsubmit, oncancel);
			else						onsubmit();
		});
		return promise;
	}
	
};



