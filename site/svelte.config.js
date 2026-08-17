import adapter from '@sveltejs/adapter-static';

export default {
	compilerOptions: {
		runes: true
	},

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: true
		}),
		paths: {
			// Served from a project-pages URL (mmorrow24work.github.io/ai-app-factory/), not a
			// custom domain, so every asset/link needs this subpath prefix.
			base: process.env.NODE_ENV === 'production' ? '/ai-app-factory' : ''
		}
	}
};
