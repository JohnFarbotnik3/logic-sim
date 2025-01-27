#ifndef VertexTypes_h
#define VertexTypes_h

#include <cstdint>
#include <cstring>
#include "../lib/Vec.cpp"
#include "../content/ItemClr.cpp"

using VertexPos = Vec3;

struct VertexClr {
	uint32_t rgba;
	VertexClr() = default;
	VertexClr(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
		rgba = (r << 24) | (g << 16) | (b << 8) | (a << 0);
	}
	VertexClr(uint32_t rgba) {
		this->rgba = rgba;
	}
	VertexClr(ItemClr clr) {
		rgba = clr.to_u32();
	}
};

struct VertexTex {
	float u,v;
};

#endif
