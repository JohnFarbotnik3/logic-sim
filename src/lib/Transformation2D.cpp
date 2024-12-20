#ifndef _Transformation2D
#define _Transformation2D

#include <cmath>
#include <cstring>
#include "../Constants.cpp"

struct Transformation2D {
	float data[6];

	// apply offset and basis vectors.
	void apply(float* points, int beg, int end, int stride) {
		for(int i=beg;i<end;i+=stride) {
			const float x = points[i+0];
			const float y = points[i+1];
			points[i+0] = x*data[0] + y*data[2] + data[4];
			points[i+1] = x*data[1] + y*data[3] + data[5];
		}
	}

	// only apply the offset part of this transformation.
	void applyOffset(float* points, int beg, int end, int stride) {
		for(int i=beg;i<end;i+=stride) {
			const float x = points[i+0];
			const float y = points[i+1];
			points[i+0] = data[4];
			points[i+1] = data[5];
		}
	}

	// only apply the basis part of this transformation.
	void applyBasis(float* points, int beg, int end, int stride) {
		for(int i=beg;i<end;i+=stride) {
			const float x = points[i+0];
			const float y = points[i+1];
			points[i+0] = x*data[0] + y*data[2];
			points[i+1] = x*data[1] + y*data[3];
		}
	}

	Transformation2D() {
		// xbasis
		this->data[0] = 1;
		this->data[1] = 0;
		// ybasis
		this->data[2] = 0;
		this->data[3] = 1;
		// offset
		this->data[4] = 0;
		this->data[5] = 0;
	}
	Transformation2D(float x, float y, float w, float h, float r) {
		const float s = std::sinf(r * PI_2);
		const float c = std::cosf(r * PI_2);
		// xbasis
		this->data[0] = c*w;
		this->data[1] = s*w;
		// ybasis
		this->data[2] = -s*h;
		this->data[3] =  c*h;
		// offset
		this->data[4] = x;
		this->data[5] = y;
	}
	Transformation2D(Transformation2D& a, Transformation2D& b) {
		memcpy(this->data, b.data, 6 * sizeof(float));
		a.applyBasis (this->data, 0, 6, 2);// apply basis to entire matrix.
		a.applyOffset(this->data, 4, 6, 2);// only apply offset to offset.
	}

	Transformation2D compose(Transformation2D b) {
		return Transformation2D(*this, b);
	}
};

#endif
