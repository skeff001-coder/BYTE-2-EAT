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
| Codemagic build index | #53 (PROJECT_BUILD_NUMBER was 51) |
| Workflow | byte2eat-ios-release |
| Status | **FAILED — Publishing** |
| Confirmed at | 2026-06-01T17:38:10Z |
| Build URL | https://codemagic.io/app/6a08bc87f80611cfd210bf70/build/6a1dc208affee58e08c88ab9 |
| IPA artefact | https://api.codemagic.io/artifacts/662bf451-b91a-42ac-9734-1e0cc4e26f33/6b97dbbc-2320-4bd7-8370-f6f9810c8943/App.ipa |
| Build started | 2026-06-01T17:32:00Z |
| Build finished | 2026-06-01T17:38:10Z |

## Step-by-step outcome

| Step | Result |
|---|---|
| Preparing build machine | ✅ success |
| Fetching app sources | ✅ success |
| Install workspace dependencies | ✅ success |
| Sync Capacitor iOS project | ✅ success |
| Install CocoaPods dependencies | ✅ success |
| Set app version and build number | ✅ success |
| Fetch signing files | ✅ success |
| Build iOS IPA | ✅ success — App.ipa produced (7.6 MB) |
| **Publishing** | ❌ **FAILED** |

## Root cause of publishing failure

Two errors occurred in sequence during the `altool` upload:

1. **Transient Apple server error** — `GET APP SETTINGS: received status code 500; internal server error` (Request ID: SJQU5AMOVZ5AUDUN632N6Y4P5I)
2. **App Store Connect API key expired/revoked** — `APP STORE CONNECT API list-apps: failed to authenticate. NOT_AUTHORIZED — "Authentication credentials are missing or invalid."` (HTTP 401)

The `byte2eat_asc` Codemagic integration key is the blocker. The same 401 error appears in builds #51, #52, #53, and caused build #54 to fail even earlier (no provisioning profile could be fetched).

The IPA was **not** uploaded to TestFlight. Review submission was **not** finalized.

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
- **IPA did NOT reach TestFlight — see root cause above**
- Demo account credentials are stored privately — do not commit them to version control

## Action required before next build

1. **Regenerate App Store Connect API key** — Log into appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API. Generate a new key and download the `.p8` file.
2. **Update `byte2eat_asc` in Codemagic** — Go to codemagic.io → Team Settings → Integrations → App Store Connect → edit `byte2eat_asc` with the new Key ID, Issuer ID, and `.p8` file.
3. **Next build is #55** — `codemagic.yaml` is already bumped to `APP_VERSION: "1.0.2"` and `BUILD_NUMBER: "55"`. Trigger `byte2eat-ios-release` on `main` after the key is replaced.
   - Version bumped to 1.0.2 because Apple already approved 1.0.1; CFBundleShortVersionString must be strictly higher.
