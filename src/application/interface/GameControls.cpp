#include "../lib/Vec.cpp"
#include "../lib/Transformation2D.cpp"
#include "../lib/SystemOfEquations.cpp"
#include "../Imports.cpp"
#include "./RenderTree.cpp"
#include "../content/ItemCollection.cpp"

struct GameControls {
	// ============================================================
	// Collision detection.
	// ------------------------------------------------------------

	template<int N>
	struct AABB {
		using VecN = Vec<float, N>;
		VecN min,max;

		AABB(VecN p) {
			min = p;
			max = p;
		}
		AABB(VecN a, VecN b) {
			for(int x=0;x<N;x++) min[x] = std::min(a[x], b[x]);
			for(int x=0;x<N;x++) max[x] = std::max(a[x], b[x]);
		}
		void add_point(VecN b) {
			for(int x=0;x<N;x++) min[x] = std::min(min[x], b[x]);
			for(int x=0;x<N;x++) max[x] = std::max(max[x], b[x]);
		}
		AABB(VecN* points, int beg, int end) {
			min = points[beg];
			max = points[beg];
			for(int i=beg;i<end;i++) add_point(points[i]);
		}
	};

	using AABB_2D = AABB<2>;

	static bool collision_aabb_aabb(AABB_2D a, AABB_2D b) {
		return !(
			(a.min[0] > b.max[0]) |
			(a.min[1] > b.max[1]) |
			(a.max[0] < b.min[0]) |
			(a.max[1] < b.min[1])
		);
	}

	static Optional<Vec2> collision_line_line_2d(Vec2 pos_a, Vec2 dir_a, Vec2 pos_b, Vec2 dir_b) {
		/*
			Solve for A and B:
				pa + A*va = pb + B*vb
			=>	A*va - B*vb = pb - pa

			System:
				vax*A - vbx*B = pbx - pax
				vay*A - vby*B = pby - pay
		*/
		const int N=2, W=3, H=2;
		SystemOfEquations<float, W, H> matrix;
		for(int d=0;d<N;d++) matrix.set(0, d,  dir_a[d]);
		for(int d=0;d<N;d++) matrix.set(1, d, -dir_b[d]);
		for(int d=0;d<N;d++) matrix.set(2, d,  pos_b[d] - pos_a[d]);
		Array<float, N> solution;
		const bool success = matrix.trySolveSystemOfEquations_NxN(solution);
		if(!success) return Optional<Vec2>();
		else {
			const Vec2 sol_a = pos_a + (dir_a * solution[0]);
			const Vec2 sol_b = pos_b + (dir_b * solution[1]);
			assert(sol_a == sol_b);
			return Optional<Vec2>(sol_a);
		}
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
		// check if intersect is within line segment,
		// and return it if so (since it will be closest to point).
		const Vec2 intersect = result.value();
		const AABB_2D aabb(linePointA, linePointB);
		const bool isWithinSegmentBounds = !(
			(intersect[0] < aabb.min[0]) | (intersect[0] > aabb.max[0]) |
			(intersect[1] < aabb.min[1]) | (intersect[1] > aabb.max[1])
		);
		return isWithinSegmentBounds ? intersect : nearest;
	}

	// ============================================================
	// Hover and Selection.
	// ------------------------------------------------------------

	bool is_item_in_aabb(const RenderTree& rendertree, const AABB_2D& area_aabb, ItemId id) {
		const Transformation2D& itemTran = rendertree.itemTrans.at(id);
		Array<Vec2, 4> points = {
			Vec2{0,0},
			Vec2{1,0},
			Vec2{1,1},
			Vec2{0,1},
		};
		itemTran.apply(points.data(), 0, 4);
		AABB_2D item_aabb(points.data(), 0, 4);
		return collision_aabb_aabb(area_aabb, item_aabb);
	}

	ItemCollection get_items_in_aabb(const BlockWT rootBlock, const AABB_2D aabb) {
		const RenderTree rendertree(rootBlock, Transformation2D(), 0);
		ItemCollection ids;
		for(const auto& [id, item] : rootBlock.blockTemplate->cells ) if(is_item_in_aabb(rendertree, aabb, id)) ids.cells .insert(item.id);
		for(const auto& [id, item] : rootBlock.blockTemplate->texts ) if(is_item_in_aabb(rendertree, aabb, id)) ids.texts .insert(item.id);
		for(const auto& [id, item] : rootBlock.blockTemplate->blocks) if(is_item_in_aabb(rendertree, aabb, id)) ids.blocks.insert(item.id);
		return ids;
	}

	ItemCollection get_items_in_selection_area(const BlockWT rootBlock, float x0, float y0, float x1, float y1) {
		const AABB_2D aabb(Vec2{x0,y0}, Vec2{x1,y1});
		return get_items_in_aabb(rootBlock, aabb);
	}

	ItemCollection get_items_in_hover_area(const BlockWT rootBlock, float cx, float cy, float cr) {
		const AABB_2D aabb(Vec2{cx, cy});
		return get_items_in_aabb(rootBlock, aabb);
	}

	ItemCollection get_links_in_within_cursor_radius(const BlockWT rootBlock, float cx, float cy, float cr) {
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
