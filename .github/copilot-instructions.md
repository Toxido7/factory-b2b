# Project rules (factory B2B website)

Monorepo: `server/` (Node 20, Express 5, Prisma 6, PostgreSQL, Zod, Vitest + supertest) and `client/` (React 19, Vite 8, Tailwind 4, React Router 8, axios, react-hook-form + Zod, react-i18next). Plain JavaScript, ES modules, no TypeScript. Windows + PowerShell.

## Never

- Never edit or print any `.env` file. Never run `npm audit fix`, `--force` or `--legacy-peer-deps`.
- Never rename, move or delete files unless asked. No refactoring, no "improvements" outside the task.
- Never install a package without being told, and always pin exact versions (`--save-exact`).
- Never change a test to make it pass: if a test fails, show the failure and explain it.

## Backend (`server/`)

- Layers: routes -> controller -> service -> repository. Only repositories touch Prisma.
- Success: `{ success: true, data }`. Errors: `{ success: false, error: { message, details } }`. Validation with Zod via `validate(schema)`, read `req.validated.body/.query/.params`.
- Money: Prisma Decimal in the database, string with 2 decimals in JSON, never Float. Prices always recalculated on the server.
- Style: single quotes, semicolons, trailing commas, ~100 columns. Run `npm run lint` and `npm test`.
- Tests: Vitest + supertest, `resetDb()` in `beforeEach`, helpers in `tests/helpers/`. Always report the exact passing test count.

## Frontend (`client/`)

- Folders: `src/api`, `src/app` (router, guards), `src/components`, `src/layouts`, `src/features/<name>`, `src/i18n`, `src/lib`.
- The site is in FRENCH. Never write visible text directly in a component: use `t('key')` from react-i18next and add the key to `src/i18n/fr.json`. Wording: always "liste de demande", never "panier". Prices as `1 250,00 TND`, dates as `26/10/2026` (use `src/lib/format.js`).
- Colors only from Tailwind tokens in `src/index.css` (`bg-navy`, `text-accent`, ...). Never write a hex color in a component.
- API calls only through `src/api/client.js` (single-flight refresh). Access token stays in memory, never in localStorage.
- Forms: react-hook-form + Zod. Server data: TanStack Query (from stage F3). Every page handles 4 states: loading, empty, error (with retry), success.
- Accessibility: labels on inputs, visible focus, buttons are `<button>`, links are `<Link>`. Animations only on opacity/transform, 150-300 ms, respect `prefers-reduced-motion`.
- Match the approved mockup style: IBM Plex Sans, rounded cards, pill buttons, navy + orange.

## Output

When you finish a task, list the changed files and the result of the commands you ran (`npm test` count, `npm run build`).
