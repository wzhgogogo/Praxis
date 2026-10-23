"""Fresh clone: OS-deny historical data reads; existence metadata is reported, not hidden."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, shutil, subprocess, time
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
primary = Path(subprocess.check_output(['git','-C',str(root),'rev-parse','--path-format=absolute','--git-common-dir']).decode().strip()).parent
probe_paths = [{'directory':'/Users','file':str(primary/'package.json')},
               {'directory':'/private/tmp/praxis-checkpoint-c-prep','file':'/private/tmp/praxis-checkpoint-c-prep/package.json'},
               {'directory':str(root),'file':str(root/'package.json')}]
assert all(Path(row['file']).exists() for row in probe_paths), 'negative controls must exist on host'

probe = subprocess.run(prefix + ['node', '--input-type=module', '-e',
    'import fs from "node:fs";const paths=JSON.parse(process.argv[1]);const rows=paths.map(row=>{let listError,readError;try{fs.readdirSync(row.directory)}catch(e){listError=e.code}try{fs.readFileSync(row.file)}catch(e){readError=e.code}return {...row,existenceMetadataVisible:fs.existsSync(row.directory),listError,readError}});console.log(JSON.stringify(rows));if(rows.some(r=>!["EPERM","EACCES"].includes(r.listError)||!["EPERM","EACCES"].includes(r.readError)))process.exit(1);',
    json.dumps(probe_paths)], cwd=clone, capture_output=True, text=True)
(out / 'isolation-probe.log').write_text(probe.stdout + probe.stderr)
assert probe.returncode == 0, 'historical checkout isolation failed: ' + probe.stdout + probe.stderr
started = time.monotonic()
at = datetime.datetime.now(ZoneInfo('Europe/Vienna')).isoformat()
environment={**os.environ,'NPM_CONFIG_USERCONFIG':'/dev/null','NPM_CONFIG_CACHE':'/private/tmp/praxis-f1b-clone-npm-cache','NPM_CONFIG_UPDATE_NOTIFIER':'false'}
with (out / 'clone-npm-test.log').open('wb') as log:
    process = subprocess.run(prefix + ['npm', 'test'], cwd=clone, env=environment, stdout=log, stderr=subprocess.STDOUT, timeout=600)
status = subprocess.check_output(['git', '-C', str(clone), 'status', '--porcelain']).decode()
log_bytes = (out / 'clone-npm-test.log').read_bytes()
result = {'startedAt': at, 'timezone': 'Europe/Vienna', 'testedCommit': commit,
          'clone': str(clone), 'sourceCheckout': str(root), 'cloneMode': 'depth-one Git clone, dependency symlinks dereferenced; no network download',
          'isolation': 'macOS sandbox denies directory listing and data reads in /Users and historical /private/tmp worktrees to the process and descendants. Existence metadata can remain visible. Host directories are preserved.',
          'sourceFreezeSha256':hashlib.sha256((root/'.eval-artifacts/phase3a-prime/f1b/portable-clone-freeze.json').read_bytes()).hexdigest(),
          'deniedReadRoots': denied, 'visibilityProbe': json.loads(probe.stdout),
          'elapsedSeconds': round(time.monotonic() - started, 6), 'exitCode': process.returncode,
          'gitStatusAfter': status, 'logSha256': hashlib.sha256(log_bytes).hexdigest()}
(out / 'portable-clone.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: result[key] for key in ['testedCommit', 'exitCode', 'elapsedSeconds', 'gitStatusAfter']}, indent=2))
assert process.returncode == 0 and not status
