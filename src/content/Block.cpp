
/*
	A Block is a virtual instance of some BlockTemplate.
*/
struct Block {
	ComponentDimensions	dim;
	ComponentId			id;
	ComponentId			templateId;
	
	Block() {}
	Block(ComponentDimensions dim, ComponentId templateId) {
		this->dim			= dim;
		this->id			= ComponentId::next();
		this->templateId	= templateId;
	}
};

