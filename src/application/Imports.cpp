#ifndef _Imports
#define _Imports

#include <cstdint>
#include <string>
#include <array>
#include <vector>
#include <map>
#include <set>
#include <optional>

using u8  = uint8_t;
using u16 = uint16_t;
using u32 = uint32_t;
using u64 = uint64_t;

using i32 = int32_t;

using f32 = float;
using f64 = double;

using String = std::string;

template<class T, int SZ>
using Array = std::array<T, SZ>;

template<class T>
using Vector = std::vector<T>;

template<class K>
using Set = std::set<K>;

template<class K, class V>
//using Map = std::map<K, V>;
///*
struct Map : std::map<K,V> {
	bool contains(const K& key) const { return this->find(key) != this->end(); }
};
//*/

template<class T>
using Optional = std::optional<T>;

#endif

