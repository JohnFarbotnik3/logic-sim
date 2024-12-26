import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	plugins: [ sveltekit(), topLevelAwait() ],
	assetsInclude: ["**/*.wasm"],
	build: {
		assetsInlineLimit: 4096	// default: 4096 (4 KiB)
	},
});
