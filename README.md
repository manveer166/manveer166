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
- Medical records — upload PDFs/images/text, optional extracted text
- Apple Health import — upload `export.xml` and we parse numeric samples
- AI assistant (Claude) grounded in your profile + records + latest vitals
- Health lookup — one-click search across WebMD, Mayo Clinic, MedlinePlus, Drugs.com

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase — auth (magic link), Postgres, Storage
- Anthropic SDK — `claude-opus-4-7` streaming
- Single-user lock via `ALLOWED_EMAIL`

## Setup

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
