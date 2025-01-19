#ifndef StringConverter_h
#define StringConverter_h

#include <string>
#include <charconv>
#include <cstdint>
#include <vector>
#include <array>

// TODO - rename to SimpleSerializer
/*
	This class is for parsing and stringifying a mixed array of primitives (int, float, string)
	into a newline-delimited string.

	Items should be read in the same order they are written for consistency.

	NOTE: a trailing delimiter is also used for convenience.
*/
struct StringSerializer {
	using String = std::string;
	using i32 = int32_t;
	using i64 = int64_t;
	using u32 = uint32_t;
	using u64 = uint64_t;
	using f32 = float;
	using f64 = double;

	// list of stringified items.
	std::vector<String> list;
	// current read position in list.
	int readpos = 0;
	// delimiting character.
	const char DLCH = '\n';

	void clear() {
		list.clear();
		readpos = 0;
	}
	void reset() {
		readpos = 0;
	}

	String to_string() {
		String msg = "";
		for(const String& str : list) msg += (str + DLCH);
		return msg;
	}
	void load_from_string(String msg) {
		clear();
		// get endpoints of each string, skipping escaped delimiters.
		// TODO: what is the difference between str.size() and str.length()?
		std::vector<int> endpoints;
		for(int x=0;x<msg.length();x++) {
			while(msg[x] == '\\') x+=2;
			if(msg[x] == DLCH) endpoints.push_back(x);
		}
		// split message into substrings.
		int a = 0;
		for(const int b : endpoints) {
			list.push_back(msg.substr(a, b-a));
			a = b + 1;// skip delimiter after endpoint.
		}
	}

	StringSerializer() = default;
	StringSerializer(String msg) {
		load_from_string(msg);
	}

	// http://localhost:4000/cpp/utility/to_chars.html
	// http://localhost:4000/cpp/utility/from_chars.html

	template<class T>
	String value_to_chars(T value, String prformat) {
		std::array<char, 64> buf;
		const auto [ptr, error_code] = std::to_chars(buf.data(), buf.data() + buf.size(), value);
		if(error_code != std::errc()) printf(String("ERROR DURING push_value(" + prformat + ")\n").c_str(), value);
		return String(buf.data(), 0, ptr - buf.data());
	}
	void push_number(i32 value) { list.push_back(value_to_chars(value, "%i")); }
	void push_number(i64 value) { list.push_back(value_to_chars(value, "%lli")); }
	void push_number(f32 value) { list.push_back(value_to_chars(value, "%f")); }
	void push_number(f64 value) { list.push_back(value_to_chars(value, "%lf")); }
	void push_number(u32 value) { list.push_back(value_to_chars(value, "%u")); }
	void push_number(u64 value) { list.push_back(value_to_chars(value, "%llu")); }

	template<class T> T read_number() {
		T value;
		const String& str = list[readpos++];
		/* NOTE:
			for some reason, the float version of this is explicitly deleted (i.e. unsupported),
			(but only on some of my devices / some versions of gcc?)
			causing the error message: "error: call to deleted function 'from_chars'".
			until there is support for std::from_chars<float>, I'll use template overloads.

			https://www.reddit.com/r/cpp_questions/comments/zg6qlt/from_chars_and_floatingpoint_issue/
		*/
		const auto [ptr, error_code] = std::from_chars(str.data(), str.data() + str.size(), value);
		if(error_code != std::errc()) printf(String("ERROR DURING read(%i) %s\n").c_str(), readpos, str.c_str());
		return value;
	}
	template<> float read_number<float>() {
		const String& str = list[readpos++];
		return std::stof(str, nullptr);
	}
	template<> double read_number<double>() {
		const String& str = list[readpos++];
		return std::stod(str, nullptr);
	}

	void push_string(String value) {
		String buf = "";
		for(int x=0;x<value.length();x++) {
			const char ch = value[x];
			// escape escape-characters ("\" -> "\\").
			if(ch == '\\') buf += '\\';
			// escape list delimiter ("X" -> "\X").
			if(ch == DLCH) buf += '\\';
			// add character.
			buf += ch;
		}
		list.push_back(String(buf.data()));
	}
	String read_string() {
		String buf = "";
		const String& str = list[readpos++];
		for(int x=0;x<str.length();x++) {
			const char ch = str[x];
			// if escape character, skip (then add next character).
			if(ch == '\\') x++;
			// add character.
			buf += str[x];
		}
		return buf;
	}
};

#endif
