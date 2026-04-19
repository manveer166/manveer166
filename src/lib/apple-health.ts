import sax from "sax";

export type HealthSample = {
  type: string;
  unit: string | null;
  value: number | null;
  startDate: string;
  endDate: string;
  source: string | null;
};

const NUMERIC_TYPES = new Set([
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierRestingHeartRate",
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierBasalEnergyBurned",
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierBodyMassIndex",
  "HKQuantityTypeIdentifierBodyFatPercentage",
  "HKQuantityTypeIdentifierBloodPressureSystolic",
  "HKQuantityTypeIdentifierBloodPressureDiastolic",
  "HKQuantityTypeIdentifierOxygenSaturation",
  "HKQuantityTypeIdentifierRespiratoryRate",
  "HKQuantityTypeIdentifierBodyTemperature",
  "HKQuantityTypeIdentifierBloodGlucose",
  "HKQuantityTypeIdentifierVO2Max",
  "HKQuantityTypeIdentifierAppleExerciseTime",
  "HKQuantityTypeIdentifierAppleStandTime",
  "HKQuantityTypeIdentifierDistanceWalkingRunning",
  "HKCategoryTypeIdentifierSleepAnalysis",
]);

export function parseHealthExport(
  xml: string,
  onSample: (s: HealthSample) => void,
): Promise<{ total: number }> {
  return new Promise((resolve, reject) => {
    const parser = sax.parser(true, { lowercase: false });
    let total = 0;

    parser.onerror = (err) => reject(err);
    parser.onopentag = (node) => {
      if (node.name !== "Record") return;
      const a = node.attributes as Record<string, string>;
      const type = a.type;
      if (!type || !NUMERIC_TYPES.has(type)) return;

      const raw = a.value;
      const value = raw === undefined ? null : Number(raw);
      onSample({
        type,
        unit: a.unit ?? null,
        value: Number.isFinite(value) ? value : null,
        startDate: a.startDate,
        endDate: a.endDate ?? a.startDate,
        source: a.sourceName ?? null,
      });
      total++;
    };
    parser.onend = () => resolve({ total });

    parser.write(xml).close();
  });
}

export function summarize(samples: HealthSample[]) {
  const byType = new Map<string, HealthSample[]>();
  for (const s of samples) {
    if (s.value == null) continue;
    const arr = byType.get(s.type) ?? [];
    arr.push(s);
    byType.set(s.type, arr);
  }
  const out: Record<string, { count: number; latest: HealthSample; avg: number }> = {};
  for (const [type, arr] of byType) {
    arr.sort((a, b) => a.startDate.localeCompare(b.startDate));
    const values = arr.map((s) => s.value!).filter(Number.isFinite);
    out[type] = {
      count: arr.length,
      latest: arr[arr.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }
  return out;
}
