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

export type State = {
  hasPaired: boolean;
  you: Person | null;
  partner: Person | null;
  pairCode: string | null;
  flameDays: number;
  lastCheckinDate: string | null; // YYYY-MM-DD
  weeklyMask: number; // 7-bit, bit 0 = Mon
  weekStartIso: string; // ISO date for week-start (Monday)
  widget: WidgetItem[]; // newest first
  prompts: PromptAnswer[]; // history of daily prompts
  memories: Memory[];
  partnerStatus: {
    activity: string;
    mood: number; // 1..5
    lastSeen: number; // epoch ms
    isHere: boolean; // app open
  };
  thumbSync: {
    youTouching: boolean;
    partnerTouching: boolean;
    syncSince: number | null;
  };
  unread: number;
};

const STORAGE_KEY = "ember.state.v1";

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
    prompts: [],
    memories: [],
    partnerStatus: {
      activity: "just opened the app",
      mood: 4,
      lastSeen: Date.now(),
      isHere: false,
    },
    thumbSync: { youTouching: false, partnerTouching: false, syncSince: null },
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
  // make sure load happens once on the client
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

// ---- mutations ----
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

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
  addWidget(item: Omit<WidgetItem, "id" | "createdAt">) {
    const full: WidgetItem = {
      ...item,
      id: cryptoId(),
      createdAt: Date.now(),
    };
    set({ widget: [full, ...state.widget].slice(0, 50) });
    if (item.kind !== "kiss" && item.kind !== "moodSync") {
      store.addMemory({
        kind: item.kind === "doodle" ? "note" : item.kind === "photo" ? "photo" : "note",
        title:
          item.kind === "photo"
            ? "Photo to widget"
            : item.kind === "doodle"
              ? "Doodle"
              : "Note",
        body: item.caption,
        data: item.data,
      });
    }
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
    store.addMemory({
      kind: "note",
      title: "Q: " + prompt,
      body: answer,
    });
    store.checkIn();
    // simulate partner replying after a bit
    queuePartnerReply(promptId);
  },
  setPartnerStatus(p: Partial<State["partnerStatus"]>) {
    set({ partnerStatus: { ...state.partnerStatus, ...p } });
  },
  setYouTouching(v: boolean) {
    const ts = { ...state.thumbSync, youTouching: v };
    if (v && ts.partnerTouching && !ts.syncSince) ts.syncSince = Date.now();
    if (!v) ts.syncSince = null;
    set({ thumbSync: ts });
  },
  setPartnerTouching(v: boolean) {
    const ts = { ...state.thumbSync, partnerTouching: v };
    if (v && ts.youTouching && !ts.syncSince) ts.syncSince = Date.now();
    if (!v) ts.syncSince = null;
    set({ thumbSync: ts });
  },
  sendKiss() {
    store.addWidget({ kind: "kiss", from: "you", caption: "thumb kiss" });
    store.checkIn();
  },
  partnerSendKiss() {
    store.addWidget({ kind: "kiss", from: "partner", caption: "thumb kiss" });
  },
};

function cryptoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---- Simulated partner — gives the app life for a single user ----
const PARTNER_ACTIVITIES = [
  "walking to class",
  "in line for coffee",
  "deep in a book",
  "stretching after a run",
  "stuck in a meeting",
  "looking out the window",
  "humming a song",
  "doodling on a napkin",
  "missing you a bit",
  "thinking about that thing you said",
];

function queuePartnerReply(promptId: string) {
  const delay = 25_000 + Math.random() * 20_000;
  setTimeout(() => {
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
    store.addWidget({
      kind: "note",
      from: "partner",
      caption: text,
    });
  }, delay);
}

// Tick partner status every so often
let tickerStarted = false;
export function startSimulator() {
  if (tickerStarted) return;
  tickerStarted = true;
  if (typeof window === "undefined") return;
  load();
  const tick = () => {
    if (!state.hasPaired) return;
    const next = PARTNER_ACTIVITIES[
      Math.floor(Math.random() * PARTNER_ACTIVITIES.length)
    ];
    set({
      partnerStatus: {
        ...state.partnerStatus,
        activity: next,
        lastSeen: Date.now() - Math.floor(Math.random() * 8 * 60_000),
        isHere: Math.random() < 0.35,
      },
    });
  };
  setTimeout(tick, 4_000);
  setInterval(tick, 45_000);

  // occasional partner thumb-touch
  setInterval(() => {
    if (!state.hasPaired) return;
    if (Math.random() < 0.18) {
      store.setPartnerTouching(true);
      setTimeout(() => store.setPartnerTouching(false), 3_500 + Math.random() * 5_000);
    }
  }, 30_000);
}
