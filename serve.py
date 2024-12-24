#!/usr/bin/env python3

import sys
import http.server

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_my_headers()
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def send_my_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")

if __name__ == '__main__':
    #http.server.test(HandlerClass=BaseHTTPRequestHandler, ServerClass=ThreadingHTTPServer, protocol="HTTP/1.0", port=8000, bind=None)
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 3000
    http.server.test(HandlerClass=MyHTTPRequestHandler, protocol="HTTP/1.0", port=port)

