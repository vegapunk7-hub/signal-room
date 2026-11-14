# Signal Room

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

**A cooperative AI investigation room powered by Pollinations models.** ARIA (Field Analyst) and VEGA (Systems Thinker) take alternating turns on the same mystery, examine one another's ideas, and build a shared investigation log.

Built for Pollinations Quest [#19178 — an app or game where AIs talk to each other](https://github.com/pollinations/pollinations/issues/19178).

## Features

- Two separately selected Pollinations text models take turns in one shared investigation.
- Each reply streams into the room as it is generated.
- Choose 2, 3, or 4 rounds (4–8 model calls), stop at any time, and export the transcript as Markdown.
- Three original case starters plus custom investigations.
- Prewritten demo mode lets reviewers try the app with no API calls and no Pollen spend.
- Live requests use official Pollinations Pay / Bring Your Own Pollen (BYOP). The app never asks for a user's secret key.
- Responsive static site with no backend, build step, analytics, or app database.

## Live app

GitHub Pages deployment is configured through `.github/workflows/pages.yml`. After enabling GitHub Pages with **GitHub Actions** as the source in repository Settings → Pages, pushes to `main` deploy the `site/` directory.

## Run locally

From the repository root:

```bash
python -m http.server 8000 --directory site
```

Open <http://localhost:8000>. The no-cost demo works immediately.

On Windows, double-click `run-local.bat`.

## Connect Pollinations (BYOP)

1. Create a **publishable App Key** at <https://enter.pollinations.ai/keys?tab=app>.
2. Add the exact hosted URL as a Redirect URI on the App Key. For local testing, use `http://localhost:8000/`. For GitHub Pages, include the repository path and trailing slash.
3. In Signal Room, select **Connect Pollen**, paste the `pk_...` App Key, and load the official Pollinations Connect widget.
4. Approve the request. The widget requests text-model access and pre-fills a 5-Pollen budget and seven-day expiry; review and choose the grant you want.
5. Start an investigation. Each analyst reply is a separate request charged to the user's approved Pollen budget.

The scoped user key is supplied by the official `<polli-connect>` widget and remains in the browser tab. Signal Room does not write it to localStorage, the URL, source code, logs, or analytics. Disconnect or revoke access through the widget or Pollinations dashboard.

## Technical notes

- Static HTML, CSS, and browser JavaScript; no bundler or application dependencies.
- Public model discovery uses `GET https://gen.pollinations.ai/v1/models`.
- Chat calls use `POST https://gen.pollinations.ai/v1/chat/completions` with the scoped user key in the Authorization header and stream over SSE.
- Model outputs are hypotheses, not verified facts; the case report says so explicitly.
- `@pollinations/ui` is loaded from jsDelivr for the official BYOP widget; OAuth handling is not copied or reimplemented.

## Verification

Run the automated smoke tests with Node.js 18 or later:

```bash
node --test tests/smoke.test.js
node --check site/app.js
```

Also test a live BYOP flow with a small user-approved budget after adding the deployed URL to the App Key's Redirect URI list.

## Credit and license

The Pollinations credit badge is included in the app footer and this README. MIT licensed; see [LICENSE](LICENSE).
