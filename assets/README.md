# Brand assets

| File | Purpose |
| --- | --- |
| `logo.png` | The SimpliiGood Spirulina logo (dark teal on transparent or white background). **Add this file** and every screen (sidebar, landing page, sign-in, application wizard) picks it up automatically; the white version for dark backgrounds is derived with CSS. Until it exists the interface shows a typographic wordmark. Recommended: PNG or SVG-in-PNG, at least 1200 px wide, transparent background. |
| `fonts/` | Heebo (Hebrew + Latin, variable weight), self-hosted so the public site never calls a third-party font server. Loaded only when the page is served over HTTP; the offline `index.html` falls back to system fonts. |

Files here are served by `server/index.js` and `serve.py` under `/assets/…`. `build.py` also inlines `logo.png` into `index.html` (as a data URI) so the self-contained file carries the logo too.
