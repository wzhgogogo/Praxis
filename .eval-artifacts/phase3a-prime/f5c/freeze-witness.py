#!/usr/bin/env python3
"""Offline exposed-data witness preparation. No network or model imports.

The public detail is identity evidence; a retained Google label is only a
frozen routing alias after its phone, house/building/floor and point agree.
This is not fresh certification, and never re-evaluates a historical run.
"""
import datetime as dt
import gzip
import hashlib
import html
import json
import math
import pathlib
import re
import subprocess
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
REV = 'a691f7ddbce7a4fc32829508993a1ef49b269fd2'
BASE = '.eval-artifacts/phase3a-prime/f5-live/'
inputs = []

def source(path, compressed=False):
    raw = subprocess.check_output(['git', 'show', REV + ':' + path], cwd=ROOT)
    decoded = gzip.decompress(raw) if compressed else raw
    inputs.append({'gitBlob': REV + ':' + path,
                   'blobSha256': hashlib.sha256(raw).hexdigest(),
                   'decodedSha256': hashlib.sha256(decoded).hexdigest()})
    return decoded

def key(value):
    return re.sub(r'[^\w]', '', ''.join(c for c in unicodedata.normalize('NFKD', value).lower()
                                     if not unicodedata.combining(c))).replace('chome', '')

def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def main():
    certificate = json.loads(source(BASE + 'certification-prelive/certificate.json'))
    proof = next(row for row in certificate['results'] if row['rst_id'] == '13108466')
    detail = source(BASE + 'certification-prelive/01-13108466-detail.body.gz', True)
    vacancy = source(BASE + 'certification-prelive/02-13108466-vacancy.body.gz', True)
    assert hashlib.sha256(detail).hexdigest() == proof['detail']['sha256']
    assert hashlib.sha256(vacancy).hexdigest() == proof['vacancy']['sha256']
    document = detail.decode()
    matches = re.findall(r'<p\b[^>]*class=["\'][^"\']*rstinfo-table__address[^"\']*["\'][^>]*>(.*?)</p>', document, re.S)
    addresses = {' '.join(html.unescape(re.sub('<[^>]*>', ' ', match)).split()) for match in matches}
    assert len(addresses) == 1, 'Missing/ambiguous public full address'
    address = next(iter(addresses))
    assert '1-15-1' in address and '新仲ビル1F' in address
    artifact_path = BASE + 'evidence/slot-1-2026-10-25T00-31-48-860Z-b95d1c09-0dea-478b-aa67-1269625daf61.result.json.gz'
    artifact = json.loads(source(artifact_path, True))
    # Selection is deterministic public phone/address evidence, not a model.
    observed = [c['restaurant'] for c in artifact['finalSnapshot']['domainState']['candidates']
                if c['restaurant']['sourceIds'].get('phone') == '03-5249-4011'
                and key('1-15-1 新仲ビル 1F') in key(c['restaurant'].get('address', ''))]
    assert '03-5249-4011' in document and key('1-15-1 新仲ビル 1F') in key(address)
    assert len(observed) == 1
    google = observed[0]
    assert all(part in key(proof['identityGeographyCategory']['name']) and part in key(google['outletName']) for part in ['dengana', 'akabane'])
    point = proof['identityGeographyCategory']['coordinates']
    a, b = math.radians(point['latitude']), math.radians(google['coordinates']['lat'])
    delta = math.radians(point['longitude'] - google['coordinates']['lng'])
    separation = 6371000 * 2 * math.asin(math.sqrt(math.sin((a-b)/2)**2 + math.cos(a)*math.cos(b)*math.sin(delta/2)**2))
    assert separation <= 100, 'Independent public point does not corroborate the frozen source alias'
    out = HERE / 'frozen-witness'
    out.mkdir(exist_ok=True)
    own = proof['vacancy']
    (out / 'vacancy.body.txt').write_bytes(vacancy)
    write(out / 'vacancy.metadata.json', {'method': 'GET', 'url': own['url'], 'status': own['status'],
          'finishedAt': own['finishedAtVienna'], 'sha256': own['sha256']})
    write(out / 'manifest.json', {'rows': [{'name': proof['identityGeographyCategory']['name'],
          'parameters': {'rst_id': proof['rst_id']}, 'bodyPath': 'vacancy.body.txt',
          'metadataPath': 'vacancy.metadata.json', 'sha256': own['sha256']}]})
    valid_until = (dt.datetime.fromisoformat(certificate['certifiedAtVienna']) + dt.timedelta(hours=24)).isoformat()
    witness = {'outletName': proof['identityGeographyCategory']['name'], 'sourceUrl': proof['detail']['url'],
        'address': address, 'distanceMeters': proof['identityGeographyCategory']['distanceMeters'],
        'hardEvidence': [{'criterion': 'kushikatsu', 'quote': '\n'.join(proof['identityGeographyCategory']['categoryQuotes'])}],
        'observedSourceIdentities': [{'outletName': google['outletName'], 'address': google['address']}],
        'identityAudit': {'publicFullAddress': address, 'houseBuildingFloor': '1-15-1 新仲ビル 1F',
            'publicDetailSource': {'gitBlob': REV + ':' + BASE + 'certification-prelive/01-13108466-detail.body.gz', 'decodedSha256': proof['detail']['sha256']},
            'publicPhone': '03-5249-4011', 'pointSeparationMeters': separation, 'aliasSource': REV + ':' + artifact_path,
            'basis': 'Public detail phone + complete house/building/floor + coordinates; names share Dengana/Akabane. Google strings are exposed historical routing labels, not new certification.'}}
    write(out / 'registry.json', {'schema': 'f5-witness-identity@2', 'status': 'frozen regression / exposed; NOT_CURRENT_CERTIFICATION',
        'validUntil': valid_until, 'variants': [{'variantId': 'f5c-dengana-offline', 'center': certificate['center'], 'witnesses': [witness]}]})
    write(HERE / 'witness-inputs-sha256.json', {'revision': REV, 'inputs': inputs, 'networkCalls': 0, 'modelCalls': 0})
    print(json.dumps({'status': 'OFFLINE_WITNESS_IDENTITY_FROZEN', 'fullAddress': address, 'identities': 2, 'GET': 0}, ensure_ascii=False))

if __name__ == '__main__':
    main()
