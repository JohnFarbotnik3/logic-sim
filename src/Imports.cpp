#ifndef _Imports
#define _Imports

#include <cstdint>
#include <string>
#include <array>
#include <vector>
#include <map>

using u8  = uint8_t;
using u16 = uint16_t;
using u32 = uint32_t;
using u64 = uint64_t;

using f32 = float;
using f64 = double;

using String = std::string;

template<class T, int SZ>
using Array = std::array<T, SZ>;

template<class T>
using Vector = std::vector<T>;

template<class K, class V>
struct Map : std::map<K,V> {
	bool contains(K key) {
		return this->count(key) > 0;
	}
};

#endif

