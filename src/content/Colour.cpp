#include <cstdint>

struct Colour {
	uint32_t rgba;
	
	Colour() {
		this->rgba = 0xff00ffff;
	}
	Colour(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
		this->rgba = (r<<24) | (g<<16) | (b<<8) | (a<<0);
	}
	Colour(uint32_t rgba) {
		this->rgba = rgba;
	}
};

