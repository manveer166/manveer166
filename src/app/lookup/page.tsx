"use client";
import { useState } from "react";

export default function LookupPage() {
  const [q, setQ] = useState("");

  const encoded = encodeURIComponent(q);
  const links = q.trim()
    ? [
        {
          label: "WebMD",
          href: `https://www.webmd.com/search/search_results/default.aspx?query=${encoded}`,
        },
        {
          label: "Mayo Clinic",
          href: `https://www.mayoclinic.org/search/search-results?q=${encoded}`,
        },
        {
          label: "MedlinePlus (NIH)",
          href: `https://medlineplus.gov/search.html?query=${encoded}`,
        },
        {
          label: "Drugs.com",
          href: `https://www.drugs.com/search.php?searchterm=${encoded}`,
        },
      ]
    : [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Health lookup</h1>
      <p className="text-muted text-sm mb-6">
        Search trusted sources directly. Use "Ask my assistant" for questions grounded in your own
        records.
      </p>

      <div className="card">
        <label className="label">Search term</label>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. ibuprofen, iron deficiency, gluten"
        />

        {links.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className="btn justify-between"
              >
                <span>{l.label}</span>
                <span className="text-muted">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
