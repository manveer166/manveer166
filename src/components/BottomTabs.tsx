"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/", label: "Live", icon: LiveIcon },
  { href: "/connect", label: "Connect", icon: SparkIcon },
  { href: "/memories", label: "Memories", icon: HeartIcon },
  { href: "/streak", label: "Flame", icon: FlameIcon },
  { href: "/settings", label: "You", icon: UserIcon },
] as const;

export default function BottomTabs() {
  const path = usePathname();
  if (path?.startsWith("/welcome")) return null;
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[540px] px-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      <div className="glass rounded-3xl px-2 py-2 flex justify-between">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? path === "/" : path.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={clsx(
                "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl tap",
                active ? "text-ink" : "text-muted",
              )}
            >
              <div
                className={clsx(
                  "h-8 w-8 grid place-items-center rounded-2xl transition",
                  active &&
                    "bg-gradient-to-br from-ember2/30 via-ember/20 to-spark/30 text-ink shadow-glow",
                )}
              >
                <Icon className="h-5 w-5" active={active} />
              </div>
              <span className="text-[10px] tracking-wide">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function LiveIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" opacity=".55" />
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.4" opacity=".25" />
    </svg>
  );
}
function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3v5M12 16v5M3 12h5M16 12h5M6.2 6.2l3 3M14.8 14.8l3 3M17.8 6.2l-3 3M9.2 14.8l-3 3"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      />
    </svg>
  );
}
function HeartIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} className={className}>
      <path
        d="M12 20s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 21 10c0 5.65-7 10-7 10z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
    </svg>
  );
}
function FlameIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} className={className}>
      <path
        d="M12 3s5 4 5 9a5 5 0 1 1-10 0c0-2 1-3 1-4 0 1.5 1 2 2 2 0-3-1-4 2-7z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
