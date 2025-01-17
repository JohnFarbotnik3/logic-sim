#ifndef FontEngine_h
#define FontEngine_h

#include "../Imports.cpp"
#include "../lib/Rectangle.cpp"
#include "../lib/VectorND.cpp"

/*
	This class is meant to be used alongside the javascript FontRenderer,
	and is tasked with generating vertex data efficiently.
*/
struct FontRenderer {

	// glyph texture image.
	// NOTE: this should be initialized before using FontRenderer.
	float texImageW = 0;
	float texImageH = 0;
	float texImageAspectRatio = 0;
	void setTextureImageDimensions(float tw, float th) {
		texImageW = tw;
		texImageH = th;
		texImageAspectRatio = tw / th;
	}

	// glyph map.
	// NOTE: this should be initialized before using FontRenderer.
	using Char = int;
	struct FontRendererGlyph {
		// texture location and dimensions.
		float x,y,w,h;
		float aspectRatio;
		FontRendererGlyph() = default;
		FontRendererGlyph(float x, float y, float w, float h) {
			this->x = x;
			this->y = y;
			this->w = w;
			this->h = h;
			this->aspectRatio = w / h;
		}
	};
	Map<Char, FontRendererGlyph> glyphmap;
	Set<Char> missingGlyphs;
	FontRendererGlyph getGlyph(Char c) {
		if(glyphmap.contains(c)) return glyphmap.at(c);
		else {
			missingGlyphs.insert(c);
			return FontRendererGlyph();
		}
	}

	float getGlyphWidth(const FontRendererGlyph& g) {
		return g.aspectRatio * texImageAspectRatio;
	}

	// get total width of text.
	float getTotalWidth(String str, float height) {
		float x = 0;
		for(int i=0;i<str.size();i++) x += height * getGlyphWidth(getGlyph(str[i]));
		return x;
	}

	template<class Ind, class Pos, class Tex>
	struct FontVertexData {
		Vector<Ind> idata;
		Vector<Pos> vdata;
		Vector<Tex> tdata;
	};

	int TEST_DRAW = 0;

	// generate 2d text then apply 3d transformation.
	template<class Ind, class Pos, class Tex>
	FontVertexData<Ind, Pos, Tex> generateVertexData3d(
		String str,
		float height,
		float widthMult,
		bool wrap,
		Rectangle boundingRect,
		Vector2D textAlignment,
		Vector2D rectOrigin,
		Vector3D vecOffset,
		Vector3D vecBasisX,
		Vector3D vecBasisY
	) {
		if(str == "CNST" && TEST_DRAW < 100) {
			printf("<>str: %s\n", str.c_str());
			printf("<>hgt: %f\n", height);
			printf("<>wid: %f\n", widthMult);
			printf("<>rect: %f, %f, %f, %f\n", boundingRect.x, boundingRect.y, boundingRect.w, boundingRect.h);
			printf("<>offset: %f, %f, %f\n", vecOffset.x, vecOffset.y, vecOffset.z);
			printf("<>xbasis: %f, %f, %f\n", vecBasisX.x, vecBasisX.y, vecBasisX.z);
			printf("<>ybasis: %f, %f, %f\n", vecBasisY.x, vecBasisY.y, vecBasisY.z);
		}
		FontVertexData<Ind, Pos, Tex> data;
		Vector<Ind>& idata = data.idata;
		Vector<Pos>& vdata = data.vdata;
		Vector<Tex>& tdata = data.tdata;
		// move bounding rectangle to origin so that basis vectors apply correctly.
		vecOffset.x += boundingRect.x;
		vecOffset.y += boundingRect.y;
		const float x1 = 0;
		const float y1 = 0;
		const float x2 = boundingRect.w;
		const float y2 = boundingRect.h;
		// generate lines of 2D text.
		float x = x1;
		float y = y2 - height;
		struct Line { Ind vcount; float x,y; };
		Vector<Line> linedata;
		for(int i=0;i<str.size();i++) {
			const FontRendererGlyph g = getGlyph(str[i]);
			if(str == "CNST" && TEST_DRAW < 100 && g.w != 0) {
				if(i == str.size()-1) TEST_DRAW = 101;
				printf("<>str[i], glyph (x,y,w,h): %i, %c, %f, %f, %f, %f\n", i, str[i], g.x, g.y, g.w, g.h);
			}
			const float w = height * getGlyphWidth(g) * widthMult;
			const float h = height;
			// start new line if needed
			const Ind vcount = vdata.size();
			if((x + w > x2) & wrap) { linedata.emplace_back(vcount,x,y); x=x1; y-=height; }
			if(str[i] == '\n')      { linedata.emplace_back(vcount,x,y); x=x1; y-=height; continue; }
			// push character data
			const Ind INDS[] = {0,1,2,2,3,0};
			for(int q=0;q<6;q++) idata.push_back(INDS[q] + vcount);
			vdata.emplace_back(x		, y		, 0);
			vdata.emplace_back(x + w	, y		, 0);
			vdata.emplace_back(x + w	, y + h	, 0);
			vdata.emplace_back(x		, y + h	, 0);
			tdata.emplace_back(g.x		, g.y		);
			tdata.emplace_back(g.x + g.w, g.y		);
			tdata.emplace_back(g.x + g.w, g.y + g.h	);
			tdata.emplace_back(g.x		, g.y + g.h	);
			x += w;
		}
		// push last line.
		linedata.emplace_back(vdata.size(),x,y);
		// apply text alignment.
		int vc_ind = 0;
		for(int line_ind=0;line_ind < linedata.size(); line_ind++) {
			const Line line = linedata[line_ind];
			const float h = height;
			const float rect_w = x2 - x1;
			const float rect_h = y2 - y1;
			const float leftover_w = x2 - line.x;	// leftover width on line
			const float leftover_h = y;				// leftover height on rect
			const float xofs = +textAlignment.x * leftover_w - rectOrigin.x * rect_w;
			const float yofs = -textAlignment.y * leftover_h - rectOrigin.y * rect_h;
			while(vc_ind < line.vcount) {
				vdata[vc_ind].x += xofs;
				vdata[vc_ind].y += yofs;
				vc_ind++;
			}
		}
		// apply offset and 3d basis vectors.
		for(int i=0;i<vdata.size();i++) {
			const float x = vdata[i].x;
			const float y = vdata[i].y;
			vdata[i].x = vecOffset.x + vecBasisX.x*x + vecBasisY.x*y;
			vdata[i].y = vecOffset.y + vecBasisX.y*x + vecBasisY.y*y;
			vdata[i].z = vecOffset.z + vecBasisX.y*x + vecBasisY.z*y;
		}
		return data;
	}
};

#endif
