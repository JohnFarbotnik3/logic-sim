#include <time.h>

struct ComponentId {
	static const uint64_t NONE = 0;
	static const uint64_t THIS_BLOCK = 1;
	
	uint64_t value;
	ComponentId() {
		this->value = NONE;
	}
	ComponentId(uint64_t value) {
		this->value = value;
	}
	
	static uint64_t _next;
	static ComponentId next() {
		return ComponentId(_next++);
	}
};

uint64_t ComponentId::_next = (uint64_t)time(NULL);

