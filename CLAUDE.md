# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A single-page business/operations dashboard (customers, tasks, hauls, finances, stock, products, notes) served as static files with no build step. It's a "Back to Site" sub-page of a larger site, not a standalone app.

## Files

- `index.html` — full DOM for every view (all views are present in the page at once; switching views toggles visibility, there is no router).
- `style.css` — all styling, including a CSS-custom-property theme system (`:root` variables + `[data-theme]` overrides).
- `script.js` — all application logic (single file, ~3000 lines, no modules).
- `user.jpg` — static asset.

There is no `package.json`, build tool, bundler, linter, test runner, or dev server config in this repo.

## Running / developing

There is no build step. Open `index.html` directly in a browser, or serve the folder with any static file server, e.g.:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. `index.html` and `script.js` are cache-busted with a manual `?v=N` query string on their `<script>`/`<link>` tags — bump that version number when editing `style.css` or `script.js` so browsers don't serve a stale cached copy.

There are no automated tests or lint configs. Verify changes by loading the page in a browser and exercising the affected view.

## Architecture

**External dependencies (loaded via CDN in `index.html`, no local install):**
- Chart.js — overview/finances/products charts
- Supabase JS client (`@supabase/supabase-js@2`) — this is the sole backend/data layer (Postgres + realtime), configured at the top of `script.js` with `SUPABASE_URL`/`SUPABASE_ANON_KEY`
- Google Fonts (Inter) and Material Symbols icons

**Views, not routes.** All dashboard views (`overview`, `customers`, `tasks`, `haul`, `finances`, `stock`, `products`, `notes`, `settings`) exist simultaneously in `index.html` as `.dashboard-view` elements and are shown/hidden by `switchView()` in `script.js`. Sidebar nav items carry `data-view="..."` attributes that map to these view element IDs.

**Data flow per domain (customers, tasks, hauls, haul_expenses, haul_income, products, notes, stats):** each domain follows the same pattern in `script.js`:
1. `init<Domain>()` — loads data from Supabase into a module-level array (e.g. `customers`, `tasks`, `hauls`, `products`, `notes`) and wires up form/modal event listeners.
2. `load<Domain>()` — `supabaseClient.from("<table>").select(...)`, populates the array.
3. `render<Domain>()` — rebuilds the relevant DOM (tables/lists/cards) from the in-memory array.
4. CRUD actions (add/edit/delete via modals) call `supabaseClient.from("<table>").insert/update/delete(...)`, then re-`load` + re-`render`.
5. `subscribeToRealtimeUpdates()` (called once at startup) opens a Supabase Realtime channel per table; any Postgres change re-runs the relevant `load`/`render` calls so the UI stays in sync across tabs/devices without a manual refresh.

Several domains are cross-linked and their renders cascade on change (e.g. a `products` change also re-renders stock, haul detail, customers, and the products page; a `hauls` change re-renders stock). When adding a new mutation to an existing table, check `subscribeToRealtimeUpdates()` to see what else needs to re-render.

**Hauls** are the central cost/revenue grouping: a haul has `haul_expenses` and `haul_income` line items, and both `customers` and `products` can be linked to a haul via `haul_id`. Finance totals (`getOverallFinanceTotals`, `computeHaulStats`) are derived client-side from these in-memory arrays rather than via Supabase views/RPCs.

**Legacy local data:** `migrateLegacyLocalData()` runs once at startup to migrate any pre-Supabase `localStorage`-based data into Supabase. `localStorage` today is only used for small UI prefs (e.g. sidebar collapsed state) — the theme is hardcoded to dark in `initTheme()`.

**No dedicated auth layer visible in this code** — Supabase is accessed with the public anon key directly from the client.
