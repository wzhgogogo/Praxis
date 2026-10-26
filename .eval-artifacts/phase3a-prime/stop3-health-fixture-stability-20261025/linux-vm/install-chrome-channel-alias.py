from pathlib import Path
import hashlib,json,subprocess,os
# The legacy static-DOM default test hardcodes channel="chrome". Provide the
# already installed real Playwright Chromium binary at its expected path.
# This is an explicit temporary Guest environment alias, not a browser mock.
candidates=[p for p in (Path.home()/'.cache/ms-playwright/chromium_headless_shell-1234').rglob('headless_shell') if p.is_file()]
assert len(candidates)==1,candidates
binary=candidates[0].resolve(); alias=Path('/opt/google/chrome/chrome')
assert not alias.exists() and not alias.is_symlink(),str(alias)
version=subprocess.check_output([str(binary),'--version'],text=True).strip()
subprocess.run(['sudo','mkdir','-p',str(alias.parent)],check=True)
subprocess.run(['sudo','ln','-s',str(binary),str(alias)],check=True)
assert alias.resolve()==binary
result={'purpose':'Legacy default static-DOM test hardcodes channel chrome; use real installed Chromium without changing repository or assertions','actualBrowser':version,'actualBinary':str(binary),'actualBinarySha256':hashlib.sha256(binary.read_bytes()).hexdigest(),'channelPath':str(alias),'isSymlink':alias.is_symlink(),'symlinkTarget':os.readlink(alias),'claim':'Real Playwright Chromium Headless Shell, not branded Google Chrome validation','scope':'Temporary Guest only; removed with VM'}
Path('/tmp/praxis-health-chrome-channel-alias.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
