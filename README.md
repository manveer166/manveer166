# Personal Health Dashboard — local

A single-user web app that tracks medications, allergies, food, symptoms,
vitals, and medical records, with an optional Claude-powered assistant that
answers questions grounded in your own data.

**All data stays on your machine** — SQLite database file + uploaded records
in `./data/`. No cloud, no accounts, no login.

**Not medical advice.** Informational tool only.

## Quick start

```bash
# 1. Install (needs Node 20+)
npm install

# 2. (optional) add your Anthropic key to enable the AI
cp .env.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Run
npm run dev
# → http://localhost:3000
```

That's it. On first load it creates `./data/health.db` and `./data/uploads/`.

## What you get

- **Dashboard** — active-med count, allergy count, record count, food-entries
  in the last 30 days; 30-day sparklines for each vital.
- **Ask my assistant** *(needs Anthropic key)* — Claude streams answers grounded
  in your entire profile (meds, allergies, food, symptoms, vitals, records).
- **Medications** — name, dosage, schedule, benefits, side effects, instructions;
  "Log dose" / "Skipped" buttons; 14-day adherence strip per med.
- **Allergies** — allergen, severity, reaction.
- **Food log** — manual entries auto-scanned against your allergies, with a
  calorie tally.
- **Symptoms** — severity (0–10), mood (1–5), free text.
- **Vitals** — manual entry for BP, HR, weight, SpO₂, glucose, BMI, temp,
  respiratory rate.
- **Trends** — per-metric daily-average charts for the last 180 days.
- **Medical records** — upload PDFs / images / text. With an Anthropic key,
  Claude transcribes + summarizes lab results and flags out-of-range values.
- **Apple Health** — upload `export.xml` and we parse heart rate, steps, weight,
  BP, SpO₂, VO₂ max, sleep, etc. into the `vitals` table.
- **Doctor summary** — a printable one-pager (`⌘/Ctrl-P` → Save as PDF) with
  allergies, current meds, 30-day vital ranges, recent symptoms, recent records.
- **Health lookup** — one-click search across WebMD, Mayo Clinic, MedlinePlus,
  and Drugs.com.

## Apple Health import

On your iPhone: **Health app → profile icon → Export All Health Data**.
You'll get `export.zip` by email / AirDrop. Unzip it and upload `export.xml`
on the Apple Health page. A large export has hundreds of thousands of
samples — the first import takes a minute or two.

## Data location & backups

Everything lives in `./data/`:

- `health.db` — SQLite database (all records, no binaries)
- `uploads/` — original uploaded files

To back up, copy the `data/` folder. To move between machines, copy it over.
To start fresh, delete `data/`.

You can also point somewhere else via `DATA_DIR=/path/to/data` in `.env.local`.

## Production (same machine)

```bash
npm run build
npm start   # serves on :3000
```

## Requirements

- Node 20+
- On Windows, `better-sqlite3` needs the Visual Studio Build Tools
  (`npm install --global windows-build-tools` once).
