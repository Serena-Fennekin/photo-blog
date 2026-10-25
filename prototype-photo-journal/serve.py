"""THROWAWAY PROTOTYPE SERVER. Run: python prototype-photo-journal/serve.py"""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial


ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 4173


if __name__ == "__main__":
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    print(f"Photo journal prototype: http://{HOST}:{PORT}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

