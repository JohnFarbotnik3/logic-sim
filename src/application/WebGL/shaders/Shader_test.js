import { ShaderConfig } from "../Shader";
import { GL2 } from "../../environment";

export const Shader_test = new ShaderConfig({
	attribs: [
		{ name: "pos", type: GL2.FLOAT			, numComponents: 3, normalize: false },
		{ name: "clr", type: GL2.UNSIGNED_INT	, numComponents: 1, normalize: false },
		{ name: "tex", type: GL2.FLOAT			, numComponents: 2, normalize: false },
	],
	uniforms: [
		{ name: "mvp" },
		{ name: "texsampler" },
	],
	vertSource:`#version 300 es
		uniform			mat4	mvp;
		in				vec4	pos;
		in				uint	clr;
		in				vec2	tex;
		out		lowp	vec4	fragclr;
		out		highp	vec2	fragtex;
		void main() {
			gl_Position = mvp * pos;
			${ShaderPackingUtil.unpack_rgba_8bit("fragclr", "clr")}
			fragtex = tex;
		}
	`,
	fragSource: `#version 300 es
		uniform			sampler2D	texsampler;
		in		lowp	vec4		fragclr;
		in		highp	vec2		fragtex;
		out		lowp	vec4		outclr;
		void main() {
			outclr = fragclr * (1.0 - 0.8*texture(texsampler, fragtex));
		}
	`,
});

