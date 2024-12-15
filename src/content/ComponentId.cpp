#include <time.h>

struct ComponentId {
	static const uint32_t NONE = 0;
	static const uint32_t THIS_BLOCK = 1;
	
	uint32_t value;
	ComponentId() {
		this->value = NONE;
	}
	ComponentId(uint32_t value) {
		this->value = value;
	}
	
	static uint32_t _next;
	static ComponentId next() {
		return ComponentId(_next++);
	}
};

uint32_t ComponentId::_next = (uint32_t)time(NULL);

