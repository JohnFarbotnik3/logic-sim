#ifndef ItemIdCollection_h
#define ItemIdCollection_h

#include "./ItemId.cpp"

struct ItemIdCollection {
	Set<ItemId> cells;
	Set<ItemId> links;
	Set<ItemId> texts;
	Set<ItemId> blocks;
};

#endif
