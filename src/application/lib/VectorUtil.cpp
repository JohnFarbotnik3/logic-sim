#include "./VectorND.cpp"
#include "./Transformation2D.cpp"
#include "../Imports.cpp"

struct VectorUtil {
	struct AABB { Vector2D min,max; };

	template<class V> static AABB get_axis_aligned_bounding_box(const V* points, int beg, int end) {
		if(beg >= end) return AABB();
		AABB aabb { points[beg], points[beg] };
		for(int i=beg+1;i<end;i++) {
			const V& p = points[i];
			aabb.min = V{ std::min(aabb.min.x, p.x), std::min(aabb.min.y, p.y) };
			aabb.max = V{ std::max(aabb.max.x, p.x), std::max(aabb.max.y, p.y) };
		}
		return aabb;
	}

	template<class V> static AABB get_axis_aligned_bounding_box(Transformation2D itemTran) {
		Array<Vector3D, 4> points = {
			Vector3D{0,0,0},
			Vector3D{1,0,0},
			Vector3D{1,1,0},
			Vector3D{0,1,0},
		};
		itemTran.apply(points.data(), 0, 4);
		return get_axis_aligned_bounding_box(points.data(), 0, 4);
	}
};
