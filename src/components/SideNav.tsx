"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/", label: "Live" },
  { href: "/connect", label: "Connect" },
  { href: "/memories", label: "Memories" },
  { href: "/streak", label: "Flame" },
  { href: "/settings", label: "You" },
] as const;

export default function SideNav() {
  const path = usePathname();
  const { you, partner, hasPaired, flameDays, quietUntil } = useStore((s) => ({
    you: s.you,
    partner: s.partner,
    hasPaired: s.hasPaired,
    flameDays: s.flameDays,
    quietUntil: s.quietUntil,
  }));
  const quiet = !!quietUntil && quietUntil > Date.now();

  if (path?.startsWith("/welcome")) return null;

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-[220px] xl:w-[240px] p-5 border-r border-edge bg-black/40 backdrop-blur-md z-30">
      <Link href="/" className="serif text-3xl">
        <span className="ember-text">Ember</span>
      </Link>
      <div className="text-[11px] text-muted mt-1">
        a soft place to land
      </div>

      <nav className="mt-7 flex flex-col gap-1">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? path === "/" : path?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-2xl text-sm",
                active
                  ? "bg-gradient-to-br from-ember2/25 via-ember/15 to-spark/25 text-ink"
                  : "text-muted hover:text-ink hover:bg-edge/40",
              )}
            >
              <Dot active={!!active} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {hasPaired ? (
          <div className="rounded-2xl border border-edge bg-black/30 p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted">paired</div>
            <div className="text-sm text-ink mt-1">
              {you?.name ?? "you"} & {partner?.name ?? "them"}
            </div>
            <div className="text-[11px] text-muted mt-1">
              🔥 {flameDays} day streak {quiet ? "· 🌙 quiet" : ""}
            </div>
          </div>
        ) : (
          <Link
            href="/welcome"
            className="block rounded-2xl border border-ember/40 bg-black/30 p-3 text-sm"
          >
            <div className="font-semibold">Start your flame</div>
            <div className="text-[11px] text-muted mt-1">no account — just two names.</div>
          </Link>
        )}
        <div className="text-[10px] text-muted leading-relaxed">
          no presence · no read receipts · no last-seen. shares fade on their own.
        </div>
      </div>
    </aside>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        "h-2 w-2 rounded-full",
        active
          ? "bg-gradient-to-br from-ember2 to-spark shadow-glow"
          : "bg-edge",
      )}
    />
  );
}
