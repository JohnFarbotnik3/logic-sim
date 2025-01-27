#ifndef VectorND_h
#define VectorND_h

#include <cmath>
#include <cstddef>

template<class T, int N>
struct Vec {
	T data[N];

	// http://localhost:4000/cpp/language/operators.html
			T& operator [] (std::size_t ind)       { return data[ind]; }
	const	T& operator [] (std::size_t ind) const { return data[ind]; }

	// http://localhost:4000/cpp/language/friend.html
	// https://isocpp.org/wiki/faq/friends
	friend Vec<T,N> operator +  (const Vec& a, const Vec&  b) { Vec c; for(int x=0;x<N;x++) c.data[x] = a.data[x] + b.data[x]; return c; }
	friend Vec<T,N> operator -  (const Vec& a, const Vec&  b) { Vec c; for(int x=0;x<N;x++) c.data[x] = a.data[x] - b.data[x]; return c; }
	friend Vec<T,N> operator *  (const Vec& a, const float b) { Vec c; for(int x=0;x<N;x++) c.data[x] = a.data[x] * b;         return c; }

	friend bool operator == (const Vec& a, const Vec&  b) {
		for(int x=0;x<N;x++) if(a.data[x] != b.data[x]) return false;
		return true;
	}

	T hypot() { T sum = 0; for(int x=0;x<N;x++) sum += data[x]*data[x]; return std::sqrt(sum); }
	T hypsq() { T sum = 0; for(int x=0;x<N;x++) sum += data[x]*data[x]; return sum; }
};

using Vec2 = Vec<float, 2>;
using Vec3 = Vec<float, 3>;

#endif
