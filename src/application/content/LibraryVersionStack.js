
/* NOTE:
	I dont plan on finishing this is javascript,
	as it would make much more sense to just implement it in cpp only
	due to how type-heavy and/or serialization-heavy this is.

	this will require fully moving the block-library to the cpp-side,
	i.e. not keeping a js-side copy of the library,
	but said migration will be quite involved.
*/
class LibraryVersionStack {
	constructor() {
		// stack of (saved-data) library versions. (TODO: use save/load to clone them)
		this.lib_stack = [];
		// stack of content-change deltas.
		this.chg_stack = [];
	}

	diff_items(items_a, items_b) {
		const changes = [];
		for(const id of items_a.keys()) {
			const item_a = items_a.has(id) ? items_a.get(id) : null;
			const item_b = items_b.has(id) ? items_b.get(id) : null;
			if(JSON.stringify(item_a) !== JSON.stringify(item_b)) changes.push([id, item_a, item_b]);
		}
	}

	diff_template(tid, btmp_a, btmp_b) {
		if(!btmp_a &&  btmp_b) return ({ id:tid, created:true });
		if( btmp_a && !btmp_b) return ({ id:tid, removed:true });
		if(!btmp_a && !btmp_b) throw("this function should not be called with no templates!");
		const tmpdiff = { id:tid };
		const props = [];
		const prop_keys = ["name", "desc", "width", "height", "placeW", "placeH"];
		for(const key of prop_keys) {
			if(btmp_a[key] !== btmp_b[key]) props.push([key, btmp_a[key], btmp_b[key]]);
		}
		if(props)
	}

	/*
		check if library has changed, and return delta if so.

		delta format:			TemplateDiff[],
		TemplateDiff format:	{
			id			: ItemId,
			props		: [...changes: [key, val_a, val_b]],
			created?	: true,		(if template was created)
			removed?	: true,		(if template was removed)
			cells?		: [...changes: [id, json_a, json_b]],
			links?		: [...changes],
			texts?		: [...changes],
			blocks?		: [...changes],
		}
	*/
	detect_changes(new_library) {
		// compare library json.
		const json_a = this.lib_stack[this.lib_stack.length - 1];
		const json_b = new_library.save();
		if(json_a === json_b) return null;
		this.lib_stack.push(json_b);
		// if they differ, get difference between them.
		const lib_a = BlockTemplateLibrary.load(json_a);
		const lib_b = new_library;
		// TODO
		let delta = {};// format
		if(delta.length > 0) this.chg_stack.push(delta);
		return delta;
	}
};

