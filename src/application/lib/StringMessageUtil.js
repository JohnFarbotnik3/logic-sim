import { StringMessage } from "./StringMessage";

export class StringMessageUtil {

	static number_set_to_str(set) {
		const message = new StringMessage();
		for(const item of set.keys()) message.push_number(item);
		return message.to_string();
	}
	static string_set_to_str(set) {
		const message = new StringMessage();
		for(const item of set.keys()) message.push_string(item);
		return message.to_string();
	}
	static str_to_number_set(str) {
		const message = new StringMessage(str);
		const set = new Set();
		for(let x=0;x<message.list.size();x++) set.add(message.read_number(x));
		return set;
	}
	static str_to_string_set(str) {
		const message = new StringMessage(str);
		const set = new Set();
		for(let x=0;x<message.list.size();x++) set.add(message.read_string(x));
		return set;
	}

};
