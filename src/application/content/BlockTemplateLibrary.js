import {
	ComponentId,
	Cell,
} from "./exports";
import { gameData } from "../Main";
import { VerificationUtil } from "../lib/exports";

// TODO: move relevant code from other places into here.
// ^ see c++ implementation for inspiration on what belongs here.
export class BlockTemplateLibrary {

	// ============================================================
	// Link Utils
	// ------------------------------------------------------------

	get_link_point(blockId, cell, tgt) {
		VerificationUtil.verifyType_throw(cell, Cell);
		let renblock = gameData.renderBlock;
		if(blockId !== ComponentId.THIS_BLOCK && blockId !== gameData.rootBlock.id) renblock = renblock.children.get(blockId);
		if(!renblock) console.error(blockId, gameData.renderBlock.children);
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
			const block = gameData.rootBlock;
			const {out, ina, inb} = block.template.getValidCellTargets(true);
			const blockId = block.id;// NOTE: new link insertion code checks this.
			let tgt;
			tgt=OUT; for(const cell of out.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INA; for(const cell of ina.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
			tgt=INB; for(const cell of inb.keys()) targets.push([this.get_link_point(blockId,cell,tgt), blockId, cell.id, tgt]);
		}
		// used cell inputs in child-blocks are immutable.
		for(const block of gameData.rootBlock.blocks) {
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

};
