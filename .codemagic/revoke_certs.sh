#!/usr/bin/env bash
# Revoke all Distribution certificates via Apple API using bash + openssl + curl
# No Python cryptography library required
set -e

KEY_ID="$APP_STORE_CONNECT_KEY_IDENTIFIER"
ISSUER_ID="$APP_STORE_CONNECT_ISSUER_ID"
PRIVATE_KEY="$APP_STORE_CONNECT_PRIVATE_KEY"
NOW=$(date +%s)
EXP=$((NOW + 1200))

b64url() {
  printf '%s' "$1" | base64 | tr '+/' '-_' | tr -d '=\n'
}

HEADER=$(b64url '{"alg":"ES256","kid":"'"$KEY_ID"'","typ":"JWT"}')
PAYLOAD=$(b64url '{"iss":"'"$ISSUER_ID"'","iat":'"$NOW"',"exp":'"$EXP"',"aud":"appstoreconnect-v1"}')
UNSIGNED="$HEADER.$PAYLOAD"

printf '%s' "$PRIVATE_KEY" | sed 's/\\n/\n/g' > /tmp/asc_key.p8
printf '%s' "$UNSIGNED" | openssl dgst -sha256 -sign /tmp/asc_key.p8 -binary > /tmp/sig.der

SIG=$(python3 -c "import base64; der=open('/tmp/sig.der','rb').read(); i=2; rlen=der[i]; i+=1; r=der[i:i+rlen]; i+=rlen; i+=1; slen=der[i]; i+=1; s=der[i:i+slen]; r=r.lstrip(b'\x00').rjust(32,b'\x00'); s=s.lstrip(b'\x00').rjust(32,b'\x00'); print(base64.urlsafe_b64encode(r+s).rstrip(b'=').decode())")

JWT="$UNSIGNED.$SIG"
rm -f /tmp/asc_key.p8 /tmp/sig.der

echo "Fetching Distribution certificates..."
RESPONSE=$(curl -sf \
  -H "Authorization: Bearer $JWT" \
  "https://api.appstoreconnect.apple.com/v1/certificates?filter%5BcertificateType%5D=DISTRIBUTION%2CIOS_DISTRIBUTION&limit=200")

CERT_IDS=$(printf '%s' "$RESPONSE" | python3 -c "import json,sys; [print(c['id']) for c in json.load(sys.stdin).get('data',[])]")

if [ -z "$CERT_IDS" ]; then
  echo "No Distribution certificates found."
  exit 0
fi

for ID in $CERT_IDS; do
  echo "Revoking $ID..."
  curl -sf -X DELETE \
    -H "Authorization: Bearer $JWT" \
    "https://api.appstoreconnect.apple.com/v1/certificates/$ID" \
    && echo "  Revoked OK" || echo "  Failed (may already be gone)"
done

echo "All done."
