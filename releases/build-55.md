# Build 55 — App Store Submission (planned)

## Release info

| Field | Value |
|---|---|
| App version | 1.0.2 |
| Build number | 55 |
| Bundle ID | com.owenskeffington.bite |
| Branch | main |
| Status | **Pending — waiting for `byte2eat_asc` key to be refreshed** |

## Codemagic build

| Field | Value |
|---|---|
| Codemagic app ID | 6a08bc87f80611cfd210bf70 |
| Workflow | byte2eat-ios-release |
| Trigger | Manual — run after App Store Connect API key is replaced |

## Pre-flight checklist

- [ ] Regenerate App Store Connect API key (appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API)
- [ ] Update `byte2eat_asc` in Codemagic Team Settings with new Key ID / Issuer ID / `.p8`
- [ ] Verify `com.owenskeffington.bite` app exists in App Store Connect under Apple Team J6N9GAHK44
- [ ] Trigger `byte2eat-ios-release` on branch `main`
- [ ] Confirm Publishing step green in Codemagic
- [ ] Confirm build appears in TestFlight under App Store Connect
- [ ] Submit for App Store review

## Why version 1.0.2?

Apple's servers have `1.0.1` as the previously approved version for this bundle. Any upload with
`CFBundleShortVersionString` ≤ `1.0.1` is rejected. Build 55 ships `1.0.2`.

## What changed since build 50 (cumulative)

- Removed 30-pack IAP option entirely
- Updated legal and support contact details (privacy@byte2eat.app / support@byte2eat.app)
- Animated hero banner added to home screen
- Fixed bundle ID (`com.owenskeffington.bite`) across all config files
- App Store Submission Checklist added to `replit.md`
- Build number incremented through failed builds #51–#54 to reach #55
