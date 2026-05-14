#!/usr/bin/env python3
"""
Revoke all existing iOS Distribution certificates via the App Store Connect API.
Run before fetch-signing-files --create so Codemagic can create a fresh
certificate with its own private key (avoids 'Cannot save Signing Certificates
without certificate private key' errors caused by certs created on other machines).
"""
import time
import base64
import json
import os
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


def main():
    token   = generate_jwt()
    headers = {'Authorization': f'Bearer {token}'}

    url  = ('https://api.appstoreconnect.apple.com/v1/certificates'
            '?filter[certificateType]=IOS_DISTRIBUTION&limit=200')
    req  = urllib.request.Request(url, headers=headers)
    data = json.loads(urllib.request.urlopen(req).read())
    certs = data.get('data', [])
    print(f'Found {len(certs)} Distribution certificate(s) — revoking all')

    for cert in certs:
        cid = cert['id']
        del_req = urllib.request.Request(
            f'https://api.appstoreconnect.apple.com/v1/certificates/{cid}',
            method='DELETE',
            headers=headers)
        try:
            urllib.request.urlopen(del_req)
            print(f'  Revoked {cid}')
        except urllib.error.HTTPError as e:
            print(f'  {cid}: {e.code} {e.reason} (continuing)')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'Certificate cleanup skipped: {e}')
