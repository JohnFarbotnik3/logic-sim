#ifndef ItemClr_h
#define ItemClr_h

#include <cstdint>

struct ItemClr {
	uint8_t r,g,b,a;
	ItemClr() = default;
	ItemClr(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
		this->r = r;
		this->g = g;
		this->b = b;
		this->a = a;
	}
	ItemClr(uint32_t rgba) {
		r = (rgba >> 24) & 0xff;
		g = (rgba >> 16) & 0xff;
		b = (rgba >>  8) & 0xff;
		a = (rgba >>  0) & 0xff;
	}
	uint32_t to_u32() const {
		return (r << 24) | (g << 16) | (b << 8) | (a << 0);
	}
};

#endif
