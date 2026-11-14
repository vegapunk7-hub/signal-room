# Signal Room & After Hours

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

Two small Pollinations-powered apps, each with its own purpose, live URL and offline demo.

## Signal Room — Quest #19178

**A cooperative AI investigation room.** ARIA (Field Analyst) and VEGA (Systems Thinker) take alternating turns on the same mystery, examine one another's ideas, and build a shared investigation log.

- Live app: https://vegapunk7-hub.github.io/signal-room/
- Two separately selected Pollinations text models take turns in one shared investigation.
- Each reply streams into the room as it is generated.
- Choose 2, 3, or 4 rounds (4–8 model calls), stop at any time, and export the transcript as Markdown.
- Three original case starters plus custom investigations.
- Prewritten demo mode works without API calls or Pollen spend.
- Live requests use the official Pollinations Pay / Bring Your Own Pollen (BYOP) widget.
- Submission: https://github.com/pollinations/pollinations/issues/19703

## After Hours — Quest #19177

**A tiny world where AI agents are left alone to decide what to do.** Moss and Juniper can explore, make things, play, visit one another, or simply enjoy a quiet afternoon. There is no assigned mission.

- Live app: https://vegapunk7-hub.github.io/signal-room/after-hours/
- Two independently selectable Pollinations models play residents with distinct personalities.
- Each resident chooses its own next small activity based on the shared world and journal.
- Six places, changing resident locations and moods, bounded 4/6/8-turn visits, stop control, and Markdown journal export.
- Offline demo works with zero API calls and no Pollen spend.
- Live turns use the official `polli-connect` BYOP widget and one chat-completion request per turn.
- More detail: [`site/after-hours/README.md`](site/after-hours/README.md)

## Machine Room — Quest #19179

**A model becomes a computer.** Machine Room is a fictional terminal in which a Pollinations model responds as an operating system, maintaining a virtual filesystem, processes and machine metrics. It is a safe simulation: no commands are executed on the visitor's real computer.

- Live app: https://vegapunk7-hub.github.io/signal-room/machine-room/
- Select the model and machine personality, type terminal commands, and inspect the virtual file tree and event log.
- Offline demo runs locally without API requests or Pollen spend.
- Live mode uses the official Pollinations Connect / BYOP widget and the user's approved budget.
- Submission: pending for Quest #19179.

## Build, test, and deploy

The static sites are deployed together from `site/` by `.github/workflows/pages.yml`. A push to `main` runs JavaScript syntax checks and both smoke-test suites before the GitHub Pages deployment.

Run locally from the repository root:

```bash
python -m http.server 8000 --directory site
```

Open <http://localhost:8000/> for Signal Room or <http://localhost:8000/after-hours/> for After Hours. Both offline demos work immediately.

Run checks with Node.js 22:

```bash
node --check site/app.js
node --check site/after-hours/app.js
node --test tests/smoke.test.js tests/after-hours.test.js
```

## Pollinations BYOP

Each app uses the official Pollinations Connect UI. Users create their own publishable `pk_...` App Key, add the exact app URL as a Redirect URI, and approve their own scoped text-model access, budget and expiry. The scoped user key is held only for the browser session; neither app stores it in the source, URL, or analytics. No app request runs until the user explicitly connects and starts a live session.

- Create an App Key: https://enter.pollinations.ai/keys?tab=app
- API model catalogue: `GET https://gen.pollinations.ai/v1/models`
- Chat completions: `POST https://gen.pollinations.ai/v1/chat/completions`

## Credit and license

The Pollinations credit badge is included on both app pages and this README. MIT licensed; see [LICENSE](LICENSE).
