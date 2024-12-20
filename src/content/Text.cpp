#include "../Imports.cpp"
#include "./ComponentDimensions.cpp"
#include "./ComponentId.cpp"
#include "./Colour.cpp"

struct Text {
	ComponentDimensions	dim;
	ComponentId			id;
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
	Text(ComponentDimensions dim, String str, f32 fhgt, Colour fclr, Colour bclr, Colour oclr) {
		this->dim	= dim;
		this->id	= ComponentIdUtil::next();
		this->str	= str;
		this->fhgt	= fhgt;
		this->fclr	= fclr;
		this->bclr	= bclr;
		this->oclr	= oclr;
	}
};

