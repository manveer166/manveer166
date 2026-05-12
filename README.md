# Ember — a soft place to land

A mobile-first couples app built around a **live widget** that's
deliberately *not* a surveillance tool. Inspired by Candle, with the
opposite stance on presence: nothing about your partner is broadcast
unless they explicitly chose to send it, and every share fades on its
own. No last-seen, no read receipts, no ambient activity feed, no buzzers.

> Built as a Next.js PWA so the same code runs on iOS, Android, and the web.
> Install it from the browser's "Add to Home Screen" — it opens fullscreen
> like a native app, with a real icon, splash, and offline-friendly shell.
> To publish to the App Store / Play Store later, wrap with
> [Capacitor](https://capacitorjs.com) (one command).

## The privacy stance

Couples apps tend to drift toward "where are they / are they online now".
Ember refuses that path:

- **No presence broadcast.** No "online", no "is here", no "last seen".
- **No read receipts.** Ever.
- **No ambient activity feed.** Your partner's widget only shows what they
  explicitly chose to put on it.
- **Every share auto-expires.** 15m / 1h / 4h — sender picks.
- **Quiet hours, one tap.** Pause everything in both directions, no
  explanation owed, no notifications go out.
- **Soft kisses.** A 💗 invite they can tap back to, not a buzzer.

## What's in it

- **Live Widget home** — your partner's *currently active share* (or the
  soft empty state), plus a mirror of what you're putting out, today's
  prompt, the streak strip, and a one-tap quiet toggle.
- **Share now** — a bottom sheet to send a status preset (🌙 winding down,
  ☕️ recharging, 💭 thinking of you, etc.), a photo, a doodle, or a short
  note — each with a chosen expiry.
- **Connect** — today's prompt (answers stay private until both have
  answered), a small arcade (Who's More Likely, bucket list), daily
  challenges.
- **Memories** — your saved moments, grouped by day. Filters for Today /
  Photos / Questions.
- **Flame** — your streak. One tiny action a day keeps it lit.
- **You** — pair with someone via a code, pick a name, emoji, and gradient
  for each of you, and flip the only two privacy switches that exist.

## The "live widget" idea

True OS home-screen widgets need native code (a WidgetKit extension on iOS,
a Glance widget on Android). This repo ships the **in-app live widget** —
the centerpiece of the home screen — which already does the things widgets
do (real-time presence, latest moment, thumb sync, streak). When you wrap
with Capacitor for the stores, drop in a thin native widget that mirrors
this same data via shared user-defaults — the heavy lifting is done.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000 on your phone
```

Then in mobile Safari / Chrome: share → "Add to Home Screen". The app
launches fullscreen as **Ember**.

## Wrapping for iOS / Android stores

```bash
npm i -D @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init Ember app.ember --web-dir=out
npm run build && next export   # or use static-export config
npx cap add ios && npx cap add android
npx cap sync && npx cap open ios   # then archive in Xcode
```

(Capacitor wraps the same React UI in a WebView, plus gives you native
APIs for camera, haptics, push notifications, and a real home-screen
widget extension when you're ready.)

## Stack

- Next.js 15 + React 19, App Router
- Tailwind CSS
- Client-only state in `localStorage` (no backend yet — single-device demo
  with a believable simulated partner so the live widget actually feels alive)

## Privacy

No accounts, no servers, no ads. Everything lives in your browser's
`localStorage`. Wipe it from **You → unpair & wipe data**.
