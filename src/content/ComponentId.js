
/*
	A number that uniquely identifies an item within a block.
	
	The purpose of these Ids is for links to be able to target components,
	as well as for all items within a block to use the same render maps.
	
	Note that multiple child-blocks that use the same template
	may have items with the same Id, so the block's Id is also required
	when addressing cell targets.
*/
class ComponentId {
	/*
		Generic default Id.
	*/
	static NONE = 0;
	
	/*
		Id used to identify the block that owns the link,
		i.e. when a link targets a cell in the same block.
	*/
	static THIS_BLOCK = 1;
	
	static _next = Date.now();
	static next() {
		return ComponentId._next++;
	}
};

