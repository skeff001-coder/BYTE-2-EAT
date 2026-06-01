# Build 55 — App Store Submission

## Release info

| Field | Value |
|---|---|
| App version | 1.0.2 |
| Build number | 55 |
| Bundle ID | com.owenskeffington.bite |
| Branch | main |
| Status | **Blocked by expired `byte2eat_asc` key — fix documented below** |

## Codemagic build

| Field | Value |
|---|---|
| Codemagic app ID | 6a08bc87f80611cfd210bf70 |
| Workflow | byte2eat-ios-release |
| Trigger | Manual — run after App Store Connect API key is replaced |

## Root cause of failure (builds #51–#54)

The `byte2eat_asc` App Store Connect API key stored in **Codemagic → Team Settings → Integrations** expired or was revoked. Every build compiled and signed correctly; only the final upload to App Store Connect/TestFlight failed with:

```
NOT_AUTHORIZED — Provide a properly configured and signed bearer token
```

The `codemagic.yaml` config is correct and does not need changes. The fix is replacing the key in Codemagic's external integration settings.

## Fix: regenerate and rotate the App Store Connect API key

**Step 1 — Generate a new key (Apple)**

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Users and Access** → **Integrations** tab → **App Store Connect API**
3. Click **+** → name it `byte2eat_codemagic_2026-06` (include date for rotation tracking), set Access to **App Manager**
4. Download the `.p8` file — Apple only shows it once
5. Note the **Key ID** and **Issuer ID** shown on the page

**Step 2 — Update Codemagic**

1. Go to [codemagic.io](https://codemagic.io) → **Team Settings** → **Integrations**
2. Find `byte2eat_asc` → click **Edit**
3. Replace: **Key ID**, **Issuer ID**, **.p8 file**
4. Save

**Step 3 — Re-trigger build**

Run `byte2eat-ios-release` on branch `main`. The Publishing step should turn green and the IPA will appear in TestFlight under Apple Team J6N9GAHK44.

## Pre-flight checklist

- [ ] Regenerate App Store Connect API key (role: App Manager)
- [ ] Update `byte2eat_asc` in Codemagic Team Settings with new Key ID / Issuer ID / `.p8`
- [ ] Verify `com.owenskeffington.bite` app exists in App Store Connect under Apple Team J6N9GAHK44
- [ ] Trigger `byte2eat-ios-release` on branch `main`
- [ ] Confirm Publishing step green in Codemagic build log
- [ ] Confirm build appears in TestFlight under App Store Connect
- [ ] Submit for App Store review

## Key rotation reminder

Apple ASC API keys do not send expiry warnings. Add a recurring calendar reminder every **6 months** to rotate this key before it causes another outage. Name new keys with the creation date (e.g. `byte2eat_codemagic_YYYY-MM`) so staleness is visible at a glance in App Store Connect.

## Why version 1.0.2?

Apple's servers have `1.0.1` as the previously approved version for this bundle. Any upload with `CFBundleShortVersionString` ≤ `1.0.1` is rejected. Build 55 ships `1.0.2`.

## What changed since build 50 (cumulative)

- Removed 30-pack IAP option entirely
- Updated legal and support contact details (privacy@byte2eat.app / support@byte2eat.app)
- Animated hero banner added to home screen
- Fixed bundle ID (`com.owenskeffington.bite`) across all config files
- App Store Submission Checklist added to `replit.md`
- Build number incremented through failed builds #51–#54 to reach #55
