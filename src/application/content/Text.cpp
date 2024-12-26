#ifndef _Text
#define _Text

#include "../Imports.cpp"
#include "./ItemDim.cpp"
#include "./ItemId.cpp"
#include "./Colour.cpp"

struct Text {
	ItemDim	dim;
	ItemId			id;
	String	str;
	/* Font height/scale. */
	f32		fhgt;
	/* Foreground colour. */
	Colour	fclr;
	/* Background colour. */
	Colour	bclr;
	/* Outline colour. */
	Colour	oclr;			
	
	Text() {}
	Text(ItemDim dim, String str, f32 fhgt, Colour fclr, Colour bclr, Colour oclr) {
		this->dim	= dim;
		this->id	= ItemId::next();
		this->str	= str;
		this->fhgt	= fhgt;
		this->fclr	= fclr;
		this->bclr	= bclr;
		this->oclr	= oclr;
	}
};

#endif
