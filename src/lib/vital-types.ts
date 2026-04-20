export const MANUAL_VITAL_TYPES = [
  { type: "HKQuantityTypeIdentifierBloodPressureSystolic", label: "BP — systolic", unit: "mmHg" },
  { type: "HKQuantityTypeIdentifierBloodPressureDiastolic", label: "BP — diastolic", unit: "mmHg" },
  { type: "HKQuantityTypeIdentifierHeartRate", label: "Heart rate", unit: "bpm" },
  { type: "HKQuantityTypeIdentifierBodyMass", label: "Weight", unit: "kg" },
  { type: "HKQuantityTypeIdentifierBodyMassIndex", label: "BMI", unit: "" },
  { type: "HKQuantityTypeIdentifierOxygenSaturation", label: "SpO₂", unit: "%" },
  { type: "HKQuantityTypeIdentifierRespiratoryRate", label: "Respiratory rate", unit: "breaths/min" },
  { type: "HKQuantityTypeIdentifierBodyTemperature", label: "Temperature", unit: "°C" },
  { type: "HKQuantityTypeIdentifierBloodGlucose", label: "Blood glucose", unit: "mg/dL" },
] as const;

export function labelFor(type: string): string {
  const found = MANUAL_VITAL_TYPES.find((t) => t.type === type);
  if (found) return found.label;
  return type.replace(/^HK.*Identifier/, "");
}
