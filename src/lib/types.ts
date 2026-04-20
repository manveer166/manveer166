export type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  schedule: string | null;
  benefits: string | null;
  side_effects: string | null;
  instructions: string | null;
  started_on: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
};

export type Allergy = {
  id: string;
  user_id: string;
  allergen: string;
  severity: "mild" | "moderate" | "severe" | null;
  reaction: string | null;
  notes: string | null;
  created_at: string;
};

export type Record_ = {
  id: string;
  user_id: string;
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
  user_id: string;
  type: string;
  value: number;
  unit: string | null;
  measured_at: string;
  source: string | null;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type FoodEntry = {
  id: string;
  user_id: string;
  eaten_at: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack" | "drink" | null;
  description: string;
  calories: number | null;
  notes: string | null;
  flagged_allergens: string[] | null;
  created_at: string;
};

export type Symptom = {
  id: string;
  user_id: string;
  occurred_at: string;
  description: string;
  severity: number | null;
  mood: number | null;
  notes: string | null;
  created_at: string;
};

export type MedicationDose = {
  id: string;
  user_id: string;
  medication_id: string;
  taken_at: string;
  skipped: boolean;
  notes: string | null;
  created_at: string;
};
