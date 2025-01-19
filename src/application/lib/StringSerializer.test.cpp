#include <cstdio>
#include <string>
#include "./StringSerializer.cpp"

int main(const int argc, const char** argv) {
	using String = std::string;
	using i32 = StringSerializer::i32;
	using i64 = StringSerializer::i64;
	using f32 = StringSerializer::f32;
	using f64 = StringSerializer::f64;
	using u32 = StringSerializer::u32;
	using u64 = StringSerializer::u64;

	i32 vi32 = 1;
	i64 vi64 = -1000200030004000;
	f32 vf32 = 123.456789012345678901f;
	f64 vf64 = 123.456789012345678901;
	u32 vu32 = 0xffffffee;
	u64 vu64 = 0xffffffffffffffee;
	String vstr = "abc,\\,\n,def,\\,\n,❤❥❦❴❵➀➇❡,ghi";

	// write message.
	printf("\n");
	StringSerializer message;
	message.push_value(vi32);
	message.push_value(vi64);
	message.push_value(vf64);
	message.push_value(vf32);
	message.push_value(vstr);
	message.push_value(vu32);
	message.push_value(vu64);
	printf("\n");
	String msg = message.to_string();
	printf("message: %s\n", msg.c_str());

	// read message.
	printf("\n");
	StringSerializer message2(msg);
	for(const String str : message2.list) printf("list item: %s\n", str.c_str());
	i32 ri32 = message2.read_number<i32>();
	i64 ri64 = message2.read_number<i64>();
	f64 rf64 = message2.read_number<f64>();
	f32 rf32 = message2.read_number<f32>();
	String rstr = message2.read_string();
	u32 ru32 = message2.read_number<u32>();
	u64 ru64 = message2.read_number<u64>();

	printf("\n");
	printf("value: [%i] %i \n", ri32==vi32, ri32);
	printf("value: [%i] %li\n", ri64==vi64, ri64);
	printf("value: [%i] %lf\n", rf32==vf32, rf32);
	printf("value: [%i] %lf\n", rf64==vf64, rf64);
	printf("value: [%i] %s \n", rstr==vstr, rstr.c_str());
	printf("value: [%i] %u \n", ru32==vu32, ru32);
	printf("value: [%i] %lu\n", ru64==vu64, ru64);
}
