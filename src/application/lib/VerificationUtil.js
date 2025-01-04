
export class VerificationUtil {
	static verifyObjectEntriesDefined(obj) {
		for(const [k,v] of Object.entries(obj)) if(v===undefined | v===null) throw(`property ${k} is ${v}.`);
	}
	
	static verifyType_boolean(obj, type) {
		return obj?.constructor === type;
	}
	static verifyType_message(obj, type) {
		return `object has constructor <${obj.constructor.name}>, expected <${type.name}>.`;
	}
	static verifyType_throw(obj, type) {
		if(!VerificationUtil.verifyType_boolean(obj, type)) throw(VerificationUtil.verifyType_message(obj, type));
	}
	
	static verifyTypes_boolean(objs, types) {
		if(objs.length !== types.length) return false;
		for(let i=0;i<objs.length;i++) if(!VerificationUtil.verifyType_boolean(objs[i], types[i])) return false;
		return true;
	}
	static verifyTypes_throw(objs, types) {
		if(objs.length !== types.length) throw(`number of objects (${objs.length}) and number of types (${types.length}) do not match`);
		const inds = [];
		for(let i=0;i<objs.length;i++) if(!VerificationUtil.verifyType_boolean(objs[i], types[i])) inds.push(i);
		if(inds.length > 0) throw(inds.map(i => VerificationUtil.verifyType_message(objs[i], types[i])).join("\n"));
	}
	
	static getConstructorOverloadIndex_throw(args, typeLists) {
		for(let i=0;i<typeLists.length;i++) if(VerificationUtil.verifyTypes_boolean(args, typeLists[i])) return i;
		const constructors = [];
		for(const arg of args) constructors.push(arg?.constructor.name);
		throw(`no constructor overload found for arguments: ${JSON.stringify({args, constructors})}`);
	}
};
