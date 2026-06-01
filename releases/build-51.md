# Build 51 — App Store Submission

## Release info

| Field | Value |
|---|---|
| App version | 1.0.0 |
| Build number | 51 |
| Bundle ID | com.owenskeffington.bite |
| Branch | main |
| Submitted | 2026-06-01 |

## Codemagic build

| Field | Value |
|---|---|
| Codemagic app ID | 6a08bc87f80611cfd210bf70 |
| Codemagic build ID | 6a1dc208affee58e08c88ab9 |
| Workflow | byte2eat-ios-release |
| Status | publishing (uploading to TestFlight) |
| Build URL | https://codemagic.io/app/6a08bc87f80611cfd210bf70/build/6a1dc208affee58e08c88ab9 |
| IPA artefact | https://api.codemagic.io/artifacts/662bf451-b91a-42ac-9734-1e0cc4e26f33/6b97dbbc-2320-4bd7-8370-f6f9810c8943/App.ipa |
| Build started | 2026-06-01T17:32:00Z |

## What changed since build 50

- Removed 30-pack IAP option
- Updated legal and support contact details (privacy@byte2eat.app / support@byte2eat.app)
- Animated hero banner added to home screen
- Fixed bundle ID across all config files (was `Com.bitecooking.app` in capacitor.config.ts,
  `com.bitecooking.app` in capacitor.config.json, and `Com.bitecooking.app` in
  project.pbxproj — all corrected to `com.owenskeffington.bite`)
- Build number pinned via `BUILD_NUMBER=51` in codemagic.yaml; build script now
  uses `$BUILD_NUMBER` (was referencing undefined `$PROJECT_BUILD_NUMBER`)

## App Store Connect

- Publishing target: TestFlight (auto-upload via `byte2eat_asc` integration)
- Apple Team ID: J6N9GAHK44
- Demo account credentials are stored privately — do not commit them to version control
