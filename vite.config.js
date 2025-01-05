import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
	],
	//assetsInclude: ["**/*.wasm"],
	build: {
		assetsInlineLimit: 65536	// default: 4096 (4 KiB)
	},
});
