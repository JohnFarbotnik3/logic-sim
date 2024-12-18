#include "./Transformation2D.cpp"

struct ComponentDimensions {
	float x,y,w,h,r;
	
	ComponentDimensions() {
		x = 0;
		y = 0;
		w = 1;
		h = 1;
		r = 0;
	}
	ComponentDimensions(float x, float y, float w, float h, float r) {
		this->x = x;
		this->y = y;
		this->w = w;
		this->h = h;
		this->r = r;
	}
	
	Transformation2D getTransformation() {
		return new Transformation2D(x,y,w,h,r);
	}
};

