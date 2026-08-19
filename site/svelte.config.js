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
			// Served from the custom domain ai-app-factory.coldwire.uk (see the repo-root
			// CNAME file and Settings -> Pages -> Custom domain), at the domain root -- not
			// from the project-pages subpath (mmorrow24work.github.io/ai-app-factory/) this
			// used to assume. A subpath base here would make every built asset URL wrong
			// (/ai-app-factory/_app/... instead of /_app/...) once served from the domain
			// root, breaking the page even after Pages itself is configured correctly.
			base: ''
		}
	}
};
