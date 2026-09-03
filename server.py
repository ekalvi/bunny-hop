#!/usr/bin/env python3
"""Small LAN-only static server for Hop for the Prize."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import os
import sys

ROOT = Path(__file__).resolve().parent / "public"

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".svg": "image/svg+xml", ".js": "text/javascript", ".css": "text/css"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; frame-src https://www.youtube.com https://www.youtube-nocookie.com; base-uri 'self'; form-action 'self' mailto:; frame-ancestors 'self'")
        self.send_header("Cache-Control", "no-cache" if self.path.endswith((".html", ".js")) or self.path == "/" else "public, max-age=3600")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            body = (ROOT / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD": self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):
        print(f'{self.address_string()} [{self.log_date_time_string()}] {fmt % args}', flush=True)

class Server(ThreadingHTTPServer):
    def handle_error(self, request, client_address):
        if isinstance(sys.exc_info()[1], (BrokenPipeError, ConnectionResetError)):
            return
        super().handle_error(request, client_address)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8780")))
    args = parser.parse_args()
    server = Server((args.host, args.port), Handler)
    print(f"Hop for the Prize serving {ROOT} on http://{args.host}:{args.port}", flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
