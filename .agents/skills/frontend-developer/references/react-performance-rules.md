# React & Next.js Performance Rules

> Source: Vercel Engineering — react-best-practices skill (65 rules, 8 categories)

## Priority 1: Eliminating Waterfalls (CRITICAL)

- **Move await late**: `async-defer-await` — Defer `await` until the branch that uses the result
- **Parallel promises**: `async-parallel` — `Promise.all()` for independent async operations
- **Partial deps**: `async-dependencies` — Use `better-all` when Promise B needs result of A but C doesn't
- **API route promises**: `async-api-routes` — Start promises at function top, `await` at bottom
- **Suspense streaming**: `async-suspense-boundaries` — Wrap slow components in `<Suspense>` to stream content

## Priority 2: Bundle Size Optimization (CRITICAL)

- **No barrel files**: `bundle-barrel-imports` — Import directly from source, never barrel `index.ts`
- **Dynamic imports**: `bundle-dynamic-imports` — `next/dynamic` for heavy components (chart libs, editors)
- **Defer third-party**: `bundle-defer-third-party` — Load analytics/logging AFTER hydration
- **Conditional load**: `bundle-conditional` — Load modules only when feature flag is ON
- **Preload on hover**: `bundle-preload` — Start loading route/chunk on hover/focus for perceived speed

## Priority 3: Server-Side Performance (HIGH)

- **Auth in actions**: `server-auth-actions` — ALWAYS authenticate server actions (they're public endpoints)
- **React.cache()**: `server-cache-react` — Per-request deduplication for shared data
- **LRU cache**: `server-cache-lru` — Cross-request caching for expensive computations
- **Dedup props**: `server-dedup-props` — Don't pass same data to multiple Client Components
- **Hoist I/O**: `server-hoist-static-io` — Module-level for fonts, logos, static assets
- **Minimize serialization**: `server-serialization` — Only pass needed data to client components
- **Parallel fetching**: `server-parallel-fetching` — Restructure components to parallelize
- **after()**: `server-after-nonblocking` — Use `after()` for analytics, logging (non-blocking)

## Priority 4: Client-Side Data Fetching (MEDIUM-HIGH)

- **SWR dedup**: `client-swr-dedup` — Use SWR for automatic deduplication and caching
- **Dedup listeners**: `client-event-listeners` — One global listener, not per-component
- **Passive scroll**: `client-passive-event-listeners` — Always `{ passive: true }` for scroll
- **localStorage**: `client-localstorage-schema` — Version and minimize stored data

## Priority 5: Re-render Optimization (MEDIUM)

Key rules:
- **Defer reads**: Don't subscribe to state only used in callbacks
- **Memoize**: Extract expensive children into `React.memo()` components
- **Derived state**: Subscribe to derived booleans, not raw objects
- **No inline components**: NEVER define components inside components
- **Functional setState**: `setCount(prev => prev + 1)` for stable callbacks
- **startTransition**: Use for non-urgent state updates

## Priority 6-8: Rendering, JS, Advanced (MEDIUM-LOW)

- **content-visibility**: `auto` for off-screen long lists
- **Ternary over &&**: `{x ? <A/> : null}` not `{x && <A/>}`
- **Set/Map lookups**: O(1) instead of array `.includes()`
- **flatMap**: Replace `.filter().map()` with single `.flatMap()`
- **requestIdleCallback**: Defer non-critical work to idle time
