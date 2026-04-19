"use client";
import { useRef, useState } from "react";

type Row = [string, { value: number; unit: string | null; measured_at: string; count: number }];

export default function AppleHealthClient({ summary }: { summary: Row[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    setStatus(`Uploading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/apple-health/import", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { inserted } = await res.json();
      setStatus(`Imported ${inserted} samples. Reloading…`);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-2">Apple Health</h1>
      <p className="text-muted text-sm mb-6">
        On your iPhone: Health app → profile → Export All Health Data. Unzip the export and upload{" "}
        <code className="text-ink">export.xml</code> here.
      </p>

      <form onSubmit={submit} className="card mb-6">
        <label className="label">export.xml (or .zip containing it)</label>
        <input
          ref={fileRef}
          type="file"
          required
          accept=".xml,.zip,application/xml,text/xml,application/zip"
          className="input"
        />
        <button className="btn btn-primary mt-3" disabled={busy}>
          {busy ? "Importing…" : "Import"}
        </button>
        {status && <p className="text-sm text-muted mt-3">{status}</p>}
        {err && <p className="text-bad text-sm mt-3">{err}</p>}
      </form>

      <section className="card">
        <h2 className="font-semibold mb-4">Imported vitals</h2>
        {summary.length === 0 ? (
          <p className="text-muted text-sm">Nothing imported yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.map(([type, v]) => (
              <div key={type} className="border border-edge rounded-lg p-3">
                <div className="text-xs text-muted">{type.replace(/^HK.*Identifier/, "")}</div>
                <div className="text-lg">
                  {v.value} <span className="text-sm text-muted">{v.unit ?? ""}</span>
                </div>
                <div className="text-[10px] text-muted">
                  latest {new Date(v.measured_at).toLocaleDateString()} · {v.count} samples shown
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
