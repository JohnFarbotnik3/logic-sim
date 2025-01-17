#ifndef StringMessageUtil_h
#define StringMessageUtil_h

#include "./StringMessage.cpp"
#include "../Imports.cpp"

struct StringMessageUtil {

	template<class T>
	String set_to_str(Set<T> set) {
		StringMessage message;
		for(const T& item : set) message.push_value(item);
		return message.to_string();
	}
	template<class T>
	Set<T> str_to_set(String str) {
		StringMessage message(str);
		Set<T> set;
		for(int x=0;x<message.list.size();x++) set.insert(message.read_number<T>(x));
		return set;
	}
	template<>
	Set<String> str_to_set<String>(String str) {
		StringMessage message(str);
		Set<String> set;
		for(int x=0;x<message.list.size();x++) set.insert(message.read_string(x));
		return set;
	}

};

#endif
