// https://svelte.dev/docs/kit/adapter-static
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			/*
				The directory to write prerendered pages to. It defaults to build.
			*/
			pages: 'build',
			/*
				The directory to write static assets (the contents of static, plus client-side JS and CSS generated by SvelteKit) to. Ordinarily this should be the same as pages, and it will default to whatever the value of pages is, but in rare circumstances you might need to output pages and assets to separate locations.
			*/
			assets: 'build',
			/*
				Specify a fallback page for SPA mode, e.g. index.html or 200.html or 404.html.
				https://svelte.dev/docs/kit/single-page-apps
			*/
			fallback: undefined,
			/*
				If true, precompresses files with brotli and gzip. This will generate .br and .gz files.
			*/
			precompress: true,
			/*
				By default, adapter-static checks that either all pages and endpoints (if any) of your app were prerendered, or you have the fallback option set. This check exists to prevent you from accidentally publishing an app where some parts of it are not accessible, because they are not contained in the final output. If you know this is ok (for example when a certain page only exists conditionally), you can set strict to false to turn off this check.
			*/
			strict: true
		})
	}
};

export default config;
