#include "../Imports.cpp"

struct Colour {
	u8 r,g,b,a;
	
	Colour(u8 r, u8 g, u8 b, u8 a) {
		this->r = r;
		this->g = g;
		this->b = b;
		this->a = a;
	}
	Colour() {
		Colour(0xff, 0x00, 0x00, 0xff);
	}
	Colour(u32 clr) {
		Colour(
			(clr >> 24) & 0xff,
			(clr >> 16) & 0xff,
			(clr >>  8) & 0xff,
			(clr >>  0) & 0xff
		);
	}
	
	getHex() {
		return (r<<24) | (g<<16) | (b<<8) | (a<<0);
	}
};

