<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md

### Do
- use our component library v3 (ensure code is v3-compatible); do NOT use Material UI
- use emotion `css={{}}` prop format for styling
- use MobX for state management with `useLocalStore`
- use design tokens from `DynamicStyles.tsx` (or `app/lib/theme/tokens.ts`) for all styling — no hard coding
- use ApexCharts for charts; do not supply custom HTML wrappers
- default to small components
- default to small diffs

### Don't
- do not hard code colors
- do not use raw `div` if a specific component exists
- do not add new heavy dependencies without approval

### Commands
Existing package scripts (see `package.json`):

```bash
npm run dev    # next dev
npm run build  # next build
npm run start  # next start
npm run lint   # eslint
```

```bash
# Type-check a file
npm run tsc --noEmit path/to/file.tsx

# Format a file
npm run prettier --write path/to/file.tsx

# Fix lint errors for a file
npm run eslint --fix path/to/file.tsx

# Prisma
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio
```

### Safety and permissions

Allowed without prompt:
- read files, list files
- tsc single file, prettier, eslint
- vitest single test

Ask first:
- package installs
- git push
- deleting files, chmod
- running full build or end-to-end suites

### Project structure
- Next.js App Router under `src/app` (pages/routes live there)
- shared utilities in `src/lib` (e.g., `src/lib/prisma.ts`)
- components (if present) should live under `src/app/components` or `src/components`
- this repository currently does not include a centralized design system package (`@acme/ui`) or a `DynamicStyles.tsx` file — if you add one, place design tokens at `src/app/lib/theme/tokens.ts` or `src/lib/theme/tokens.ts`

### Good and bad examples
- avoid class-based components like `Admin.tsx`
- use functional components with hooks like `Projects.tsx`
- forms: copy `app/components/Form.Field.tsx` and `app/components/Form.Submit.tsx`
- charts: copy `app/components/Charts/Bar.tsx` and `app/lib/chartTheme.ts`
- data layer: use `app/api/client.ts`. do not fetch in components

### API docs
- docs in `./api/docs/*.md`
- list projects - `GET /api/projects` using `app/api/client.ts`
- update project name - `PATCH /api/projects/:id` using `client.projects.update`

### PR checklist
- format and type check: green
- unit tests: green. add tests for new code paths
- diff: small with a brief summary

### When stuck
- ask a clarifying question, propose a short plan, or open a draft PR with notes

### Test first mode
- write or update tests first on new features, then code to green

### Design system
- This repo does not currently include `@acme/ui` or an internal design system. Recommended options:
	- Add a `src/lib/theme/tokens.ts` (or `src/app/lib/theme/tokens.ts`) that exports color, spacing, and typography tokens.
	- Add a `DynamicStyles.tsx` wrapper for theme tokens if you prefer a component-based token provider.
	- Use `emotion` with the `css={{}}` prop format as noted above.

When a design system is added, update this file with the exact import paths and any publisher/package names.

<!-- END:nextjs-agent-rules -->
