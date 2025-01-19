
import { StringSerializer } from "../lib/StringSerializer";
import {
	ComponentId,
	ComponentDimensions,
	Cell,
	Link,
	Text,
	Block,
	BlockTemplate,
	BlockTemplateLibrary,
} from "./exports";

export class ItemSerializer extends StringSerializer {

	constructor(msg) {
		super(msg);
	}

	push_item_id(id) {
		this.push_number(id);
	}

	push_item_dim(dim) {
		this.push_number(dim.x);
		this.push_number(dim.y);
		this.push_number(dim.w);
		this.push_number(dim.h);
		this.push_number(dim.r);
	}

	temp_u32_array = new Uint32Array(1);
	push_u32(value) {
		this.temp_u32_array[0] = value;
		this.push_number(this.temp_u32_array[0]);
	}

	push_item_clr(clr) {
		this.push_u32(clr);
	}

	push_cell(cell) {
		this.push_item_id	(cell.id);
		this.push_u32		(cell.type);
		this.push_u32		(cell.value);
		this.push_item_dim	(cell.dimensions);
	}

	push_link_address(addr) {
		this.push_item_id(addr.bid);
		this.push_item_id(addr.cid);
		this.push_number (addr.tgt);
	}

	push_link(link) {
		this.push_item_id(link.id);
		this.push_link_address({bid: link.bid_src, cid: link.cid_src, tgt: link.tgt_src });
		this.push_link_address({bid: link.bid_dst, cid: link.cid_dst, tgt: link.tgt_dst });
		this.push_item_clr(link.clr);
	}

	push_text(text) {
		this.push_item_dim	(text.dimensions);
		this.push_item_id	(text.id);
		this.push_string	(text.str);
		this.push_number	(text.fhgt);
		this.push_item_clr	(text.fclr);
		this.push_item_clr	(text.bclr);
		this.push_item_clr	(text.oclr);
	}

	push_block(block) {
		this.push_item_id(block.id);
		this.push_item_id(block.templateId);
		this.push_item_dim(block.dimensions);
	}

	push_block_template(btmp) {
		console.log("push_block_template", btmp);
		this.push_item_id(btmp.templateId);
		this.push_string(btmp.name);
		this.push_string(btmp.desc);
		this.push_number(btmp.width);
		this.push_number(btmp.height);
		this.push_number(btmp.placeW);
		this.push_number(btmp.placeH);
		this.push_number(btmp.cells .length);
		this.push_number(btmp.links .length);
		this.push_number(btmp.texts .length);
		this.push_number(btmp.blocks.length);
		for(const item of btmp.cells ) this.push_cell (item);
		for(const item of btmp.links ) this.push_link (item);
		for(const item of btmp.texts ) this.push_text (item);
		for(const item of btmp.blocks) this.push_block(item);
	}

	push_block_library(library) {
		this.push_number(library.templates.size);
		for(const [id, btmp] of library.templates.entries()) this.push_block_template(btmp);
	}
};
