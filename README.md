# Révérence — Dance Trainer & Journal

A personal dance journal and training tracker for dancers of all styles and levels. Log practice sessions, track skills, record goals, plan seasons and classes, and log events — competitions, recitals, parades, holiday performances, and more. Built for the dancer, not the studio.

#### Demo:
https://badbox29.github.io/reverence/

---

#### Screenshot
![Screenshot](screenshot.png)

---

## Features

- **Journal feed** — log practice sessions with style, duration, mood, notes, and media links; voice-first card design surfaces your own words front and center
- **From the Archives** — a daily spotlight that surfaces a past entry with temporal framing ("One year ago today…", "Just before Spring Recital · 2025…"), your own quoted words, and a skills growth callout
- **Skills tracker** — star-rate individual techniques across all 6 styles (Ballet, Contemporary, Lyrical, Jazz, Tap, Hip-Hop) with timestamped history for growth tracking over time
- **Events log** — log competitions, recitals, parades, holiday performances, workshops, and more; each event type has its own relevant fields (placement, costume, judge feedback, instructor, etc.) plus a journal notes section
- **Season & class scheduler** — create seasons with date ranges, build weekly class schedules within seasons, tag classes to journal entries; archive seasons (reversible) to keep history without clutter
- **Intensives support** — classes can be typed as Intensive with preset durations (3-day, 5-day, 1-week, 2-week, summer) or custom start/end dates
- **Goal tracking** — set style-specific goals with target dates and progress sliders; completed goals are timestamped for Year in Review stats
- **Upcoming classes widget** — sidebar shows today's classes, tomorrow's classes, or the next class day within 7 days
- **Upcoming events widget** — sidebar shows the next 4 events within 90 days
- **Pointe tracker** — dedicated section (optional) with readiness checklist, conditioning tracker, and pointe shoe fitting log (brand, size, vamp, shank)
- **Injury log** — log and track injuries with body area, description, treatment notes, and status (Active / Recovering / Healed); cycle status with one tap
- **35 badges** — earned-only display across 8 categories: practice milestones, streaks, goals, skills, events, seasons, pointe, and fun/surprise
- **Year in Review** — auto-generated annual summary with stats, timeline, skills growth (before/after star ratings), best journal excerpts, and active goals; defaults to prior year with dropdown to visit any year
- **Your Story So Far** — full career arc with lifetime stats, first session, year-by-year summary, new styles timeline, skills portrait, best excerpts, and all earned badges
- **Cross-device sync** — token-based KV sync via Cloudflare Worker; lastModified timestamp conflict resolution; offline resilience with dirty-flag queuing and 60-second reconnect pings
- **Account setup wizard** — new device prompts to load existing account (Worker URL + token) or start fresh
- **Switch Account** — load a different user's data by token from Settings
- **Dark / light mode** — full theme toggle
- **Mobile responsive** — two-column layout collapses to single column; header icons collapse to icon-only on narrow screens; modals slide up from bottom on mobile

---

## File Structure

```
reverence/
├── index.html          # App entry point
├── css/
│   └── style.css       # All styles
├── js/
│   └── app.js          # All client-side logic
├── worker.js           # Cloudflare Worker (deploy separately)
└── README.md
```

---

## Setup

### 1. Get the files

Clone or download this repository. The app is entirely static — `index.html`, `css/style.css`, and `js/app.js` are all you need to run it locally.

Open `index.html` directly in a browser, or host it on GitHub Pages (or any static host) for a permanent URL.

---

### 2. Deploy the Cloudflare Worker

The Worker provides KV storage for cross-device sync. A free Cloudflare account is sufficient for personal use.

#### 2a. Create the Worker

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com) and open **Workers & Pages**.
2. Click **Create** → **Create Worker**.
3. Give it a name (e.g. `reverence-worker`) and click **Deploy**.
4. Click **Edit code**, paste the entire contents of `worker.js`, and click **Deploy** again.
5. Note your worker URL — it will look like `https://reverence-worker.your-subdomain.workers.dev`.

#### 2b. Create and bind a KV namespace

1. In the Cloudflare dashboard, go to **Workers & Pages → KV**.
2. Click **Create a namespace**, name it `REVERENCE_KV`, and click **Add**.
3. Go back to your Worker → **Settings → Bindings**.
4. Click **Add** → **KV Namespace**.
5. Set the **Variable name** to exactly `REVERENCE_KV` and select the namespace you just created.
6. Click **Deploy** to save the binding.

> **Why `REVERENCE_KV`?** The worker references `env.REVERENCE_KV` by that exact name. A different variable name will cause all storage operations to fail with a 500 error.

#### 2c. Point the app at your Worker

1. Open the app in your browser.
2. Click the **Settings** (gear) icon.
3. Paste your Worker URL into the **Worker URL** field and click **Save Settings**.

The app will immediately begin syncing through your Worker.

---

### 3. Cross-Device Sync

Your sync token is your identity in KV. Each browser generates one automatically on first load.

- On your **primary device**: open Settings and note your **User Token**.
- On a **new device**: when the app opens for the first time, choose "Yes — load my existing account", enter your Worker URL and token, and your data will load.
- To switch between users on the same device: open Settings → **Switch Account** and enter the other user's token.

Data syncs automatically on every save. If the worker is unreachable, changes are queued locally and pushed when connectivity is restored (checked every 60 seconds).

Conflict resolution: if both devices have data, the one with the more recent `lastModified` timestamp wins. If timestamps are equal (or the worker has no data yet), local data is pushed up.

---

## Styles Supported

Ballet · Contemporary · Lyrical · Jazz · Tap · Hip-Hop

---

## Event Types

| Type | Fields |
|---|---|
| Competition | Style, piece, placement, score, costume, music, judge feedback |
| Recital | Pieces performed, style(s), role/part, costume |
| Parade / March | Formation/group, duration, weather, route/distance |
| Holiday Performance | Role/character, piece(s), costume, number of performances |
| Workshop / Masterclass | Instructor, host/organization, style focus, key takeaways |
| Other | Role, additional details |

All event types include: event name, date, venue/location, media link, and journal notes.

---

## Worker Routes

| Method | Route | Description |
|---|---|---|
| `OPTIONS` | `/kv/:token` | CORS preflight |
| `GET` | `/kv/:token` | Fetch data for a token |
| `PUT` | `/kv/:token` | Save data for a token (JSON body, max 5 MB) |
| `GET` | `/` | Health check |

---

## Data & Privacy

All data is stored in Cloudflare KV under your user token. Nothing is stored server-side beyond what you explicitly save. There are no accounts, no passwords, and no data leaves your browser except through your own Worker.

`localStorage` is used as a local cache and sync fallback when the Worker is unreachable. KV is the source of truth when both are present and timestamps differ.

The user token acts as both the key and the secret. Keep your token private. For shared/production use, consider adding Cloudflare Access in front of the Worker for authentication.

---

## Version

**v0.5** — Initial public release
