"""Fresh clone: OS-deny every historical checkout and /Users during npm test."""
from pathlib import Path
import argparse, datetime, hashlib, json, shutil, subprocess, time
from zoneinfo import ZoneInfo

parser = argparse.ArgumentParser()
parser.add_argument('--clone', required=True, type=Path)
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
clone, out = args.clone.resolve(), args.output.resolve()
assert not clone.exists() and not out.exists()
out.mkdir(parents=True)
commit = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD']).decode().strip()
branch = subprocess.check_output(['git', '-C', str(root), 'branch', '--show-current']).decode().strip()
with (out / 'clone.log').open('wb') as log:
    subprocess.run(['git', 'clone', '--depth', '1', '--single-branch', '--branch', branch,
                    root.as_uri(), str(clone)], stdout=log, stderr=subprocess.STDOUT, check=True)
assert subprocess.check_output(['git', '-C', str(clone), 'rev-parse', 'HEAD']).decode().strip() == commit
# Copy dependencies with symlinks dereferenced: the clone's loader must not
# need the original /Users/.../node_modules. No package download or API call.
shutil.copytree(root / 'node_modules', clone / 'node_modules', symlinks=False)
checkouts = subprocess.check_output(['git', '-C', str(root), 'worktree', 'list', '--porcelain']).decode()
denied = sorted({'/Users', *[line.removeprefix('worktree ') for line in checkouts.splitlines()
                            if line.startswith('worktree ') and line.removeprefix('worktree ').startswith('/private/tmp/')]})
profile = '(version 1)\n(allow default)\n' + '\n'.join('(deny file-read* (subpath ' + json.dumps(path) + '))' for path in denied) + '\n'
profile_path = out / 'clone-isolation.sb'
profile_path.write_text(profile)
prefix = ['sandbox-exec', '-f', str(profile_path)]
probe_paths = ['/Users', '/private/tmp/praxis-checkpoint-c-prep', str(root)]
probe = subprocess.run(prefix + ['node', '--input-type=module', '-e',
    'import fs from "node:fs";const paths=JSON.parse(process.argv[1]);const rows=paths.map(path=>({path,visible:fs.existsSync(path)}));console.log(JSON.stringify(rows));if(rows.some(r=>r.visible))process.exit(1);',
    json.dumps(probe_paths)], cwd=clone, capture_output=True, text=True)
(out / 'isolation-probe.log').write_text(probe.stdout + probe.stderr)
assert probe.returncode == 0, 'historical checkout isolation failed: ' + probe.stdout + probe.stderr
started = time.monotonic()
at = datetime.datetime.now(ZoneInfo('Europe/Vienna')).isoformat()
with (out / 'clone-npm-test.log').open('wb') as log:
    process = subprocess.run(prefix + ['npm', 'test'], cwd=clone, stdout=log, stderr=subprocess.STDOUT, timeout=600)
status = subprocess.check_output(['git', '-C', str(clone), 'status', '--porcelain']).decode()
log_bytes = (out / 'clone-npm-test.log').read_bytes()
result = {'startedAt': at, 'timezone': 'Europe/Vienna', 'testedCommit': commit,
          'clone': str(clone), 'sourceCheckout': str(root), 'cloneMode': 'depth-one Git clone, dependency symlinks dereferenced; no network download',
          'isolation': 'macOS sandbox makes /Users and historical /private/tmp worktrees inaccessible to the test process and descendants; host directories are preserved, not deleted',
          'deniedReadRoots': denied, 'visibilityProbe': json.loads(probe.stdout),
          'elapsedSeconds': round(time.monotonic() - started, 6), 'exitCode': process.returncode,
          'gitStatusAfter': status, 'logSha256': hashlib.sha256(log_bytes).hexdigest()}
(out / 'portable-clone.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: result[key] for key in ['testedCommit', 'exitCode', 'elapsedSeconds', 'gitStatusAfter']}, indent=2))
assert process.returncode == 0 and not status
