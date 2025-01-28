#ifndef Random_h
#define Random_h

#include <random>

/*
	NOTE: these generators produce a uniform random number between min and max (INCLUSIVE)
*/
template<class T>
struct Random_int {
	std::mt19937 rand;
	std::uniform_int_distribution<T> dist;
	Random_int(int seed, T min, T max) : rand(seed), dist(min, max) {}
	T next() { return dist(rand); }
};

template<class T>
struct Random_real {
	std::mt19937 rand;
	std::uniform_real_distribution<T> dist;
	Random_real(int seed, T min, T max) : rand(seed), dist(min, max) {}
	T next() { return dist(rand); }
};

#endif
