#!/usr/bin/env python3
"""Optional local server for the prototype. Standard library only.

    python serve.py            http://127.0.0.1:8765/
    python serve.py 9000       custom port

Binds to 127.0.0.1 only. Data is still stored in the browser, not on this server.
Do not expose it to the internet.
"""
import json
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # The page asks whether a club server is behind it. This one is static: answer "local"
        # so the prototype keeps using browser storage (and the console stays clean).
        if self.path.split("?")[0] == "/api/session":
            assets = ROOT / "assets"
            body = json.dumps({
                "mode": "local",
                "logo": (assets / "logo.png").is_file(),
                "assets": [f for f in ("hero.jpg", "box.jpg", "founder.jpg") if (assets / f).is_file()],
            }).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the console quiet
        pass


def make_server(port: int = 0) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((HOST, port), partial(Handler, directory=str(ROOT)))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = make_server(port)
    print(f"SimpliiGood Creator Club prototype: http://{HOST}:{server.server_port}/")
    print("Local only. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
