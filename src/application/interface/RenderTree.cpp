#include "../lib/VectorND.cpp"
#include "../lib/Rectangle.cpp"
#include "../content/BlockWT.cpp"
#include "../content/BlockTemplate.cpp"
#include "../content/BlockTemplateLibrary.cpp"
#include "../content/Link.cpp"

struct RenderTree {

	// ============================================================
	// Constants.
	// ------------------------------------------------------------

	static constexpr Vector3D LINK_POINTS[3] {
		Vector3D{1.00, 0.50, 0.00},	// output
		Vector3D{0.00, 0.75, 0.00},	// input-a
		Vector3D{0.00, 0.25, 0.00},	// input-b
	};

	static constexpr Rectangle LINK_POINT_RECTS[3] {
		Rectangle{LINK_POINTS[0].x-0.1, LINK_POINTS[0].y-0.1, 0.2, 0.2},
		Rectangle{LINK_POINTS[1].x-0.1, LINK_POINTS[1].y-0.1, 0.2, 0.2},
		Rectangle{LINK_POINTS[2].x-0.1, LINK_POINTS[2].y-0.1, 0.2, 0.2},
	};

	static constexpr Rectangle CELL_AREA_RECTS[3] {
		Rectangle{0.5, 0.0, 0.5, 1.0},	// OUTPUT
		Rectangle{0.0, 0.5, 0.5, 0.5},	// INPUT_A
		Rectangle{0.0, 0.0, 0.5, 0.5},	// INPUT_B
	};

	// ============================================================
	// Data.
	// ------------------------------------------------------------

	const BlockTemplateLibrary* library;
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
	Array<Vector3D, 3> get_link_points(ItemId cid) const {
		Transformation2D itran = this->itemTrans.at(cid);
		Array<Vector3D, 3> points = { LINK_POINTS[0], LINK_POINTS[1], LINK_POINTS[2] };
		itran.apply(points.data(), 0, 3);
		return points;
	}

	// returns link point based on link-address in render-block.
	Vector3D get_link_point(LinkAddress addr) const {
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

	struct TargetIdSet {
		Set<ItemId> out;
		Set<ItemId> ina;
		Set<ItemId> inb;
	};
	TargetIdSet getValidCellTargets(const BlockTemplate& btmp, bool isRootBlock) const {
		// add cell targets.
		TargetIdSet targets;
		for(const auto& [id, cell] : btmp.cells) {
			targets.out.insert(cell.id);
			const int n = cell.numTargets;
			if(n >= 2) targets.ina.insert(cell.id);
			if(n >= 3) targets.inb.insert(cell.id);
		}
		// remove targets that are already bound by links in this block.
		// (this prevents parent from connecting a second output to an already linked input.)
		if(!isRootBlock) {
			for(const auto& [id, link] : btmp.links) {
				const LinkTarget tgt = link.dst.tgt;
				const ItemId cid = link.dst.cid;
				if(tgt == LINK_TARGETS.OUTPUT ) targets.out.erase(cid);
				if(tgt == LINK_TARGETS.INPUT_A) targets.ina.erase(cid);
				if(tgt == LINK_TARGETS.INPUT_B) targets.inb.erase(cid);
			}
		}
		return targets;
	}

	struct TargetPoint {
		Vector3D point;
		LinkAddress addr;
	};
	Optional<TargetPoint> get_nearst_cell_target(Vector3D cursor_pos, LinkTarget first_tgt) {
		Vector<TargetPoint> tgtpoints;
		const LinkTarget OUT = LINK_TARGETS.OUTPUT;
		const LinkTarget INA = LINK_TARGETS.INPUT_A;
		const LinkTarget INB = LINK_TARGETS.INPUT_B;
		// cell targets in rootBlock can be modified (all targets are valid).
		{
			const ItemId bid = ItemId::THIS_BLOCK;
			const BlockWT blockwt = this->block;
			const auto tgtset = getValidCellTargets(*blockwt.blockTemplate, true);
			for(const ItemId& cid : tgtset.out) { LinkAddress addr(bid, cid, OUT); tgtpoints.push_back(TargetPoint{get_link_point(addr), addr}); }
			for(const ItemId& cid : tgtset.ina) { LinkAddress addr(bid, cid, INA); tgtpoints.push_back(TargetPoint{get_link_point(addr), addr}); }
			for(const ItemId& cid : tgtset.inb) { LinkAddress addr(bid, cid, INB); tgtpoints.push_back(TargetPoint{get_link_point(addr), addr}); }
		}
		// used cell inputs in child-blocks are immutable.
		for(const auto& [id, block] : this->block.blockTemplate->blocks) {
			const ItemId bid = block.id;
			const BlockWT blockwt = this->block.get_child(bid);
			const auto tgtset = getValidCellTargets(*blockwt.blockTemplate, false);
			for(const ItemId& cid : tgtset.out) { LinkAddress addr(bid, cid, OUT); tgtpoints.push_back(TargetPoint{get_link_point(addr), addr}); }
			for(const ItemId& cid : tgtset.ina) { LinkAddress addr(bid, cid, INA); tgtpoints.push_back(TargetPoint{get_link_point(addr), addr}); }
			for(const ItemId& cid : tgtset.inb) { LinkAddress addr(bid, cid, INB); tgtpoints.push_back(TargetPoint{get_link_point(addr), addr}); }
		}
		// find target closest to cursor.
		Optional<TargetPoint> nearest;
		float dist = 1.0e20f;// NOTE: large magic float.
		for(const TargetPoint& tp :tgtpoints) {
			if(first_tgt == LINK_TARGETS.NONE || LINK_TARGETS.canLinkTargets(first_tgt, tp.addr.tgt)) {
				float dx = tp.point.x - cursor_pos.x;
				float dy = tp.point.y - cursor_pos.y;
				float dz = tp.point.z - cursor_pos.z;
				float dd = dx*dx + dy*dy + dz*dz;
				if(dd < dist) {
					nearest = tp;
					dist = dd;
				}
			}
		}
		return nearest;
	}
};
