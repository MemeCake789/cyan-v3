# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

Cyanv3 is a Svelte 5 + Vite web app with a dark TUI aesthetic. Multi-tab windowing system with apps: Cyanide (games), Sulfur (chat), Flouride (AI), and Chromium (proxy browser).

### Single-File Build & about:blank Context

- Compiled to a **single HTML file** via `vite-plugin-singlefile`, embedded in `about:blank` or restricted environments
- `window.location` has `about:` protocol or `null` origin — CORS applies
- `main.js` patches `fetch` and `XMLHttpRequest` through EpoxyTransport before mounting the app
- `localStorage` may not persist; `window.open()` and secure-context APIs may not work
- App modules (including firebase) are dynamically imported AFTER proxy patches are applied

## Build Commands

```bash
npm run dev        # dev server
npm run build      # production build -> dist/
npm run preview    # preview production build
```

## Lint / Typecheck

No linter or typecheck script is configured. The project uses `jsconfig.json` with `checkJs: true` for type checking in editors but there is no `npm run lint` or `npm run typecheck` command. If you add one, prefer `svelte-check` for Svelte type errors.

## Tests

No test framework is installed. To add tests:
- `npm install -D vitest`
- Single test: `npx vitest run src/path/to/test.ts`
- All tests: `npx vitest run`
- Watch: `npx vitest`

## Code Style

### General

- **Language**: JS/TS mix with Svelte 5 (runes mode). `checkJs` is enabled — write JSDoc or use `.ts` files for types.
- **Modules**: ES modules (`"type": "module"`)
- **Indentation**: 4 spaces
- **Quotes**: Single quotes in JS/TS, double quotes in Svelte HTML attributes
- **Semicolons**: Used (present in all existing code)

### Imports

```typescript
// Order: external libs -> svelte -> internal modules -> styles
import { writable } from 'svelte/store';
import { onMount } from 'svelte';
import { windows } from './windows';
import './app.css';

// Use explicit .svelte extension for component imports
import Home from './Home.svelte';
```

### Naming Conventions

- **Components**: PascalCase — `GameCard.svelte`, `Sidebar.svelte`
- **Stores/Modules**: camelCase — `windows.js`, `stores.ts`, `chatApi.ts`
- **Variables/Functions**: camelCase
- **CSS Variables**: kebab-case with `--` prefix — `--bg-color`, `--accent-cyan`
- **Types/Interfaces**: PascalCase — `WindowState`, `ChatConfig`

### Svelte 5 Conventions

This codebase uses a mix of Svelte 4 and 5 syntax. Follow the pattern of the file you're editing:

```svelte
<script lang="ts">
    // Props — both patterns exist in the codebase:
    // Older style (still in use):
    export let windowId: number;
    // Runes style (preferred for new code):
    let { windowId, gameTitleContext }: { windowId: number; gameTitleContext?: string } = $props();

    let isActive = $state(false);
    let displayName = $derived(formatName(name));
</script>
```

Events: existing code uses `on:click` and `on:launch` with `createEventDispatcher`. When writing new code, follow the same pattern unless converting a component fully to runes.

### CSS / Styling

- CSS variables defined in `src/app.css` — always use them for colors, spacing, fonts
- Component-scoped `<style>` blocks; global overrides via `:global()` selector
- Dark theme only. Colors: bg `#000`, surface `#111`, border `#333`, accent `#50e3c2`
- Font: `DM Mono` monospace throughout
- Layout: flexbox preferred, no CSS framework

### Error Handling

```typescript
try {
    const response = await fetch(url);
    const data = await response.json();
} catch (error) {
    console.error('[component] operation failed:', error);
    // Provide fallback UI or state
}
```

Use `[module]` prefix in log messages for debugging: `console.log('[proxy] initializing...')`

### TypeScript

- `checkJs: true` and `verbatimModuleSyntax: true` in jsconfig.json
- Use explicit types on function params and return values
- Use `import type` for type-only imports (enforced by verbatimModuleSyntax)
- Define interfaces for complex objects, especially store payloads

### File Organization

```
src/
├── *.svelte          # Components (PascalCase)
├── *.ts / *.js       # Modules (camelCase)
├── app.css           # Global styles + CSS variables
├── main.js           # Entry point (proxy init -> mount)
├── stores.ts         # Global Svelte stores
└── windows.js        # Window/tab state
```

### State Management

- Svelte stores (`writable`) for global state: `stores.ts`, `windows.js`
- Component-local: `$state` / `$derived`
- Stores are subscribed to with `$store` syntax in templates

### Security

- Firebase config is public (client-side) — this is intentional
- Proxy patches fetch/XHR for restricted environments
- Never use `eval()` or `new Function()` with user input
- Don't commit `.env` or secrets

### Git

- Do not commit unless explicitly asked
- Keep commits focused on single concerns
- Never commit `.env` files or API keys
