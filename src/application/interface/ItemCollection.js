
// TODO: rename to ComponentSet
export class ItemCollection {
	constructor() {
		this.cells  = new Set();
		this.texts  = new Set();
		this.blocks = new Set();
	}
	count() {
		return (
			this.cells.size +
			this.texts.size +
			this.blocks.size
		);
	}
	clear() {
		this.cells.clear();
		this.texts.clear();
		this.blocks.clear();
	}
	addFromCollection(collection) {
		for(const item of collection.cells ) this.cells .add(item);
		for(const item of collection.texts ) this.texts .add(item);
		for(const item of collection.blocks) this.blocks.add(item);
	}
	addFirstComponentFromCollection(collection) {
		for(const item of collection.texts ) { this.texts .add(item); return; }
		for(const item of collection.blocks) { this.blocks.add(item); return; }
		for(const item of collection.cells ) { this.cells .add(item); return; }
	}
	getFirstComponentFromCollection() {
		for(const item of this.texts ) { return item; }
		for(const item of this.blocks) { return item; }
		for(const item of this.cells ) { return item; }
	}
	intersection(collection) {
		const intersection = new ItemCollection();
		for(const item of this.cells ) if(collection.cells .has(item)) intersection.cells .add(item);
		for(const item of this.texts ) if(collection.texts .has(item)) intersection.texts .add(item);
		for(const item of this.blocks) if(collection.blocks.has(item)) intersection.blocks.add(item);
		return intersection;
	}
};

