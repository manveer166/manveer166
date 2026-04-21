import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "health.db");

let _db: Database.Database | null = null;
export function db(): Database.Database {
  if (_db) return _db;
  const d = new Database(DB_PATH);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  migrate(d);
  _db = d;
  return d;
}

function migrate(d: Database.Database) {
  d.exec(`
    create table if not exists medications (
      id text primary key,
      name text not null,
      dosage text,
      schedule text,
      benefits text,
      side_effects text,
      instructions text,
      started_on text,
      active integer not null default 1,
      notes text,
      created_at text not null default (datetime('now'))
    );
    create table if not exists allergies (
      id text primary key,
      allergen text not null,
      severity text check (severity in ('mild','moderate','severe')),
      reaction text,
      notes text,
      created_at text not null default (datetime('now'))
    );
    create table if not exists records (
      id text primary key,
      title text not null,
      kind text,
      taken_on text,
      storage_path text not null,
      mime_type text,
      notes text,
      extracted_text text,
      created_at text not null default (datetime('now'))
    );
    create table if not exists vitals (
      id text primary key,
      type text not null,
      value real not null,
      unit text,
      measured_at text not null,
      source text
    );
    create index if not exists vitals_type_time on vitals (type, measured_at desc);

    create table if not exists chat_messages (
      id text primary key,
      role text not null check (role in ('user','assistant')),
      content text not null,
      created_at text not null default (datetime('now'))
    );
    create index if not exists chat_time on chat_messages (created_at);

    create table if not exists food_entries (
      id text primary key,
      eaten_at text not null,
      meal text check (meal in ('breakfast','lunch','dinner','snack','drink')),
      description text not null,
      calories integer,
      notes text,
      flagged_allergens text,
      created_at text not null default (datetime('now'))
    );
    create index if not exists food_time on food_entries (eaten_at desc);

    create table if not exists symptoms (
      id text primary key,
      occurred_at text not null,
      description text not null,
      severity integer check (severity between 0 and 10),
      mood integer check (mood between 1 and 5),
      notes text,
      created_at text not null default (datetime('now'))
    );
    create index if not exists symptoms_time on symptoms (occurred_at desc);

    create table if not exists medication_doses (
      id text primary key,
      medication_id text not null references medications(id) on delete cascade,
      taken_at text not null,
      skipped integer not null default 0,
      notes text,
      created_at text not null default (datetime('now'))
    );
    create index if not exists doses_med_time on medication_doses (medication_id, taken_at desc);
  `);
}

export function uuid(): string {
  return (globalThis.crypto ?? require("node:crypto")).randomUUID();
}

// Typed rows --------------------------------------------------------------

export type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  schedule: string | null;
  benefits: string | null;
  side_effects: string | null;
  instructions: string | null;
  started_on: string | null;
  active: number;
  notes: string | null;
  created_at: string;
};

export type Allergy = {
  id: string;
  allergen: string;
  severity: "mild" | "moderate" | "severe" | null;
  reaction: string | null;
  notes: string | null;
  created_at: string;
};

export type RecordRow = {
  id: string;
  title: string;
  kind: string | null;
  taken_on: string | null;
  storage_path: string;
  mime_type: string | null;
  notes: string | null;
  extracted_text: string | null;
  created_at: string;
};

export type Vital = {
  id: string;
  type: string;
  value: number;
  unit: string | null;
  measured_at: string;
  source: string | null;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type FoodEntry = {
  id: string;
  eaten_at: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack" | "drink" | null;
  description: string;
  calories: number | null;
  notes: string | null;
  flagged_allergens: string[] | null;
  created_at: string;
};

export type SymptomRow = {
  id: string;
  occurred_at: string;
  description: string;
  severity: number | null;
  mood: number | null;
  notes: string | null;
  created_at: string;
};

export type Dose = {
  id: string;
  medication_id: string;
  taken_at: string;
  skipped: number;
  notes: string | null;
  created_at: string;
};

// Query helpers -----------------------------------------------------------

export const q = {
  medications: () =>
    db()
      .prepare("select * from medications order by active desc, name")
      .all() as Medication[],
  activeMedications: () =>
    db().prepare("select * from medications where active=1 order by name").all() as Medication[],
  allergies: () =>
    db().prepare("select * from allergies order by allergen").all() as Allergy[],
  records: (limit = 50) =>
    db()
      .prepare("select * from records order by taken_on desc nulls last, created_at desc limit ?")
      .all(limit) as RecordRow[],
  vitalsSince: (sinceIso: string) =>
    db()
      .prepare("select * from vitals where measured_at >= ? order by measured_at asc limit 20000")
      .all(sinceIso) as Vital[],
  vitalsRecent: (limit = 200) =>
    db()
      .prepare("select * from vitals order by measured_at desc limit ?")
      .all(limit) as Vital[],
  foodRecent: (limit = 30) =>
    db()
      .prepare("select * from food_entries order by eaten_at desc limit ?")
      .all(limit) as FoodEntry[],
  foodSince: (sinceIso: string) =>
    db()
      .prepare("select * from food_entries where eaten_at >= ? order by eaten_at asc")
      .all(sinceIso) as FoodEntry[],
  symptomsRecent: (limit = 30) =>
    db()
      .prepare("select * from symptoms order by occurred_at desc limit ?")
      .all(limit) as SymptomRow[],
  symptomsSince: (sinceIso: string) =>
    db()
      .prepare("select * from symptoms where occurred_at >= ? order by occurred_at desc")
      .all(sinceIso) as SymptomRow[],
  chatHistory: (limit = 40) =>
    db()
      .prepare("select * from chat_messages order by created_at asc limit ?")
      .all(limit) as ChatMessage[],
  dosesSince: (sinceIso: string) =>
    db()
      .prepare("select * from medication_doses where taken_at >= ? order by taken_at desc")
      .all(sinceIso) as Dose[],
  count: (table: string): number => {
    const row = db().prepare(`select count(*) as n from ${table}`).get() as { n: number };
    return row.n;
  },
  countActiveMeds: (): number => {
    const row = db().prepare("select count(*) as n from medications where active=1").get() as {
      n: number;
    };
    return row.n;
  },
  countFoodSince: (sinceIso: string): number => {
    const row = db()
      .prepare("select count(*) as n from food_entries where eaten_at >= ?")
      .get(sinceIso) as { n: number };
    return row.n;
  },
};

export function deserializeFood(
  row: Omit<FoodEntry, "flagged_allergens"> & { flagged_allergens: unknown },
): FoodEntry {
  const raw = row.flagged_allergens;
  const flagged: string[] | null =
    typeof raw === "string" && raw.length > 0 ? (JSON.parse(raw) as string[]) : null;
  return { ...row, flagged_allergens: flagged };
}
