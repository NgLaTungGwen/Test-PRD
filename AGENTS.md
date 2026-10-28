# AGENTS.md

## Project

Test-PRD — a Vite + React (TypeScript) application.

## How to run

- Boot the application: `npm start`
- Ready at: http://127.0.0.1:5173/

## How to test

- Run the suite: `npm test`
- List the collected tests: `npx vitest list`

## Layout

- `index.html` — Vite entry document
- `src/main.tsx` — React entry point
- `src/App.tsx` — root component
- `src/smoke.spec.ts` — smoke test
- `vite.config.ts` — dev server configuration (host `127.0.0.1`, port `5173`)
- `vitest.config.ts` — test runner configuration
