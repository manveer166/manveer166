"use client";
import { useRef, useState } from "react";
import type { RecordRow } from "@/lib/db";

export default function RecordsClient({ initial }: { initial: RecordRow[] }) {
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("lab");
  const [takenOn, setTakenOn] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("title", title || file.name);
      fd.set("kind", kind);
      if (takenOn) fd.set("taken_on", takenOn);
      if (notes) fd.set("notes", notes);
      const res = await fetch("/api/records/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const row = (await res.json()) as RecordRow;
      setItems([row, ...items]);
      setTitle("");
      setTakenOn("");
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/records/${id}`, { method: "DELETE" });
    setItems(items.filter((r) => r.id !== id));
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Medical records</h1>

      <form onSubmit={upload} className="card mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="label">File (PDF, image, or text)</label>
          <input ref={fileRef} type="file" required className="input" />
        </div>
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Annual physical"
          />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="lab">Lab result</option>
            <option value="imaging">Imaging</option>
            <option value="visit">Visit note</option>
            <option value="prescription">Prescription</option>
            <option value="vaccination">Vaccination</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Date taken</label>
          <input
            type="date"
            className="input"
            value={takenOn}
            onChange={(e) => setTakenOn(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button className="btn btn-primary sm:col-span-2 justify-center" disabled={busy}>
          {busy ? "Uploading…" : "Upload record"}
        </button>
        {err && <p className="text-bad text-sm sm:col-span-2">{err}</p>}
      </form>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-muted text-sm">No records yet.</p>}
        {items.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{r.title}</h3>
                  {r.kind && <span className="pill">{r.kind}</span>}
                  {r.taken_on && <span className="pill">{r.taken_on}</span>}
                </div>
                {r.notes && <p className="text-sm text-muted mt-1">{r.notes}</p>}
                {r.extracted_text && (
                  <details className="mt-2">
                    <summary className="text-sm text-accent cursor-pointer">
                      Extracted text
                    </summary>
                    <pre className="text-xs whitespace-pre-wrap mt-2 text-muted">
                      {r.extracted_text.slice(0, 2000)}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                <a href={`/api/records/${r.id}`} target="_blank" rel="noreferrer" className="btn">
                  View
                </a>
                <button className="btn" onClick={() => remove(r.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
