"""Serve the static website at / and at its GitHub Pages repository path."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREFIX = '/' + ROOT.name


class WebsiteHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path == PREFIX or path.startswith(PREFIX + '/'):
            path = path[len(PREFIX):] or '/'
        return super().translate_path(path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=3000)
    args = parser.parse_args()
    handler = partial(WebsiteHandler, directory=str(ROOT))
    with ThreadingHTTPServer(('0.0.0.0', args.port), handler) as server:
        print(f'Serving {ROOT.name} on port {args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
