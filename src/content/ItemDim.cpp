#ifndef _ItemDim
#define _ItemDim

#include "../lib/Transformation2D.cpp"

struct ItemDim {
	float x,y,w,h,r;
	
	ItemDim() {
		x = 0;
		y = 0;
		w = 1;
		h = 1;
		r = 0;
	}
	ItemDim(float x, float y, float w, float h, float r) {
		this->x = x;
		this->y = y;
		this->w = w;
		this->h = h;
		this->r = r;
	}
	
	Transformation2D getTransformation() {
		return Transformation2D(x,y,w,h,r);
	}
};

#endif
