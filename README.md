# RAMS — Road Asset Management System

A road-asset / pavement-condition management app for Ethiopian federal & city
corridors: inventory, PCI condition scoring, defect register, maintenance
programme optimizer, work-order board, field inspection form, and reports.

This is a standalone export of the app as verified working on Macaly Cloud
(https://ql1t9guenddxori9ym4iqt7m.macaly.dev/), with Macaly-specific platform
glue removed so it runs anywhere.

## Run it

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Stack

TanStack Start + React 19 + Tailwind v4 + Zustand (client-side state,
persisted to localStorage) + Leaflet/react-leaflet (map) + Recharts (charts).
No database and no auth — all data lives in the browser, seeded from
`src/lib/rams/seed.ts`. Use the "Reset demo data" button in the sidebar to
restore the seed.

## Notes

- The "Ask engineering advisor" button (road detail page) calls a server
  function (`src/lib/rams/advise.ts`) that's stubbed to always return
  "not available" — the original called a third-party AI API with a key
  that isn't included here. Wire in your own provider if you want it live.
- Four small data-entry bugs in the original seed data (3 inspections
  missing `sectionId`/`date`/`inspector`, 1 defect missing `type`) have
  been fixed here — they were caught by `tsc --noEmit`, which the app's
  build pipeline doesn't run by default.
