# Component kit and icon tooling

Research for #50 (parent map #48). Researched 2026-10-01. Versions from `npm view` on that date. Claims marked **verified** were run in a scratch project (Vue 3.5, Vite 8.3.2, Vitest 5.0.3, happy-dom 20.14.5, @vue/test-utils 2.5.1, reka-ui 2.10.5, unplugin-icons 24.0.0), not in this repo.

## TL;DR

| Decision | Pick |
|---|---|
| Primitives | **Reka UI 2.x**: `pnpm --filter @wepush/web add reka-ui` |
| Icons | **unplugin-icons** with **Lucide**, both as devDependencies: `pnpm --filter @wepush/web add -D unplugin-icons @iconify-json/lucide`. Icons are compiled to inline SVG components at build time. No runtime CDN, no `@iconify/vue`. `autoInstall` stays off. |
| Kit folder | `apps/web/src/components/kit/`, one SFC per wrapper, `App*` prefix (`AppDialog`, `AppCollapsible`, `AppTabs`, `AppSelect`, `AppTooltip`, `AppBadge`), matching the existing `AppShell.vue`. There's no `AppIcon` wrapper: import the `~icons/lucide/*` components directly. |
| Styling | `<style scoped>` in each kit SFC, using **semantic tokens for colour/shadow/focus** (scale primitives like space, radius, z, duration are fine), with state from `[data-state]` / `[data-side]` / `[data-disabled]` selectors. Scoped styles do reach the teleported content root (**verified**). Add 1–2 semantic tokens (scrim) rather than touching primitives. |
| Imports | Explicit named imports from `reka-ui`. Skip the unplugin-vue-components resolver, which would add a second plugin and hide imports. |
| Tests | Don't stub teleport. Use `mount(..., { attachTo: document.body })`, then query `document.body` or `wrapper.findComponent(DialogContent)`, and clear `document.body` in `afterEach`. Add `Icons()` to the `web` project in the root `vitest.config.ts`. |

## 1. Reka UI on Vue 3.5 / Vite 8

- **Compat.** reka-ui 2.10.5 has the peer dependency `vue >= 3.4.0` and **no Vite peer** (`npm view reka-ui peerDependencies`). It installed and ran clean against Vite 8.3.2 with no peer warnings (**verified**). Its dependencies include `@floating-ui/vue`, `@vueuse/core` ^14 and `aria-hidden`, all transitive. Source: [github.com/unovue/reka-ui](https://github.com/unovue/reka-ui).
- **Install** is a single package, and auto-import through `reka-ui/resolver` is optional ([reka-ui.com/docs/overview/installation](https://reka-ui.com/docs/overview/installation)).
- **Portals.** Every `*Portal` wraps Reka's own `Teleport.vue`, which takes the props `to` (default `ConfigProvider.teleportTo ?? 'body'`), `disabled` (render inline), `defer` (Vue 3.5+) and `forceMount`. It only renders after `useMounted()` unless `forceMount` is set ([Teleport.vue](https://github.com/unovue/reka-ui/blob/v2/packages/core/src/Teleport/Teleport.vue)). The component is **named `Teleport`**, which matters for tests (§5).
- **Primitives we need:**

| Need (#48) | Primitive | a11y / state notes |
|---|---|---|
| Create via dialog | `Dialog*` | Focus is trapped when modal, Esc closes and focus returns to the trigger, WAI-ARIA dialog pattern, `data-state="open"\|"closed"`. Warns at runtime if Title or Description is missing ([dialog](https://reka-ui.com/docs/components/dialog)). |
| Collapsible sections | `Collapsible*`, or `Accordion*` for grouped sections | `data-state`, plus `--reka-collapsible-content-height` / `--reka-accordion-content-height` for height animation ([styling](https://reka-ui.com/docs/guides/styling)) |
| Hub switch / theme switch | `ToggleGroup` (single) for theme. Hub switch is a plain `RouterLink` nav, not Tabs, because it changes the route. | `data-state="on"\|"off"` |
| In-page sections | `Tabs*` | `data-state="active"\|"inactive"` |
| Filters / form selects | `Select*` | Listbox pattern, typeahead, `position="item-aligned"\|"popper"`, `--reka-select-trigger-width` ([select](https://reka-ui.com/docs/components/select)) |
| Icon-only hints | `Tooltip*` | Needs one `TooltipProvider` at the app root (put it in `App.vue`). `data-state="closed"\|"delayed-open"\|"instant-open"`, `data-side`, `--reka-tooltip-content-transform-origin` ([tooltip](https://reka-ui.com/docs/components/tooltip)) |

## 2. Icons: unplugin-icons vs @iconify/vue

- **Pick unplugin-icons.** `~icons/{collection}/{name}` imports resolve at build time against the locally installed `@iconify-json/*`, and only the icons you use are bundled ([README](https://github.com/unplugin/unplugin-icons)). The `dist/` from a scratch `vite build` contained the inline SVG paths and **zero** `iconify` / API references (**verified**).
- **Why not `@iconify/vue`.** By default it "automatically load[s] icon data … from Iconify API" at runtime. Going offline means `addCollection()` or passing icon data objects by hand ([iconify.design/docs/icon-components/vue](https://iconify.design/docs/icon-components/vue/)). That is more wiring than unplugin-icons and pulls whole collections into the bundle.
- **Version.** unplugin-icons 24.0.0 depends on `unplugin` ^3 and `@iconify/utils` ^3. `@vue/compiler-sfc` is an *optional* peer, already present via `@vitejs/plugin-vue`.
- **Docker / CI.** The `web-build` stage runs a full (non-`--prod`) `pnpm install --frozen-lockfile`, then `vite build`. The runtime image only copies `apps/web/dist` (`Dockerfile`, ADR 0011). So devDependencies are enough, and nothing is fetched at runtime. Keep `autoInstall: false` (the default), because a frozen lockfile can't take auto-installs.
- **Types.** Add `"types": ["unplugin-icons/types/vue"]` to `apps/web/tsconfig.app.json`, or a `/// <reference types="unplugin-icons/types/vue" />` line in `env.d.ts` ([README](https://github.com/unplugin/unplugin-icons)).

## 3. One icon set: Lucide

| Set | Icons | Licence | Grid | npm freshness |
|---|---|---|---|---|
| **Lucide** (`@iconify-json/lucide` 1.2.138) | 1,857 | ISC | 24, stroke | updated 2026-09-30 |
| Tabler (`@iconify-json/tabler` 1.2.41) | 6,220 | MIT | 24, stroke | 2026-09-28 |
| Phosphor (`@iconify-json/ph` 1.2.2) | 9,072 | MIT | 24 | last publish 2024-12 |

The counts and licences come from each package's `info.json`. Lucide is ISC with no attribution requirement ([lucide.dev/license](https://lucide.dev/license)). It covers everything #48 needs: `sun`, `moon`, `sun-moon` (auto), `megaphone` (advertiser), `clapperboard` (creator), `plus`, `x`, `chevron-down`, `tag`, `badge-check`, `users` (all **verified** present). Its single stroke style suits the Kabuki look. Fall back to Tabler only if a glyph is missing.

## 4. Styling with Kabuki tokens

- Reka is unstyled. It exposes state through `data-*` attributes and passes `class` through to the DOM. Teleported content "require[s] deep selectors in scoped styles" ([styling](https://reka-ui.com/docs/guides/styling)). In practice, a scoped class on a Reka part rendered in the kit SFC's own template (for example `DialogContent`, `DialogOverlay`) **does** get the `data-v-*` attribute after teleport (**verified**), so you only need `:deep()` for elements Reka renders internally.
- **Rules:**
  - Colour, shadow and focus come from semantic tokens (`--color-bg-surface-raised`, `--color-border-default`, `--shadow-lg`, `--focus-ring`). Scale primitives (`--radius-lg`, `--space-*`, `--z-overlay` / `--z-modal`, `--duration-normal`, `--ease-out`) are used directly, as the rest of the app does. Never raw `--color-*` primitives.
  - Add new intents to `tokens/semantic.css`, e.g. `--color-bg-scrim: light-dark(oklch(20% 0.02 250 / 0.4), oklch(5% 0.01 250 / 0.7))`, plus badge tones that reuse the existing `*-subtle-bg` / `*-subtle-fg` pairs.
  - Gate animations behind `prefers-reduced-motion: no-preference`, as `base.css` already does.
  - `light-dark()` follows `color-scheme` everywhere, including teleported nodes under `<body>`, so `data-theme` keeps working with no extra work.
- **Layering.** Scoped SFC styles are unlayered, so they beat `@layer components` in `main.css`. Fine for kit internals. Keep the shared `.btn` / `.card` classes in `components.css`.

## 5. Tests under happy-dom + @vue/test-utils

**Verified** in the scratch project:

- Dialog, Tooltip, Select (popper) and Collapsible all mount, open and close under happy-dom.
  - Teleported content lands in `document.body`.
  - `role`, `aria-labelledby`, `aria-expanded` and `data-state` are all set.
  - Focus moves into the content.
  - Esc closes the dialog and emits `update:open`.
  - Floating UI positions aren't meaningful (no layout), so don't assert on coordinates.
- `wrapper.find()` does **not** see teleported nodes. `wrapper.findComponent(DialogContent).find('input')` does, and `setValue` works through it. This matches the [VTU Teleport guide](https://test-utils.vuejs.org/guide/advanced/teleport).
- **Gotcha:** `global.stubs: { teleport: true }` stubs **Reka's component named `Teleport`**, and by default renders nothing (empty `<teleport-stub>`). Adding `renderStubDefaultSlot: true` restores the content, but `aria-hidden` then logs `console.error`s because the content isn't under `body`. **Don't stub teleport.**
- Reka warns when `DialogDescription` is missing. Always render one, or pass `:aria-describedby="undefined"` explicitly.
- The root `vitest.config.ts` `web` project only has `vue()`. It **needs `Icons({ compiler: 'vue3' })`**, otherwise `~icons/*` imports fail to resolve.

## Code sketch

`apps/web/vite.config.ts` (mirror the plugin in the `web` project of the root `vitest.config.ts`):

```ts
import Icons from 'unplugin-icons/vite'
// ...
plugins: [vue(), Icons({ compiler: 'vue3', scale: 1.25 })],
```

`apps/web/src/components/kit/AppDialog.vue`:

```vue
<script setup lang="ts">
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, DialogTrigger } from 'reka-ui'
import IconX from '~icons/lucide/x'

defineProps<{ title: string, description: string }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child><slot name="trigger" /></DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="overlay" />
      <DialogContent class="content">
        <DialogTitle class="title">{{ title }}</DialogTitle>
        <DialogDescription class="desc">{{ description }}</DialogDescription>
        <slot :close="() => (open = false)" />
        <DialogClose class="close" aria-label="Close"><IconX aria-hidden="true" /></DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--color-bg-scrim);
}
.content {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  translate: -50% -50%;
  z-index: var(--z-modal);
  inline-size: min(32rem, 100vw - 2 * var(--space-gutter));
  padding: var(--space-lg);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface-raised);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-lg);
}
.content:focus-visible,
.close:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-ring-offset); }
.title { font-family: var(--font-heading); font-size: var(--font-size-xl); }
.desc { color: var(--color-text-secondary); }
.close { position: absolute; inset-block-start: var(--space-sm); inset-inline-end: var(--space-sm); }

@media (prefers-reduced-motion: no-preference) {
  .overlay[data-state='open'], .content[data-state='open'] { animation: fade-in var(--duration-normal) var(--ease-out); }
  .overlay[data-state='closed'], .content[data-state='closed'] { animation: fade-out var(--duration-fast) var(--ease-out); }
}
@keyframes fade-in { from { opacity: 0; } }
@keyframes fade-out { to { opacity: 0; } }
</style>
```

Icon usage (theme switcher, one icon per theme):

```vue
<script setup lang="ts">
import IconMoon from '~icons/lucide/moon'
import IconSun from '~icons/lucide/sun'
import IconSunMoon from '~icons/lucide/sun-moon'
const icons = { dark: IconMoon, light: IconSun, auto: IconSunMoon } as const
const theme = defineModel<keyof typeof icons>({ required: true })
</script>

<template>
  <button type="button" :aria-label="`Theme: ${theme}`" @click="/* cycle */">
    <component :is="icons[theme]" aria-hidden="true" />
  </button>
</template>
```

Test for a portalled component:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { DialogContent } from 'reka-ui'
import { afterEach, expect, it } from 'vitest'
import AppDialog from './AppDialog.vue'

afterEach(() => { document.body.innerHTML = '' })

it('opens from the trigger and renders in a portal', async () => {
  const wrapper = mount(AppDialog, {
    props: { title: 'New creator', description: 'Add a creator' },
    slots: { trigger: '<button>New</button>', default: '<input name="handle" />' },
    attachTo: document.body,
  })
  await wrapper.get('button').trigger('click')
  await flushPromises()

  expect(document.querySelector('[role="dialog"]')?.getAttribute('data-state')).toBe('open')
  await wrapper.findComponent(DialogContent).get('input').setValue('@mia.cooks')
  wrapper.unmount()
})
```

## Risks / unknowns

- **Presence + CSS animations in tests.** Vitest doesn't load SFC CSS by default, so close animations are skipped and unmount happens immediately. Real-browser exit timing isn't covered. Low risk, but any e2e test should wait on `data-state="closed"` disappearing.
- **Lucide renames.** Lucide occasionally renames glyphs between versions, and `@iconify-json/lucide` ships near-daily. Pin through the lockfile, and a missing icon fails `vite build` loudly, which is the desired behaviour.
- **Vue 3.6 / Vapor.** Not assessed. reka-ui's peer range is `>= 3.4`, and unplugin-icons has an optional `@vue/compiler-vapor` peer.
- **Bundle size.** Reka tree-shakes per primitive. It wasn't measured in-repo, so check the `vite build` output after the first kit PR.
- **Not repo-verified.** Everything marked verified ran in a scratch project, not this pnpm workspace. The first kit PR should confirm `pnpm typecheck` with `unplugin-icons/types/vue`, and the root Vitest run.
