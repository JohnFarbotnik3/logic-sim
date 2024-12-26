#ifndef _ItemId
#define _ItemId

#include "../Imports.cpp"
#include "../lib/Date.cpp"

struct ItemId {
	static inline const u64 NONE = 0;
	static inline const u64 THIS_BLOCK = 1;

	u64 value;

	ItemId() {}
	ItemId(u64 value) {
		this->value = value;
	}
	ItemId(String value) {
		//printf("<> STR: %s\n",value.c_str());
		this->value = 0;
		for(int x=0;x<value.length();x++) this->value = this->value * 10 + (value[x] - '0');
		//printf("<> OUT: %llu\n",this->value);
	}

	/*
	ItemId operator = (const u64 value) { return ItemId(value); }
	inline bool operator == (const ItemId& b) const { return this->value == b.value; }
	inline bool operator <  (const ItemId& b) const { return this->value <  b.value; }
	inline bool operator >  (const ItemId& b) const { return this->value >  b.value; }
	// why do I need this weird extra const^ between the signature and the function block??
	// is it some cryptic way of stating that "this" doesnt get mutated either?
	// if so, then that is some super weird syntax, and it could've been made a bit clearer...
	// see: cpp-reference/en/cpp/language/operators.html
	*/

	friend inline bool operator == (const ItemId& a, const ItemId& b) { return a.value == b.value; }
	friend inline bool operator <  (const ItemId& a, const ItemId& b) { return a.value <  b.value; }
	friend inline bool operator >  (const ItemId& a, const ItemId& b) { return a.value >  b.value; }

	static u64 _next;
	static ItemId next() {
		return ItemId(ItemId::_next++);
	}
};

u64 ItemId::_next = Date::now_ms();

#endif
