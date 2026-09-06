#!/usr/bin/env python3
"""Rebuild index.html from the source files. Standard library only.

    python build.py            write index.html
    python build.py --check    exit 1 if index.html is out of date (used by CI)

Sources: styles.css, i18n.json, core.js, format.js and app/*.js (concatenated in
file-name order inside one IIFE, so they share scope: 00-state.js first, 90-events.js
last). The page template lives here so that the prototype stays a single
self-contained file with no external assets.
"""
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "index.html"
LOGO = ROOT / "assets" / "logo.png"
FAVICON = "data:image/svg+xml," + (
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
    "%3Crect width='64' height='64' rx='14' fill='%23163a40'/%3E"
    "%3Ctext x='32' y='45' font-family='Impact,Arial Black,sans-serif' font-size='38' font-weight='900' text-anchor='middle' fill='%23fee62d'%3ES%3C/text%3E%3C/svg%3E"
)

TEMPLATE = """<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none';">
<meta name="description" content="SimpliiGood Creator Club: fresh-frozen spirulina delivered to your door, a clear brief, and a fee or commission for every piece that goes live.">
<meta name="theme-color" content="#163a40">
<link rel="icon" href="{favicon}">
<title>SimpliiGood Creator Club</title>
<style>
{styles}
</style>
</head>
<body>
<div id="app"></div><div id="modal-root"></div><div id="toast" class="toast hide" role="status" aria-live="polite"></div>
<noscript>This local prototype requires JavaScript. No data leaves your device.</noscript>
<script>const TRANSLATIONS={i18n};const LOGO_SRC={logo};</script>
<script>
{core}
</script>
<script>
{format}
</script>
<script>
{app}
</script>
</body>
</html>
"""


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


def load_i18n() -> str:
    data = json.loads(read("i18n.json"))
    langs = list(data)
    for lang in langs:
        for other in langs:
            missing = [k for k in data[lang] if k not in data[other]]
            if missing:
                sys.exit(f'i18n.json: keys in "{lang}" missing from "{other}": {", ".join(missing)}')
    # ensure_ascii keeps the inline JSON free of "<", U+2028 and U+2029.
    return json.dumps(data, ensure_ascii=True, separators=(",", ":"))


def script(name: str) -> str:
    code = read(name).strip()
    if "</script" in code.lower():
        sys.exit(f'{name} contains "</script>", which would break the bundle')
    return code


def app_bundle() -> str:
    parts = sorted(p for p in (ROOT / "app").glob("*.js"))
    if not parts:
        sys.exit("app/ contains no .js files")
    body = "\n\n".join(script(f"app/{p.name}") for p in parts)
    return "/* Bilingual local prototype. All external actions are intentionally absent. */\n(function () {\n'use strict';\n" + body + "\n})();"


def logo_src() -> str:
    """assets/logo.png is inlined when present so the single file carries the brand; otherwise the
    page asks the server for /assets/logo.png at runtime and falls back to a typographic wordmark."""
    if LOGO.exists():
        return json.dumps("data:image/png;base64," + base64.b64encode(LOGO.read_bytes()).decode("ascii"))
    return json.dumps("assets/logo.png")


def build() -> str:
    return TEMPLATE.format(
        styles=read("styles.css").strip(),
        i18n=load_i18n(),
        logo=logo_src(),
        favicon=FAVICON,
        core=script("core.js"),
        format=script("format.js"),
        app=app_bundle(),
    )


def main() -> None:
    html = build()
    if "--check" in sys.argv:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != html:
            sys.exit("index.html is out of date. Run: python build.py")
        print("index.html is up to date.")
        return
    OUT.write_text(html, encoding="utf-8", newline="\n")
    print(f"Wrote {OUT} ({len(html.encode('utf-8')) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
