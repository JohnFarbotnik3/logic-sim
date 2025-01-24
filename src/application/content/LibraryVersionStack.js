
class LibraryVersionStack {
	TYPE = {
		CELL		: 1,
		LINK		: 2,
		TEXT		: 3,
		BLOCK		: 4,
		TEMPLATE	: 5,
	};

	DIFF = {
		ADDED	: 1,
		REMOVED	: 2,
		MODIFIED: 3,
	};

	constructor() {
		// stack of (saved-data) library versions. (TODO: use save/load to clone them)
		this.lib_stack = [];
		// stack of content-change deltas.
		this.chg_stack = [];
	}

	get_template_groups(A_tmp, B_tmp) {
		const groups = [
			[A_tmp.cells , B_tmp.cells , this.TYPE.CELL ],
			[A_tmp.links , B_tmp.links , this.TYPE.LINK ],
			[A_tmp.texts , B_tmp.texts , this.TYPE.TEXT ],
			[A_tmp.blocks, B_tmp.blocks, this.TYPE.BLOCK],
		];
		return groups;
	}

	push_delta_added_ids(delta, A_items, B_items, diff, type, tid) {
		const ids = new Set();
		for(const item of B_items) ids.add(item.id);
		for(const item of A_items) ids.delete(item.id);
		for(const id of ids.keys()) delta.push([diff, type, tid, id]);
	}

	push_delta_modded_ids(delta, A_items, B_items, diff, type, tid) {
		// TODO
		// - compare saved data of each item.
	}

	// return difference B-A between two libraries.
	get_delta(A, B) {
		const delta = [];// [diff, type, templateId, id][].
		// check for template modifications.
		// ...TODO...
		// check for added items.
		for(const [tid, B_tmp] of B.templates.entries()) {
			const diff = this.DIFF.ADDED;
			const A_tmp = A.templates.get(tid);
			if(!A_tmp) delta.push([diff, this.TYPE.TEMPLATE, tid, null]);
			else for(const [A_items, B_items, type] of this.get_template_groups(A_tmp, B_tmp))
				this.push_delta_added_ids(delta, A_items, B_items, diff, type, tid);
		}
		// check for removed items.
		for(const [tid, A_tmp] of A.templates.entries()) {
			const diff = this.DIFF.REMOVED;
			const B_tmp = B.templates.get(tid);
			if(!B_tmp) delta.push([diff, this.TYPE.TEMPLATE, tid, null]);
			else for(const [A_items, B_items, type] of this.get_template_groups(A_tmp, B_tmp))
				this.push_delta_added_ids(delta, B_items, A_items, diff, type, tid);// NOTE: A_items and B_items are reversed.
		}
		// check for modified items.
		// ...TODO...
	}

	// push new
	detect_changes(library) {
		let delta = [];
		// TODO:
		// - accumulate all changes into a delta.
		if(delta.length > 0) this.stack.push(delta);
		return delta;
	}
};

