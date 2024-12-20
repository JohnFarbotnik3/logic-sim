
// TODO: implement functions for transmitting data to cpp-side.
class LibraryConverter {
	
	/* Notify cpp-side that we are creating a new blocklib. */
	static begin_new_blocklib() {}	
	
	/* Notify cpp-side that we have completed creation of new blocklib. */
	static finish_new_blocklib() {}	
	
	static set_root_template() {}
	
	static add_cell(templateId, itemId) {}
	static rem_cell(templateId, itemId) {}
	
	static add_link(templateId, itemId) {}
	static rem_link(templateId, itemId) {}
	
	static add_block(templateId, itemId) {}
	static rem_block(templateId, itemId) {}
	
	static add_template(templateId) {}
	static rem_template(templateId) {}
	
};

