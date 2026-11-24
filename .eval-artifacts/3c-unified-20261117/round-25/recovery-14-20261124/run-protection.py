from pathlib import Path
import hashlib
round_dir = Path(__file__).resolve().parent.parent
original = round_dir / "verify-protection.py"
source = original.read_bytes()
assert hashlib.sha256(source).hexdigest() == "796d4155f216a9b4fa8b138a038ec1edd265d89efe4b4e6d860f8f3cf4ef5cef"
# Only redirect the result destination. Keep the frozen checker and all assertions unchanged.
old = "(out/'protection-verification.json')"
new = "(out/'recovery-14-20261124/protection-verification.json')"
text = source.decode()
assert text.count(old) == 1
exec(compile(text.replace(old, new), str(original), "exec"), {"__file__": str(original), "__name__": "__main__"})
