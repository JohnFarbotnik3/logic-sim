import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	plugins: [ sveltekit(), wasm(), topLevelAwait() ],
	assetsInclude: ["**/*.wasm"],
	build: {
		assetsInlineLimit: 4096	// default: 4096 (4 KiB)
	},
});
