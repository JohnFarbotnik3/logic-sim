#include "../lib/VectorND.cpp"
#include "../lib/Rectangle.cpp"
#include "../content/Block.cpp"
#include "../content/BlockTemplate.cpp"
#include "../content/BlockTemplateLibrary.cpp"

// TODO:
// - inline this into renderer.
struct RenderBlock {

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
	const BlockTemplate* blockTemplate;
	Block	block;
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

	Transformation2D get_content_transformation(const Block& block, const BlockTemplate& btmp, Transformation2D externalTran) const {
		const Transformation2D normalize(0, 0, 1.0f/btmp.innerW, 1.0f/btmp.innerH, 0);
		const Transformation2D itemTran = get_item_transformation(block.dim, externalTran);
		return itemTran.compose(normalize);
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
			const Block& block = blockTemplate->blocks.at(addr.bid);
			const BlockTemplate& btmp = this->library->templates.at(block.templateId);
			const ItemDim& dim = btmp.cells.at(addr.cid).dim;
			Transformation2D ctran = get_content_transformation(block, btmp, this->contTran);
			Transformation2D itran = get_item_transformation(dim, ctran);
			return itran.apply(LINK_POINTS[addr.tgt]);
		}
	}

	// ============================================================
	// Structors.
	// ------------------------------------------------------------

	RenderBlock(
		const BlockTemplateLibrary* library,
		const Block block,
		const Transformation2D etran,
		const int depth
	) {
		// populate fields.
		this->library = library;
		this->blockTemplate = &(library->templates.at(block.templateId));
		this->block = block;
		this->depth = depth;
		this->itemTran = get_item_transformation(block.dim, etran);
		this->contTran = get_content_transformation(block, *blockTemplate, etran);
		// init item transformations.
		for(const auto& [id, item] : blockTemplate->cells ) itemTrans[id] = get_item_transformation(item.dim, contTran);
		for(const auto& [id, item] : blockTemplate->texts ) itemTrans[id] = get_item_transformation(item.dim, contTran);
		for(const auto& [id, item] : blockTemplate->blocks) itemTrans[id] = get_item_transformation(item.dim, contTran);
	}

	RenderBlock get_child(const Block childBlock) const {
		return RenderBlock(library, childBlock, this->contTran, depth+1);
	}

};
