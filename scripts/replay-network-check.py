"""Linux witness: non-root unshare creates a network namespace with no egress."""
import argparse, datetime, http.server, json, os, platform, subprocess, threading
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
args.output.parent.mkdir(parents=True, exist_ok=True)
result = {'platform': platform.platform(), 'uid': os.getuid(), 'isolation': ['unshare', '-rn'],
          'at': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1), 'CET')).isoformat()}
hits = []
class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        hits.append(self.path)
        self.send_response(200); self.end_headers(); self.wfile.write(b'local fixture')
    def log_message(self, *_args): pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
try:
    assert platform.system() == 'Linux', 'This witness requires a real Linux kernel'
    assert os.geteuid() != 0, 'unshare must be invoked by an ordinary, non-root user'
    url = 'http://127.0.0.1:' + str(server.server_port) + '/network-witness'
    curl = ['curl', '--noproxy', '*', '--silent', '--show-error', '--max-time', '3', '--output', '/dev/null', '--write-out', '%{http_code}', url]
    positive = subprocess.run(curl, capture_output=True, text=True, timeout=5)
    assert positive.returncode == 0 and positive.stdout == '200', 'parent network namespace must reach the live local receiver'
    parent_ns = os.readlink('/proc/self/ns/net')
    namespace = subprocess.run(['unshare', '-rn', '--', 'readlink', '/proc/self/ns/net'], capture_output=True, text=True, timeout=5)
    assert namespace.returncode == 0, 'required non-privileged unshare -rn unavailable: ' + namespace.stderr
    assert namespace.stdout.strip() != parent_ns, 'unshare must create a different network namespace'
    denied = subprocess.run(['unshare', '-rn', '--', *curl], capture_output=True, text=True, timeout=5)
    assert denied.returncode == 7, 'isolated curl must fail to connect: ' + repr((denied.returncode, denied.stderr))
    assert hits == ['/network-witness'], 'the isolated child must not reach even the local source'
    result.update(status='PASS', parentNamespace=parent_ns, childNamespace=namespace.stdout.strip(),
                  parentHttpStatus=200, isolatedCurlExit=denied.returncode, isolatedSourceHits=0,
                  realModelCalls=0, realGoogleCalls=0, realWebsiteCalls=0, liveRuns=0)
except Exception as error:
    result.update(status='FAIL', reason=str(error))
    raise
finally:
    server.shutdown(); server.server_close(); thread.join(timeout=2)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
