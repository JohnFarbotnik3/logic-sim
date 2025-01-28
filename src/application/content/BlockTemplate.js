import { VerificationUtil } from "../lib/VerificationUtil"
import { ComponentId } from "./ComponentId"
import { Cell } from "./Cell";
import { Link } from "./Link";
import { Text } from "./Text";
import { Block } from "./Block";

/*
	A BlockTemplate stores the actual implementation of a logic block,
	and may contain items such as cells, links, and texts,
	as well as BlockInstance(s), which may refer to some other BlockTemplate.
	
	The same BlockTemplate object may be shared by many blocks simultaneously -
	since they wont actually have their own instance - so they will have to share.
	
	Note: to prevent infinite recursion, templates cannot contain themselves.
*/
export class BlockTemplate {
	// ============================================================
	// Structors
	// ------------------------------------------------------------
	
	constructor(...args) {
		this.templateId	= ComponentId.NONE;	// ComponentId	id uniquely identifying BlockTemplate.
		this.name		= "";				// String
		this.desc		= "";				// String
		this.width		= 0;				// u32			internal width  of template.
		this.height		= 0;				// u32			internal height of template.
		this.placeW		= 0;				// u32			default width  of block when placed.
		this.placeH		= 0;				// u32			default height of block when placed.
		this.cells		= [];				// Cell[]
		this.links		= [];				// Link[]
		this.texts		= [];				// Text[]
		this.blocks		= [];				// Block[]
		// constructor overloads.
		const _INDEX = VerificationUtil.getConstructorOverloadIndex_throw(args, [
			[],
			[Number, Number],
		]);
		if(_INDEX === 1) {
			const [width, height] = args;
			this.templateId	= ComponentId.next();
			this.width		= width;
			this.height		= height;
			this.placeW		= width / 4;
			this.placeH		= height / 4;
			this.name		= "NAME_" + this.templateId;
			this.desc		= "DESCRIPTION";
		}
	}
	
	// ============================================================
	// Serialization
	// ------------------------------------------------------------
	
	save() {
		const {
			cells, links, texts, blocks, 
			templateId, width, height, placeW, placeH, name, desc,
		} = this;
		const arrc = []; for(const item of cells ) arrc.push(item.save());
		const arrl = []; for(const item of links ) arrl.push(item.save());
		const arrt = []; for(const item of texts ) arrt.push(item.save());
		const arrb = []; for(const item of blocks) arrb.push(item.save());
		return {
			templateId, width, height, placeW, placeH, name, desc,
			cells : arrc,
			links : arrl,
			texts : arrt,
			blocks: arrb,
		};
	}
	static load(obj) {
		const {
			templateId, width, height, placeW, placeH, name, desc,
			cells,
			links,
			texts,
			blocks, 
		} = obj;
		const newobj = new BlockTemplate(width, height);
		newobj.templateId	= templateId;
		newobj.name			= name;
		newobj.desc			= desc;
		newobj.placeW		= placeW;
		newobj.placeH		= placeH;
		for(const itemobj of cells ) newobj.cells .push(Cell .load(itemobj));
		for(const itemobj of links ) newobj.links .push(Link .load(itemobj));
		for(const itemobj of texts ) newobj.texts .push(Text .load(itemobj));
		for(const itemobj of blocks) newobj.blocks.push(Block.load(itemobj));
		return newobj;
	}
	
	// ============================================================
	// Content accessors
	// ------------------------------------------------------------
	
	insertItem(list, item) { list.push(item); }
	removeItem(list, item) {
		for(let i=0;i<list.length;i++) if(list[i].id === item.id) {
			list[i] = list[list.length-1];
			list.pop();
		}
	}
	insertCell (item) { this.insertItem(this.cells , item); }
	insertLink (item) { this.insertItem(this.links , item); }
	insertText (item) { this.insertItem(this.texts , item); }
	insertBlock(item) { this.insertItem(this.blocks, item); }
	removeCell (item) { this.removeItem(this.cells , item); }
	removeLink (item) { this.removeItem(this.links , item); }
	removeText (item) { this.removeItem(this.texts , item); }
	removeBlock(item) { this.removeItem(this.blocks, item); }
	get_cell (id) { return this.cells .find(item => item.id === id);}
	get_link (id) { return this.links .find(item => item.id === id);}
	get_text (id) { return this.texts .find(item => item.id === id);}
	get_block(id) { return this.blocks.find(item => item.id === id);}
	
};
