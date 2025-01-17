
function StringMessage_test() {

	let vi32 = 1;
	let vi64 = -1000200030004000;
	let vf32 = 123.456789012345678901;
	let vf64 = 123.456789012345678901;
	let vu32 = 0xffffffee;
	let vu64 = 0xffffffffffffffee;
	let vstr = "abc,\\,\n,def,\\,\n,❤❥❦❴❵➀➇❡,ghi";

	// write message.
	let message = new StringMessage();
	message.push_number(vi32);
	message.push_number(vi64);
	message.push_number(vf64);
	message.push_number(vf32);
	message.push_string(vstr);
	message.push_number(vu32);
	message.push_number(vu64);

	const msg = message.to_string();
	console.log("message: %s", msg);

	// read message.
	let i=0;
	let message2 = new StringMessage(msg);
	for(const str of message2.list) console.log("list item: %s", str);
	let ri32 = message2.read_number(i++);
	let ri64 = message2.read_number(i++);
	let rf64 = message2.read_number(i++);
	let rf32 = message2.read_number(i++);
	let rstr = message2.read_string(i++);
	let ru32 = message2.read_number(i++);
	let ru64 = message2.read_number(i++);

	console.log("value: [%i] %i ", ri32==vi32, ri32);
	console.log("value: [%i] %li", ri64==vi64, ri64);
	console.log("value: [%i] %lf", rf32==vf32, rf32);
	console.log("value: [%i] %lf", rf64==vf64, rf64);
	console.log("value: [%i] %s ", rstr==vstr, rstr);
	console.log("value: [%i] %u ", ru32==vu32, ru32);
	console.log("value: [%i] %lu", ru64==vu64, ru64);
}
