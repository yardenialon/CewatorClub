#!/usr/bin/env python3
"""Rebuild index.html from the source files. Standard library only.

    python build.py            write index.html
    python build.py --check    exit 1 if index.html is out of date (used by CI)

Sources: styles.css, i18n.json, core.js, app.js. The page template lives here so
that the prototype stays a single self-contained file with no external assets.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "index.html"

TEMPLATE = """<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none';">
<title>SimpliiGood Creator Club | Local prototype</title>
<style>
{styles}
</style>
</head>
<body>
<div id="app"></div><div id="modal-root"></div><div id="toast" class="toast hide" role="status" aria-live="polite"></div>
<noscript>This local prototype requires JavaScript. No data leaves your device.</noscript>
<script>const TRANSLATIONS={i18n};</script>
<script>
{core}
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


def build() -> str:
    return TEMPLATE.format(
        styles=read("styles.css").strip(),
        i18n=load_i18n(),
        core=script("core.js"),
        app=script("app.js"),
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
