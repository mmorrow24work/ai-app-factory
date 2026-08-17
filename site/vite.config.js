import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Tailwind v4's own Vite plugin must come before sveltekit() so it sees .css files first.
	plugins: [tailwindcss(), sveltekit()]
});
