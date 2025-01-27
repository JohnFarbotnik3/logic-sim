#include "../lib/Vec.cpp"
#include "../lib/Transformation2D.cpp"
#include "../lib/EquationUtil.cpp"
#include "../Imports.cpp"
#include "./RenderTree.cpp"

struct GameControls {
	// ============================================================
	// Collision detection.
	// ------------------------------------------------------------

	struct AABB_2D { Vec2 min,max; };

	static AABB_2D get_axis_aligned_bounding_box(const Vec2* points, int beg, int end) {
		if(beg >= end) return AABB_2D();
		AABB_2D aabb { points[beg], points[beg] };
		for(int i=beg+1;i<end;i++) {
			const Vec2& p = points[i];
			aabb.min = Vec2{ std::min(aabb.min[0], p[0]), std::min(aabb.min[1], p[1]) };
			aabb.max = Vec2{ std::max(aabb.max[0], p[0]), std::max(aabb.max[1], p[1]) };
		}
		return aabb;
	}

	static AABB_2D get_axis_aligned_bounding_box(Transformation2D itemTran) {
		Array<Vec2, 4> points = {
			Vec2{0,0},
			Vec2{1,0},
			Vec2{1,1},
			Vec2{0,1},
		};
		itemTran.apply(points.data(), 0, 4);
		return get_axis_aligned_bounding_box(points.data(), 0, 4);
	}

	static bool collision_aabb_aabb(AABB_2D a, AABB_2D b) {
		return !(
			(a.min[0] > b.max[0]) |
			(a.min[1] > b.max[1]) |
			(a.max[0] < b.min[0]) |
			(a.max[1] < b.min[1])
		);
	}

	static Optional<Vec2> collision_line_line_2d(Vec2 pos_a, Vec2 dir_a, Vec2 pos_b, Vec2 dir_b) {
		const int N = 2;
		const int W = 3;
		const int H = 2;
		EquationMatrix<float, W, H> matrix;
		Array<float, N> result;
		for(int d=0;d<N;d++) {
			matrix.set(0, d,  dir_a[d]);
			matrix.set(1, d, -dir_b[d]);
			matrix.set(2, d,  pos_b[d] - pos_a[d]);
		}
		const bool success = EquationUtil::trySolveSystemOfEquations_NxN<float, W, H, N>(matrix, result);
		if(!success) return Optional<Vec2>();
		else return Optional<Vec2>(Vec2{ result[0], result[1] });
	}

	static Optional<Vec2> nearestPoint_point_line_2d(Vec2 point, Vec2 linePointA, Vec2 linePointB) {
		const Vec2 line_dir = linePointB - linePointA;
		const Vec2 norm_dir = Vec2{ -line_dir[1], line_dir[0] };
		return collision_line_line_2d(point, norm_dir, linePointA, line_dir);
	}

	static Vec2 nearestPoint_point_line_segment_2d(Vec2 point, Vec2 linePointA, Vec2 linePointB) {
		const auto result = nearestPoint_point_line_2d(point, linePointA, linePointB);
		// if no intersect was found, return closest endpoint.
		const float distanceA = (point - linePointA).hypot();
		const float distanceB = (point - linePointB).hypot();
		const Vec2 nearest = (distanceA <= distanceB) ? linePointA : linePointB;
		if(!result.has_value()) return nearest;
		// get distance to line-intersect.
		const Vec2 intersect = result.value();
		const float distanceL = (point - intersect).hypot();
		// check if intersect is within line segment,
		// and return it if so (since it will be closest to point).
		const Vec2 linepoints[2]{ linePointA, linePointB };
		const AABB_2D aabb = get_axis_aligned_bounding_box(linepoints, 0, 2);
		const bool isWithinSegmentBounds = !(
			(intersect[0] < aabb.min[0]) | (intersect[0] > aabb.max[0]) |
			(intersect[1] < aabb.min[1]) | (intersect[1] > aabb.max[1])
		);
		return isWithinSegmentBounds ? intersect : nearest;
	}

	// ============================================================
	// Hover and Selection.
	// ------------------------------------------------------------

	struct ItemCollection {
		Set<ItemId> cells;
		Set<ItemId> links;
		Set<ItemId> texts;
		Set<ItemId> blocks;
	};

	bool is_item_in_aabb(const RenderTree& rendertree, const AABB_2D& aabb, ItemId id) {
		const Transformation2D& itran = rendertree.itemTrans.at(id);
		const AABB_2D item_aabb = get_axis_aligned_bounding_box(itran);
		return collision_aabb_aabb(aabb, item_aabb);
	}

	ItemCollection get_items_in_aabb(const BlockWT& rootBlock, const AABB_2D& aabb) {
		const RenderTree rendertree(rootBlock, Transformation2D(), 0);
		ItemCollection ids;
		for(const auto& [id, item] : rootBlock.blockTemplate->cells ) if(is_item_in_aabb(rendertree, aabb, id)) ids.cells .insert(item.id);
		for(const auto& [id, item] : rootBlock.blockTemplate->texts ) if(is_item_in_aabb(rendertree, aabb, id)) ids.texts .insert(item.id);
		for(const auto& [id, item] : rootBlock.blockTemplate->blocks) if(is_item_in_aabb(rendertree, aabb, id)) ids.blocks.insert(item.id);
		return ids;
	}

	ItemCollection get_items_in_selection_area(const BlockWT& rootBlock, float x0, float y0, float x1, float y1) {
		const AABB_2D aabb{
			Vec2{x0,y0},
			Vec2{x1,y1},
		};
		return get_items_in_aabb(rootBlock, aabb);
	}

	ItemCollection get_items_in_hover_area(const BlockWT& rootBlock, float cx, float cy, float cr) {
		const AABB_2D aabb{
			Vec2{cx - cr, cy - cr},
			Vec2{cx + cr, cy + cr},
		};
		return get_items_in_aabb(rootBlock, aabb);
	}

	ItemCollection get_links_in_within_cursor_radius(const BlockWT& rootBlock, float cx, float cy, float cr) {
		const RenderTree rendertree(rootBlock, Transformation2D(), 0);
		ItemCollection ids;
		for(const auto& [id, item] : rootBlock.blockTemplate->links) {
			const Vec3 a = rendertree.get_link_point(item.src);
			const Vec3 b = rendertree.get_link_point(item.dst);
			const Vec2 pointA{ a[0], a[1] };
			const Vec2 pointB{ b[0], b[1] };
			const Vec2 pointC{ cx, cy };
			const Vec2 nearest = nearestPoint_point_line_segment_2d(pointC, pointA, pointB);
			const bool within_radius = (nearest - Vec2{cx, cy}).hypsq() < cr*cr;
			if(within_radius) ids.links.insert(item.id);
		}
		return ids;
	}

};
