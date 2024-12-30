import { ShaderConfig } from "../Shader";
import { GL2 } from "../../environment";

export const Shader_pos_clr = new ShaderConfig({
	attribs: [
		{ name: "pos", type: GL2.FLOAT			, numComponents: 3, normalize: false },
		{ name: "clr", type: GL2.UNSIGNED_INT	, numComponents: 1, normalize: false },
	],
	uniforms: [
		{ name: "mvp" },
	],
	vertSource:`#version 300 es
		in			vec4		pos;
		in			uint		clr;
		uniform		mat4		mvp;
		out			lowp vec4	fragclr;
		void main() {
			gl_Position = mvp * pos;
			${ShaderPackingUtil.unpack_rgba_8bit("fragclr", "clr")}
		}
	`,
	fragSource: `#version 300 es
		in			lowp vec4	fragclr;
		out			lowp vec4	outclr;
		void main() {
			outclr = fragclr;
		}
	`,
});

