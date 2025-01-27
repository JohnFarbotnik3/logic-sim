#ifndef ItemCollection_h
#define ItemCollection_h

#include "./ItemId.cpp"

struct ItemCollection {
	Set<ItemId> cells;
	Set<ItemId> links;
	Set<ItemId> texts;
	Set<ItemId> blocks;
};

#endif
