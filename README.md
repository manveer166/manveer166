# Personal Health Dashboard

A single-user web dashboard for tracking medications, allergies, medical records,
Apple Health vitals, and an AI assistant (Claude) that answers questions grounded
in your own data.

**Not medical advice.** This is an informational tool. For anything urgent,
contact emergency services or your doctor.

## Features

- Dashboard with latest vitals and counts
- Medications — name, dosage, schedule, benefits, side effects, instructions
- Allergies — allergen, severity, reaction
- Food log — manual entries, auto-scanned against your allergies, calorie tally
- Symptom log — severity (0-10), mood (1-5), free text
- Vitals — manual entry for BP, weight, glucose, SpO₂, etc.
- Trends — per-metric daily-average line charts + dashboard sparklines
- Medication dose logging with 14-day adherence dots
- Medical records — upload PDFs/images/text; Claude auto-extracts text + a summary for searchable history
- Apple Health import — upload `export.xml` and we parse numeric samples
- AI assistant (Claude) grounded in your full profile: meds, allergies, food, symptoms, vitals, and extracted record text
- Weekly summary — Claude-generated digest of the past 7 days
- Doctor summary — printable one-pager (Cmd/Ctrl+P → Save as PDF) to bring to appointments
- Health lookup — one-click search across WebMD, Mayo Clinic, MedlinePlus, Drugs.com

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase — auth (magic link), Postgres, Storage
- Anthropic SDK — `claude-opus-4-7` streaming
- Single-user lock via `ALLOWED_EMAIL`

## Auto-deploy from GitHub (one-time setup)

Pushes to `main` deploy to Vercel automatically via `.github/workflows/deploy.yml`. One-time setup: in your Vercel project settings copy `Project ID` and `Team ID` (or your personal `Org ID`), create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens), then add these to GitHub → repo Settings → Secrets and variables → Actions:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ALLOWED_EMAIL`) live in the Vercel project — `vercel pull` picks them up during the workflow.

## Get it live in ~5 minutes

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier). Open the SQL editor, paste `supabase/schema.sql`, and run it. Then in **Authentication → URL Configuration** add `https://YOUR-VERCEL-URL/auth/callback` (and `http://localhost:3000/auth/callback` for local dev) to the redirect allowlist.
2. **Get an Anthropic API key** at [console.anthropic.com](https://console.anthropic.com).
3. **Deploy to Vercel:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/manveer166/manveer166&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ANTHROPIC_API_KEY,ALLOWED_EMAIL)
4. In the Vercel import screen, paste the five env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (from Supabase → Project settings → API)
   - `ANTHROPIC_API_KEY` (from Anthropic console)
   - `ALLOWED_EMAIL` (your email — only this address can sign in)
5. Once deployed, visit the URL, enter your email, click the magic link in your inbox.

## Detailed setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL editor**, paste `supabase/schema.sql`, run it.
3. **Authentication → Email**: enable magic link. Add your app URL to redirect
   allowlist (e.g. `http://localhost:3000/auth/callback` and your deployed URL).
4. **Project settings → API**: copy the project URL, anon key, and service
   role key.

### 2. Anthropic

Get an API key from [console.anthropic.com](https://console.anthropic.com).

### 3. Local dev

```bash
cp .env.example .env.local
# fill in the values
npm install
npm run dev
```

Open http://localhost:3000, sign in with magic link (must match
`ALLOWED_EMAIL`).

### 4. Deploy

Push the repo and deploy to Vercel. Set the same env vars in the Vercel project
settings. Add your deployed URL to the Supabase auth redirect allowlist.

## Apple Health import

On your iPhone: **Health app → profile icon → Export All Health Data**.
You'll get a `export.zip` by email/AirDrop. Unzip it and upload `export.xml`
on the Apple Health page. The parser ingests numeric samples (heart rate,
steps, blood pressure, weight, SpO₂, VO₂ max, etc.).

A large export can have hundreds of thousands of samples — the first import
takes a minute or two.

## Adding more integrations later

Garmin, Fitbit/Google Fit, WHOOP all work the same way: an OAuth route under
`src/app/api/<vendor>/...` that writes into the `vitals` table with a
vendor-specific `source` and `type`. The dashboard and chat will pick them up
automatically.
