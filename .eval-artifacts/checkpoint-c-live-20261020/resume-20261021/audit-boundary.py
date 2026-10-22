"""Offline reproduction of the user-boundary finding; no production parser or transport."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class ReservationForm(HTMLParser):
    def __init__(self):
        super().__init__()
        self.forms = []
        self.customer_fields = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'form' and attrs.get('id') == 'new_reservation' and attrs.get('method', '').lower() == 'post' and '/reserve/create' in attrs.get('action', ''):
            self.forms.append(attrs['action'])
        if tag == 'input' and attrs.get('name', '').startswith('reservation[customer]'):
            self.customer_fields.append(attrs['name'])

    @property
    def present(self):
        return bool(self.forms and any('[email]' in n for n in self.customer_fields) and any('[first_name]' in n for n in self.customer_fields))


def parse(path):
    parser = ReservationForm()
    parser.feed(path.read_text())
    return parser


review = json.loads((ROOT / 'independent-boundary-review.json').read_text())
positive = []
for evidence in review['S0_BOUNDARY']['evidence']:
    path = Path(evidence['path'])
    assert hashlib.sha256(path.read_bytes()).hexdigest() == evidence['sha256']
    assert parse(path).present, path
    positive.append({'path': str(path), 'sha256': evidence['sha256'], 'reservationForm': True})
recording = next((ROOT / 'results/c-04-attempt-1/recordings').glob('*/recording.json'))
documents = json.loads(recording.read_text())['documents']
business = next(d for d in documents if d['url'] == 'https://www.tablecheck.com/en/tounai')
negative_path = recording.parent / business['file']
assert not parse(negative_path).present
print(json.dumps({'status': 'DETECTOR_CONTROLS_PASS', 'productBoundaryAcceptance': 'FAIL', 'meaning': 'The independent detector confirms the forbidden form opening; passing detector controls does not mean product safety passes.', 'positiveCapturedForms': len(positive), 'negativePublicBusinessPage': {'path': str(negative_path), 'sha256': hashlib.sha256(negative_path.read_bytes()).hexdigest(), 'reservationForm': False}, 'positiveEvidence': positive, 'network': 0, 'modelCalls': 0}, indent=2))
