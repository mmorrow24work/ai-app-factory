# design-system

The Appearance (light/dark) toggle, named colour palette picker, and Typography (font family +
text size) picker built for `ai-app-factory`'s own dashboard (issue #29, ported from
`uk-wealth-tracker`), packaged here as a reusable asset — issue #30.

## What this is not

**Not auto-applied by `factory-new.sh`.** None of the three current project types
(`nautobot-app`, `netbox-plugin`, `custom-script`) include a SvelteKit frontend of their own —
`nautobot-app`/`netbox-plugin` render through Nautobot's/NetBox's own UI framework, and
`custom-script` is typically UI-less or a hand-written static site with no build step. Dropping
these files into any of today's three templates does nothing on its own.

This exists so the design system is built once and referenced, not reinvented, for whenever a
generated project *does* need a SvelteKit frontend (a future web-app template type, or a
`custom-script` project that happens to include one) — copy it in by hand at that point.

## What's in here

```
src/app.css                   Full token system: shadcn-style HSL custom properties, 7 named
                               palettes (male/female/football/cricket/beach/country/city) each
                               with light+dark variants plus the default, WCAG-AA verified, the
                               Tailwind v4 @theme mapping, and the --text-scale/--app-font-family
                               typography tokens.
src/app.html.tmpl             Pre-hydration <script> blocks that apply the stored theme/palette/
                               typography choice before Svelte hydrates, so there's no flash of
                               the wrong appearance. Needs {{PROJECT_NAME}} substituted.
src/lib/theme.js.tmpl         Light/dark store + toggle logic. Needs {{PROJECT_NAME}} substituted.
src/lib/palette.js.tmpl       Named-palette store + toggle logic. Needs {{PROJECT_NAME}} substituted.
src/lib/typography.js.tmpl    Font family + text size store + toggle logic. Needs {{PROJECT_NAME}}
                               substituted.
src/lib/utils.js              cn() helper (clsx + tailwind-merge) -- no placeholders.
src/lib/ui/button.svelte      shadcn-svelte Button: variant/size classes from pure semantic
                               tokens (bg-primary, bg-destructive, ...), never a hardcoded color.
src/lib/ThemeToggleButton.svelte    Nav-accessible light/dark quick toggle.
src/lib/ThemeSettings.svelte        Settings-page section for the toggle above.
src/lib/PaletteSettings.svelte      Settings-page section for the palette picker.
src/lib/TypographySettings.svelte   Settings-page section for the font family / text size picker.
```

Deliberately **not** included: the self-hosted webfont options (`accessible`/`handwritten`/
`spooky`) — the four font families here (`sans`/`serif`/`rounded`/`mono`) all resolve to system
font stacks, no `@fontsource` package or bundled font file needed. Also not included: any print
stylesheet.

## Wiring it into a fresh SvelteKit project

1. Copy `src/app.css` in as-is (merge with anything already there rather than overwrite).
2. Copy `src/app.html.tmpl` → the target's `src/app.html`, `src/lib/*.js.tmpl` → the target's
   `src/lib/*.js`, substituting `{{PROJECT_NAME}}` for the real project name by hand (a plain
   find-and-replace — there is no script that does this for `design-system/`, unlike the three
   project-type templates `factory-new.sh` does substitute automatically).
3. Copy the remaining `src/lib/*` files in as-is.
4. `npm install clsx tailwind-merge` (needed by `utils.js`'s `cn()`). Confirm the target project
   is already on Tailwind v4 — this design system's `@theme` mapping in `app.css` assumes it.
5. Add `ThemeToggleButton` to the nav/header, and `ThemeSettings`/`PaletteSettings`/
   `TypographySettings` to a Settings page (or equivalent) — see `ai-app-factory`'s own
   `site/src/routes/+layout.svelte` and `site/src/routes/settings/+page.svelte` for a worked
   example of both.

## Verifying it renders

Since no current template type consumes this automatically, there's no `factory-new.sh`
integration test for it. Verify by hand: copy the files into a throwaway SvelteKit + Tailwind v4
project per the steps above, substitute the placeholders, `npm run dev`, and confirm the light/dark
toggle, all 7 named palettes (light and dark), and the font family / text size picker each work
and apply immediately.
