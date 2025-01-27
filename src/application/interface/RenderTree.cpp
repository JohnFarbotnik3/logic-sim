#ifndef RenderTree_h
#define RenderTree_h

#include "../lib/Vec.cpp"
#include "../lib/Rectangle.cpp"
#include "../content/BlockWT.cpp"
#include "../content/BlockTemplate.cpp"
#include "../content/BlockTemplateLibrary.cpp"
#include "../content/Link.cpp"

struct RenderTree {

	// ============================================================
	// Constants.
	// ------------------------------------------------------------

	static constexpr Vec3 LINK_POINTS[3] {
		Vec3{1.00, 0.50, 0.00},	// output
		Vec3{0.00, 0.75, 0.00},	// input-a
		Vec3{0.00, 0.25, 0.00},	// input-b
	};

	static constexpr Rectangle LINK_POINT_RECTS[3] {
		Rectangle{1.00 - 0.1, 0.50 - 0.1, 0.2, 0.2},
		Rectangle{0.00 - 0.1, 0.75 - 0.1, 0.2, 0.2},
		Rectangle{0.00 - 0.1, 0.25 - 0.1, 0.2, 0.2},
	};

	static constexpr Rectangle CELL_AREA_RECTS[3] {
		Rectangle{0.5, 0.0, 0.5, 1.0},	// OUTPUT
		Rectangle{0.0, 0.5, 0.5, 0.5},	// INPUT_A
		Rectangle{0.0, 0.0, 0.5, 0.5},	// INPUT_B
	};

	// ============================================================
	// Data.
	// ------------------------------------------------------------

	alignas(8) const BlockTemplateLibrary* library;
	BlockWT	block;
	float	depth;
	// item transformation.
	Transformation2D itemTran;
	// content transformation.
	Transformation2D contTran;
	// combined item transformations of contents.
	Map<ItemId, Transformation2D> itemTrans;

	// ============================================================
	// Transformations and geometry.
	// ------------------------------------------------------------

	static Transformation2D get_item_transformation(ItemDim dim, Transformation2D externalTran) {
		const Transformation2D UNIT_SQUARE = Transformation2D(-0.5f, -0.5f, 1, 1, 0);
		return externalTran.compose(dim.getTransformation()).compose(UNIT_SQUARE);
	}

	static Transformation2D get_content_transformation(const BlockWT& block, Transformation2D externalTran) {
		const Transformation2D normalize(0, 0, 1.0f/block.blockTemplate->innerW, 1.0f/block.blockTemplate->innerH, 0);
		return get_item_transformation(block.dim, externalTran).compose(normalize);
	}

	// returns link points of given cell in render-block.
	Array<Vec3, 3> get_link_points(ItemId cid) const {
		Transformation2D itran = this->itemTrans.at(cid);
		Array<Vec3, 3> points = { LINK_POINTS[0], LINK_POINTS[1], LINK_POINTS[2] };
		itran.apply(points.data(), 0, 3);
		return points;
	}

	// returns link point based on link-address in render-block.
	Vec3 get_link_point(LinkAddress addr) const {
		// link point is in this block. (common)
		if(addr.bid == ItemId::THIS_BLOCK) {
			Transformation2D itran = this->itemTrans.at(addr.cid);
			return itran.apply(LINK_POINTS[addr.tgt]);
		}
		// link point is in child block. (rare)
		else {
			const BlockWT& child = block.get_child(addr.bid);
			const ItemDim& dim = child.blockTemplate->cells.at(addr.cid).dim;
			Transformation2D ctran = get_content_transformation(child, this->contTran);
			Transformation2D itran = get_item_transformation(dim, ctran);
			return itran.apply(LINK_POINTS[addr.tgt]);
		}
	}

	// ============================================================
	// Structors.
	// ------------------------------------------------------------

	RenderTree(
		const BlockWT block,
		const Transformation2D etran,
		const int depth
	) {
		assert(block.templateId.value != 0);
		assert(block.blockTemplate != 0);
		// populate fields.
		this->block = block;
		this->depth = depth;
		this->itemTran = get_item_transformation(block.dim, etran);
		this->contTran = get_content_transformation(block, etran);
		// init item transformations.
		for(const auto& [id, item] : block.blockTemplate->cells ) itemTrans[id] = get_item_transformation(item.dim, contTran);
		for(const auto& [id, item] : block.blockTemplate->texts ) itemTrans[id] = get_item_transformation(item.dim, contTran);
		for(const auto& [id, item] : block.blockTemplate->blocks) itemTrans[id] = get_item_transformation(item.dim, contTran);
	}

	RenderTree get_child(ItemId bid) const {
		return RenderTree(block.get_child(bid), this->contTran, depth+1);
	}

	// ============================================================
	// Link Utils
	// ------------------------------------------------------------

	struct TargetPoint {
		Vec3 point;
		LinkAddress addr;
	};
	void push_target_point(Vector<TargetPoint>& tgtpoints, ItemId bid, ItemId cid, LinkTarget tgt) {
		LinkAddress addr(bid, cid, tgt);
		tgtpoints.push_back(TargetPoint{get_link_point(addr), addr});
	}
	void push_valid_cell_targets(Vector<TargetPoint>& tgtpoints, const BlockWT& block, const ItemId bid, bool isRootTemplate) {
		const BlockTemplate& btmp = *block.blockTemplate;
		// get cell targets.
		Set<ItemId> out;
		Set<ItemId> ina;
		Set<ItemId> inb;
		for(const auto& [id, cell] : btmp.cells) {
			if(cell.numTargets >= 1) out.insert(cell.id);
			if(cell.numTargets >= 2) ina.insert(cell.id);
			if(cell.numTargets >= 3) inb.insert(cell.id);
		}
		// remove targets that are already bound by links in this block.
		// (this prevents parent from connecting a second output to an already linked input.)
		// - cell targets in rootBlock can be modified (all targets are valid).
		// - however used cell inputs in child-blocks are immutable.
		if(!isRootTemplate) {
			for(const auto& [id, link] : btmp.links) {
				const LinkTarget tgt = link.dst.tgt;
				const ItemId cid = link.dst.cid;
				if(tgt == LINK_TARGETS.OUTPUT ) out.erase(cid);
				if(tgt == LINK_TARGETS.INPUT_A) ina.erase(cid);
				if(tgt == LINK_TARGETS.INPUT_B) inb.erase(cid);
			}
		}
		// add to list of target points.
		for(const ItemId& cid : out) push_target_point(tgtpoints, bid, cid, LINK_TARGETS.OUTPUT);
		for(const ItemId& cid : ina) push_target_point(tgtpoints, bid, cid, LINK_TARGETS.INPUT_A);
		for(const ItemId& cid : inb) push_target_point(tgtpoints, bid, cid, LINK_TARGETS.INPUT_B);
	}

	Optional<TargetPoint> get_nearst_cell_target(Vec3 cursor_pos, LinkTarget first_tgt) {
		Vector<TargetPoint> tgtpoints;
		push_valid_cell_targets(tgtpoints, this->block, ItemId::THIS_BLOCK, true);
		for(const auto& [id, block] : this->block.blockTemplate->blocks) {
			push_valid_cell_targets(tgtpoints, this->block.get_child(block.id), block.id, false);
		}
		// find target closest to cursor.
		Optional<TargetPoint> nearest;
		float dist = 1.0e20f;// NOTE: large magic float.
		for(const TargetPoint& tp :tgtpoints) {
			if(first_tgt == LINK_TARGETS.NONE || LINK_TARGETS.canLinkTargets(first_tgt, tp.addr.tgt)) {
				float dd = (tp.point - cursor_pos).hypsq();
				if(dd < dist) { dist = dd; nearest = tp; }
			}
		}
		return nearest;
	}
};

#endif
