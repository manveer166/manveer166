"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Person = {
  name: string;
  emoji: string;
  color: string;
};

export type WidgetItem = {
  id: string;
  kind: "photo" | "doodle" | "note" | "kiss" | "moodSync";
  from: "you" | "partner";
  caption?: string;
  // For photo: data URL. For doodle: SVG path data.
  data?: string;
  // For mood: 1..5
  mood?: number;
  // For kiss / sync: nothing extra.
  createdAt: number;
};

// A "share" is an opt-in moment the sender chose to broadcast.
// It always has an expiry — nothing about a partner is persistent or passive.
export type Share = {
  id: string;
  from: "you" | "partner";
  kind: "status" | "photo" | "doodle" | "note";
  emoji?: string;
  label?: string;
  data?: string; // photo data URL or doodle SVG
  caption?: string;
  createdAt: number;
  expiresAt: number;
};

export type PromptAnswer = {
  id: string;
  promptId: string;
  prompt: string;
  answerYou?: string;
  answerPartner?: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
};

export type Memory = {
  id: string;
  kind: "photo" | "note" | "milestone" | "challenge";
  title: string;
  body?: string;
  data?: string;
  date: string;
  createdAt: number;
};

export type SharePrefs = {
  allowShares: boolean;
  // an explicit kiss must be initiated by the receiver too — no silent buzz
  allowKisses: boolean;
  // we never broadcast presence by default
  showPresence: false;
  // no read receipts — kept explicit and off
  showReceipts: false;
};

export type State = {
  hasPaired: boolean;
  you: Person | null;
  partner: Person | null;
  pairCode: string | null;
  flameDays: number;
  lastCheckinDate: string | null; // YYYY-MM-DD
  weeklyMask: number; // 7-bit, bit 0 = Mon
  weekStartIso: string; // ISO date for week-start (Monday)
  widget: WidgetItem[]; // newest first (kept for memory log)
  shares: Share[]; // newest first
  prompts: PromptAnswer[];
  memories: Memory[];
  quietUntil: number | null; // epoch ms — your shares are paused & theirs are dimmed
  sharePrefs: SharePrefs;
  unread: number;
};

const STORAGE_KEY = "ember.state.v2";

function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0=Mon..6=Sun
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function defaultState(): State {
  return {
    hasPaired: false,
    you: null,
    partner: null,
    pairCode: null,
    flameDays: 0,
    lastCheckinDate: null,
    weeklyMask: 0,
    weekStartIso: startOfWeek().toISOString().slice(0, 10),
    widget: [],
    shares: [],
    prompts: [],
    memories: [],
    quietUntil: null,
    sharePrefs: {
      allowShares: true,
      allowKisses: true,
      showPresence: false,
      showReceipts: false,
    },
    unread: 0,
  };
}

let state: State = defaultState();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      state = { ...defaultState(), ...parsed };
    }
  } catch {
    // ignore
  }
  // Roll over week if needed
  const sw = startOfWeek().toISOString().slice(0, 10);
  if (state.weekStartIso !== sw) {
    state = { ...state, weekStartIso: sw, weeklyMask: 0 };
    persist();
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): State {
  return state;
}
function getServerSnapshot(): State {
  return defaultState();
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

export function useEmberStore() {
  useEffect(() => {
    load();
    emit();
  }, []);
  return useStore((s) => s);
}

export function usePair() {
  useEffect(() => {
    load();
  }, []);
  return useStore((s) => ({ you: s.you, partner: s.partner, hasPaired: s.hasPaired }));
}

// ---- selectors ----
export function activeShare(s: State, from: "you" | "partner"): Share | null {
  const now = Date.now();
  return s.shares.find((sh) => sh.from === from && sh.expiresAt > now) ?? null;
}

export function isQuiet(s: State): boolean {
  return !!s.quietUntil && s.quietUntil > Date.now();
}

// ---- mutations ----
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

function pruneShares() {
  const now = Date.now();
  const next = state.shares.filter((sh) => sh.expiresAt > now - 12 * 3600 * 1000);
  if (next.length !== state.shares.length) set({ shares: next });
}

export const STATUS_PRESETS: { emoji: string; label: string }[] = [
  { emoji: "🌙", label: "winding down" },
  { emoji: "☕️", label: "recharging" },
  { emoji: "💭", label: "thinking of you" },
  { emoji: "🌊", label: "deep work" },
  { emoji: "🍳", label: "cooking" },
  { emoji: "🚶", label: "out & about" },
  { emoji: "📚", label: "reading" },
  { emoji: "💤", label: "sleep" },
];

export const SHARE_DURATIONS = [
  { label: "15m", ms: 15 * 60_000 },
  { label: "1h", ms: 60 * 60_000 },
  { label: "4h", ms: 4 * 60 * 60_000 },
];

export const store = {
  load,
  pair(you: Person, partner: Person, code: string) {
    set({ you, partner, hasPaired: true, pairCode: code });
  },
  unpair() {
    state = defaultState();
    persist();
    emit();
  },
  updateYou(p: Partial<Person>) {
    if (!state.you) return;
    set({ you: { ...state.you, ...p } });
  },
  updatePartner(p: Partial<Person>) {
    if (!state.partner) return;
    set({ partner: { ...state.partner, ...p } });
  },
  updatePrefs(p: Partial<SharePrefs>) {
    set({ sharePrefs: { ...state.sharePrefs, ...p } });
  },

  // Quiet mode — you stop broadcasting and incoming dims.
  goQuiet(hours: number) {
    set({ quietUntil: Date.now() + hours * 3600_000 });
  },
  endQuiet() {
    set({ quietUntil: null });
  },

  // Shares always have an expiry and are explicitly chosen.
  share(input: Omit<Share, "id" | "from" | "createdAt" | "expiresAt"> & { ms: number }) {
    if (isQuiet(state)) return; // refuse to broadcast while quiet
    if (!state.sharePrefs.allowShares) return;
    const now = Date.now();
    const full: Share = {
      id: cryptoId(),
      from: "you",
      kind: input.kind,
      emoji: input.emoji,
      label: input.label,
      data: input.data,
      caption: input.caption,
      createdAt: now,
      expiresAt: now + Math.max(60_000, input.ms),
    };
    set({ shares: [full, ...state.shares].slice(0, 100) });
    // every share also drops a memory you can revisit later
    if (input.kind === "photo" || input.kind === "doodle") {
      store.addMemory({
        kind: input.kind === "photo" ? "photo" : "note",
        title: input.kind === "photo" ? "Photo shared" : "Doodle shared",
        body: input.caption,
        data: input.data,
      });
    } else if (input.kind === "note" && input.caption) {
      store.addMemory({ kind: "note", title: "Note shared", body: input.caption });
    }
    store.checkIn();
  },
  clearMyShare() {
    set({ shares: state.shares.filter((sh) => !(sh.from === "you" && sh.expiresAt > Date.now())) });
  },

  addMemory(m: Omit<Memory, "id" | "createdAt" | "date">) {
    const full: Memory = {
      ...m,
      id: cryptoId(),
      date: todayISO(),
      createdAt: Date.now(),
    };
    set({ memories: [full, ...state.memories].slice(0, 500) });
  },
  removeMemory(id: string) {
    set({ memories: state.memories.filter((m) => m.id !== id) });
  },
  checkIn() {
    const today = todayISO();
    if (state.lastCheckinDate === today) return;
    const yest = todayISO(new Date(Date.now() - 24 * 3600 * 1000));
    const flame =
      state.lastCheckinDate === yest ? state.flameDays + 1 : Math.max(1, 1);
    const dayIdx = (new Date().getDay() + 6) % 7;
    set({
      lastCheckinDate: today,
      flameDays: flame,
      weeklyMask: state.weeklyMask | (1 << dayIdx),
    });
  },
  answerPrompt(promptId: string, prompt: string, answer: string) {
    const today = todayISO();
    const existing = state.prompts.find(
      (p) => p.promptId === promptId && p.date === today,
    );
    let prompts: PromptAnswer[];
    if (existing) {
      prompts = state.prompts.map((p) =>
        p.id === existing.id ? { ...p, answerYou: answer } : p,
      );
    } else {
      prompts = [
        {
          id: cryptoId(),
          promptId,
          prompt,
          answerYou: answer,
          date: today,
          createdAt: Date.now(),
        },
        ...state.prompts,
      ];
    }
    set({ prompts });
    store.addMemory({ kind: "note", title: "Q: " + prompt, body: answer });
    store.checkIn();
    queuePartnerReply(promptId);
  },

  // Kisses are explicit and always opt-in on the receive side too —
  // they queue as a pending invite rather than appearing as a forced buzz.
  sendKissInvite() {
    if (!state.sharePrefs.allowKisses) return;
    if (isQuiet(state)) return;
    const now = Date.now();
    const sh: Share = {
      id: cryptoId(),
      from: "you",
      kind: "note",
      emoji: "💗",
      label: "kiss invite",
      caption: "thinking of you — tap back if you can",
      createdAt: now,
      expiresAt: now + 60 * 60_000,
    };
    set({ shares: [sh, ...state.shares].slice(0, 100) });
    store.checkIn();
  },
};

function cryptoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---- Simulated partner ----
// Sends explicit shares only, never ambient presence/activity.
function queuePartnerReply(promptId: string) {
  const delay = 25_000 + Math.random() * 20_000;
  setTimeout(() => {
    if (isQuiet(state)) return;
    const REPLIES: Record<string, string[]> = {
      default: [
        "honestly, you.",
        "the tiny way you laugh when you're tired.",
        "a sunday with nothing planned.",
        "the way coffee smells in your kitchen.",
        "that one road we drove down last summer.",
      ],
    };
    const list = REPLIES[promptId] ?? REPLIES.default;
    const text = list[Math.floor(Math.random() * list.length)];
    const today = todayISO();
    const prompts = state.prompts.map((p) =>
      p.promptId === promptId && p.date === today
        ? { ...p, answerPartner: text }
        : p,
    );
    set({ prompts, unread: state.unread + 1 });
  }, delay);
}

const PARTNER_SHARES: { emoji: string; label: string; ms: number }[] = [
  { emoji: "☕️", label: "recharging", ms: 60 * 60_000 },
  { emoji: "🌊", label: "deep work", ms: 90 * 60_000 },
  { emoji: "💭", label: "thinking of you", ms: 45 * 60_000 },
  { emoji: "📚", label: "reading", ms: 60 * 60_000 },
  { emoji: "🚶", label: "out & about", ms: 30 * 60_000 },
  { emoji: "🌙", label: "winding down", ms: 2 * 60 * 60_000 },
];

let tickerStarted = false;
export function startSimulator() {
  if (tickerStarted) return;
  tickerStarted = true;
  if (typeof window === "undefined") return;
  load();
  // prune expired shares every minute
  setInterval(pruneShares, 60_000);

  // partner occasionally posts a *new* share (overwriting their previous active one).
  // never more often than ~10–25 min apart; respects quiet.
  function partnerSharesNow() {
    if (!state.hasPaired) return;
    if (isQuiet(state)) return;
    const p = PARTNER_SHARES[Math.floor(Math.random() * PARTNER_SHARES.length)];
    const now = Date.now();
    // remove any existing active partner share
    const remaining = state.shares.filter(
      (sh) => !(sh.from === "partner" && sh.expiresAt > now),
    );
    const sh: Share = {
      id: cryptoId(),
      from: "partner",
      kind: "status",
      emoji: p.emoji,
      label: p.label,
      createdAt: now,
      expiresAt: now + p.ms,
    };
    set({ shares: [sh, ...remaining].slice(0, 100), unread: state.unread + 1 });
  }
  setTimeout(partnerSharesNow, 8_000);
  setInterval(() => {
    if (Math.random() < 0.35) partnerSharesNow();
  }, 6 * 60_000);
}
