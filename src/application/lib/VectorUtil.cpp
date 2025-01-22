#include "./VectorND.cpp"
#include "./Transformation2D.cpp"
#include "../Imports.cpp"

struct VectorUtil {
	struct AABB { Vector2D min,max; };

	static AABB get_axis_aligned_bounding_box(const Vector2D* points, int beg, int end) {
		if(beg >= end) return AABB();
		AABB aabb { points[beg], points[beg] };
		for(int i=beg+1;i<end;i++) {
			const Vector2D& p = points[i];
			aabb.min = Vector2D{ std::min(aabb.min.x, p.x), std::min(aabb.min.y, p.y) };
			aabb.max = Vector2D{ std::max(aabb.max.x, p.x), std::max(aabb.max.y, p.y) };
		}
		return aabb;
	}

	static AABB get_axis_aligned_bounding_box(Transformation2D itemTran) {
		Array<Vector2D, 4> points = {
			Vector2D{0,0},
			Vector2D{1,0},
			Vector2D{1,1},
			Vector2D{0,1},
		};
		itemTran.apply(points.data(), 0, 4);
		return get_axis_aligned_bounding_box(points.data(), 0, 4);
	}

	static bool collision_aabb_aabb_2d(AABB a, AABB b) {
		return !(
			(a.min.x > b.max.x) |
			(a.min.y > b.max.y) |
			(a.max.x < b.min.x) |
			(a.max.y < b.min.y)
		);
	}
};
