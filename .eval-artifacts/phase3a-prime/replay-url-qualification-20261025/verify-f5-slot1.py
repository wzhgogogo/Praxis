"""Original F5 slot1 Replay, system-denied network, with a fixed prefix contract."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, platform, shutil, signal, subprocess

p = argparse.ArgumentParser(); p.add_argument('--output', type=Path, required=True); a = p.parse_args()
here = Path(__file__).resolve().parent; root = here.parents[2]; out = a.output.resolve()
assert not out.exists() and not out.is_relative_to(here / 'inputs')
out.mkdir(parents=True)
config_path = here / 'inputs/config.json'; config = json.loads(config_path.read_text())
assert config['modelMode'] == 'ORIGINAL'
manifest = json.loads((root / config['recordingDirectory'] / 'recording.json').read_text())
assert all(page['status'] == 'REPLAYABLE' and page['url'] == 'https://tabelog.com/en/tokyo/' for page in manifest['pages'][:2])
if platform.system() == 'Darwin':
    assert Path('/usr/bin/sandbox-exec').is_file()
    isolation = ['/usr/bin/sandbox-exec', '-p', '(version 1)(allow default)(deny network-outbound)']
elif platform.system() == 'Linux':
    executable = shutil.which('unshare'); assert executable, 'OS network isolation unavailable: unshare missing'
    isolation = [executable, '-rn', '--']
else: raise RuntimeError('OS network isolation unavailable on this platform')
command = [*isolation, 'node', '--import', 'tsx', 'src/eval/restaurant/agent-loop/runners/run-recorded-read.ts', str(config_path), str(out)]
started = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1), 'CET')).isoformat()
with (out / 'stdout.log').open('wb') as stdout, (out / 'stderr.log').open('wb') as stderr:
    process = subprocess.Popen(command, cwd=root, stdout=stdout, stderr=stderr, start_new_session=True)
    try: code = process.wait(timeout=120)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGTERM)
        try: process.wait(timeout=10)
        except subprocess.TimeoutExpired: os.killpg(process.pid, signal.SIGKILL); process.wait()
        raise RuntimeError('Bounded offline Replay did not settle')
summary = json.loads((out / 'replay.json').read_text())
receipt = {'command': command, 'exitCode': code, 'startedAtCET': started,
           'testedCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
           'orchestrationSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'configSha256': hashlib.sha256(config_path.read_bytes()).hexdigest(),
           'summary': summary, 'realModelCalls': 0, 'realGoogleCalls': 0, 'realWebsiteCalls': 0}
(out / 'verification.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(summary, indent=2), flush=True)
assert summary['modelTransportCalls'] == 0 and summary['modelMode'] == 'ORIGINAL'
assert 2 <= summary['consumedPages'] < summary['recordedPages'], 'Original qualified snapshots1/2 must actually replay; no fabricated page is permitted'
assert summary['status'] == 'REPLAY_INCOMPLETE', 'The known unqualified remainder cannot be reported as complete'
