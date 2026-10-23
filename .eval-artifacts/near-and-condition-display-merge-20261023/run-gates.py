from pathlib import Path
import subprocess, json, hashlib, time

root = Path('/private/tmp/praxis-phase2c-mainline-integration')
out = root / '.eval-artifacts/near-and-condition-display-merge-20261023/gates'
out.mkdir(parents=True, exist_ok=True)
generated = root / '.eval-artifacts/checkpoint-c-p21c-integration-20261020/region-composition-results.json'
before = generated.read_bytes()
(out / 'region-before.json').write_bytes(before)
rows = []
try:
    for name, cmd in [('typecheck',['npm','run','typecheck']),('arch-check',['npm','run','arch:check']),('default-tests',['npm','test']),('build',['npm','run','build']),('browser-fixtures',['npm','run','test:browser:fixture'])]:
        started = time.monotonic()
        with (out / (name + '.log')).open('wb') as log:
            p = subprocess.run(cmd, cwd=root, stdout=log, stderr=subprocess.STDOUT, timeout=720)
        row = {'name':name,'command':cmd,'exitCode':p.returncode,'elapsedMs':round((time.monotonic()-started)*1000)}
        rows.append(row)
        (out / 'results.json').write_text(json.dumps(rows,indent=2)+'\n')
        print(json.dumps(row), flush=True)
        if p.returncode:
            raise SystemExit(p.returncode)
finally:
    after = generated.read_bytes()
    (out / 'region-generated.json').write_bytes(after)
    generated.write_bytes(before)
    sha = lambda b: hashlib.sha256(b).hexdigest()
    (out / 'side-effect-verification.json').write_text(json.dumps({'originalSha256':sha(before),'generatedSha256':sha(after),'restoredSha256':sha(generated.read_bytes()),'restored':generated.read_bytes()==before,'reason':'Local Chromium suite produces tracked region-composition metrics; save separately and restore historical input bytes.'},indent=2)+'\n')
