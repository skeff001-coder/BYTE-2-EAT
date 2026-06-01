# Build 54 — App Store Submission

## Release info

| Field | Value |
|---|---|
| App version | 1.0.0 |
| Build number | 54 |
| Bundle ID | com.owenskeffington.bite |
| Branch | main |
| Commit | 365fdf672c3c0746467580000ad1078b49a04882 |
| Submitted | 2026-06-01 |

## Codemagic build

| Field | Value |
|---|---|
| Codemagic app ID | 6a08bc87f80611cfd210bf70 |
| Codemagic build ID | 6a1dc49bd699f8469c2dbb78 |
| Workflow | byte2eat-ios-release |
| Previous failed builds | 51, 52, 53 |
| Build URL | https://codemagic.io/app/6a08bc87f80611cfd210bf70/build/6a1dc49bd699f8469c2dbb78 |

## What changed since build 50

- Removed 30-pack IAP option entirely
- Updated legal and support contact details (privacy@byte2eat.app / support@byte2eat.app)
- Animated hero banner added to home screen (flickering camera + cycling taglines)
- Fixed bundle ID across all config files (was `Com.bitecooking.app` / `com.bitecooking.app`, corrected to `com.owenskeffington.bite`)
- Build number bumped to 54 (builds 51–53 failed at upload step)

## App Store Connect

- Publishing target: TestFlight (auto-upload via `byte2eat_asc` integration)
- Apple Team ID: J6N9GAHK44
- Demo account credentials are stored privately — do not commit them to version control
