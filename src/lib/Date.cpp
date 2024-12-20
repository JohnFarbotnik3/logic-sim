#ifndef _Date
#define _Date

#include <ctime>
#include <cstdint>

struct Date {
	static uint64_t now_ns() {
		std::timespec ts;
		std::timespec_get(&ts, TIME_UTC);
		const uint64_t ns = (uint64_t)(ts.tv_sec) * 1000000000 + ts.tv_nsec;
		return ns;
	}
	
	static uint64_t now_us() {
		return Date::now_ns() / 1000;
	}
	
	static uint64_t now_ms() {
		return Date::now_ns() / 1000000;
	}
};

#endif
