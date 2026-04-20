"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";
import clsx from "clsx";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/chat", label: "Ask my assistant" },
  { href: "/medications", label: "Medications" },
  { href: "/allergies", label: "Allergies" },
  { href: "/food", label: "Food log" },
  { href: "/symptoms", label: "Symptoms" },
  { href: "/vitals", label: "Vitals" },
  { href: "/trends", label: "Trends" },
  { href: "/records", label: "Medical records" },
  { href: "/apple-health", label: "Apple Health" },
  { href: "/summary", label: "Doctor summary" },
  { href: "/lookup", label: "Health lookup" },
];

export default function Nav({ email }: { email: string }) {
  const path = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r border-edge p-5 flex flex-col gap-1 bg-[#0d0f13]">
      <div className="text-lg font-semibold mb-4">🫀 Health</div>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={clsx(
            "px-3 py-2 rounded-lg text-sm",
            path === l.href ? "bg-edge text-ink" : "text-muted hover:text-ink hover:bg-[#181c22]",
          )}
        >
          {l.label}
        </Link>
      ))}
      <div className="mt-auto pt-4 border-t border-edge text-xs text-muted">
        <div className="truncate">{email}</div>
        <button
          className="mt-2 text-muted hover:text-ink"
          onClick={async () => {
            await browserClient().auth.signOut();
            window.location.href = "/login";
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
