#ifndef _ComponentId
#define _ComponentId

#include "../lib/Date.cpp"

typedef uint64_t ComponentId;

struct ComponentIdUtil {
	static const ComponentId NONE = 0;
	static const ComponentId THIS_BLOCK = 1;
	
	static ComponentId _next;
	static ComponentId next() {
		return ComponentId(ComponentIdUtil::_next++);
	}
};

ComponentId ComponentIdUtil::_next = Date::now_ms();

#endif
