# PaintTracker

Mobile-first MVP for tracking miniature painting progress.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth (Google)
- Supabase Postgres + Prisma ORM
- Next.js route handlers for backend APIs
- Zod validation on all write endpoints

## Progress Model
- Mini progress: completed stages / 5
- Squad progress: average of mini progress in squad
- Army progress: average of all mini progress in the army
- Overall dashboard progress: average of all mini progress across all armies

## Data Model
- `Army`: `id`, `userId`, `name`, `createdAt`, `updatedAt`
- `Squad`: `id`, `userId`, `armyId`, `name`, `createdAt`, `updatedAt`
- `Mini`: `id`, `userId`, `squadId`, `name`, `description?`, `tags?` (JSON string array), stage booleans, stage timestamps, `createdAt`, `updatedAt`

Stage fields on `Mini`:
- Booleans: `assembled`, `primed`, `painted`, `based`, `photographed`
- Timestamps: `assembledAt`, `primedAt`, `paintedAt`, `basedAt`, `photographedAt`

Toggle behavior:
- Toggle `true`: sets corresponding timestamp to current time
- Toggle `false`: sets corresponding timestamp to `null`
- `updatedAt` updates automatically

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and fill values:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Apply migration to your Supabase database:
   ```bash
   npm run prisma:deploy
   ```
5. Enable RLS + policies:
   - Open Supabase SQL Editor.
   - Run SQL from `prisma/rls.sql`.
6. Start dev server:
   ```bash
   npm run dev
   ```

## Supabase Setup
1. Create a Supabase project.
2. In **Project Settings → API**, copy:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In **Project Settings → Database**, copy:
   - **Prisma/transaction (pooler)** connection string -> `DATABASE_URL`
   - **Direct connection** string -> `DIRECT_URL`
4. In **Authentication → Providers → Google**:
   - Enable Google provider.
   - Add Google OAuth client ID/secret.
5. In **Authentication → URL Configuration**, set:
   - Site URL (local): `http://localhost:3000`
   - Redirect URL (local callback): `http://localhost:3000/api/auth/callback`

## Google OAuth Setup
In Google Cloud Console OAuth client settings, add:
- Authorized JavaScript origins:
  - `http://localhost:3000`
  - `https://YOUR_VERCEL_DOMAIN`
- Authorized redirect URIs:
  - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

## Vercel Deploy Notes
1. Import repo into Vercel.
2. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
3. In Supabase Auth URL config, update production URLs:
   - Site URL: `https://YOUR_VERCEL_DOMAIN`
   - Redirect URL: `https://YOUR_VERCEL_DOMAIN/api/auth/callback`
4. Redeploy.

## API Routes
- `GET/POST /api/armies`
- `PATCH/DELETE /api/armies/:id`
- `GET/POST /api/squads`
- `PATCH/DELETE /api/squads/:id`
- `GET/POST /api/minis`
- `PATCH/DELETE /api/minis/:id`
- `POST /api/minis/:id/toggle-stage`
- `GET /api/export?format=json|csv`

## MVP Features Implemented
- Google sign-in / sign-out via Supabase Auth
- Dashboard tree: armies -> squads -> minis (accordion style)
- Create/edit/delete armies, squads, minis via modal dialogs
- Per-mini stage toggles with optimistic UI + server confirmation
- Progress + done counts at mini/squad/army/overall levels
- Export all user data as JSON and CSV
- Mobile-first single-column layout with sticky header actions

## Quality Checks
```bash
npm run lint
npm run build
```
