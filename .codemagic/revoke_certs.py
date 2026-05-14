#!/usr/bin/env python3
"""
Revoke all existing iOS Distribution certificates via the App Store Connect API.
Handles private key newline normalisation and fetches all cert types.
"""
import time
import base64
import json
import os
import sys
import urllib.request
import urllib.error


def b64url(obj):
    if isinstance(obj, dict):
        data = json.dumps(obj, separators=(',', ':')).encode()
    elif isinstance(obj, bytes):
        data = obj
    else:
        data = obj.encode()
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def generate_jwt():
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    from cryptography.hazmat.backends import default_backend

    key_id    = os.environ['APP_STORE_CONNECT_KEY_IDENTIFIER']
    issuer_id = os.environ['APP_STORE_CONNECT_ISSUER_ID']
    pem       = os.environ['APP_STORE_CONNECT_PRIVATE_KEY']

    # Normalise escaped newlines that some CI systems inject
    pem = pem.replace('\\n', '\n')
    if not pem.strip().startswith('-----'):
        # Might be base64-only; wrap it
        pem = f"-----BEGIN PRIVATE KEY-----\n{pem.strip()}\n-----END PRIVATE KEY-----\n"

    now     = int(time.time())
    header  = {'alg': 'ES256', 'kid': key_id, 'typ': 'JWT'}
    payload = {'iss': issuer_id, 'iat': now, 'exp': now + 1200,
               'aud': 'appstoreconnect-v1'}

    unsigned = f"{b64url(header)}.{b64url(payload)}"
    key = serialization.load_pem_private_key(
        pem.encode(), password=None, backend=default_backend())
    sig = key.sign(unsigned.encode(), ec.ECDSA(hashes.SHA256()))
    r, s = decode_dss_signature(sig)
    return f"{unsigned}.{b64url(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"


DISTRIBUTION_TYPES = {
    'IOS_DISTRIBUTION',
    'DISTRIBUTION',
    'APPLE_DISTRIBUTION',
    'MAC_APP_DISTRIBUTION',
}


def main():
    token   = generate_jwt()
    print(f'JWT generated OK')
    headers = {'Authorization': f'Bearer {token}'}

    # Fetch ALL certificates (no type filter) so we don't miss any
    url  = 'https://api.appstoreconnect.apple.com/v1/certificates?limit=200'
    req  = urllib.request.Request(url, headers=headers)
    data = json.loads(urllib.request.urlopen(req).read())
    all_certs = data.get('data', [])
    print(f'Total certificates in account: {len(all_certs)}')

    to_revoke = []
    for cert in all_certs:
        cert_type = cert.get('attributes', {}).get('certificateType', 'UNKNOWN')
        cert_name = cert.get('attributes', {}).get('name', '')
        print(f'  Found: {cert["id"]} type={cert_type} name={cert_name}')
        if cert_type in DISTRIBUTION_TYPES:
            to_revoke.append(cert['id'])

    print(f'Revoking {len(to_revoke)} Distribution certificate(s)...')
    for cid in to_revoke:
        del_req = urllib.request.Request(
            f'https://api.appstoreconnect.apple.com/v1/certificates/{cid}',
            method='DELETE',
            headers=headers)
        try:
            urllib.request.urlopen(del_req)
            print(f'  Revoked {cid} OK')
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors='replace')
            print(f'  {cid}: HTTP {e.code} {e.reason} — {body}')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        import traceback
        print(f'Certificate cleanup failed: {e}', file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)   # Fail loudly so we can see what went wrong
