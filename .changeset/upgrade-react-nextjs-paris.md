---
"happiness": minor
---

Upgrade to React 19, Next.js 16, Paris 0.17, and TypeScript 5.9

- React 18 → 19, React DOM 18 → 19
- Next.js 13 → 16 (with Turbopack as default bundler)
- Paris 0.8 → 0.17 (migrated all color/token references to `new.*` namespace)
- TypeScript 5.2 → 5.9, react-markdown 8 → 10
- Migrated middleware.ts → proxy.ts (Next.js 16 convention)
- Applied async params/headers codemods for Next.js 15+ compatibility
- Configured Turbopack SVGR loader alongside existing webpack config
- Regenerated public/paris.css from Paris 0.17 LightTheme via pte CLI
- Fixed React 19 type breakages (JSX.IntrinsicElements, Buffer, Suspense)
- Removed stale @headlessui/react override (Paris now uses v2)
