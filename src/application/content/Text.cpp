#ifndef _Text
#define _Text

#include "../Imports.cpp"
#include "./ItemId.cpp"
#include "./ItemDim.cpp"
#include "./ItemClr.cpp"

struct Text {
	ItemDim	dim;
	ItemId			id;
	String	str;
	/* Font height/scale. */
	f32		fhgt;
	/* Foreground colour. */
	ItemClr	fclr;
	/* Background colour. */
	ItemClr	bclr;
	/* Outline colour. */
	ItemClr	oclr;
	
	Text() {}
	Text(ItemDim dim, String str, f32 fhgt, ItemClr fclr, ItemClr bclr, ItemClr oclr) {
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
