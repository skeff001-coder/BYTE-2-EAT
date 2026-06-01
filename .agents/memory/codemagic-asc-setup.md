---
name: Codemagic + App Store Connect setup
description: Key names, bundle ID, IAP product IDs, and git auth details for Byte 2 Eat iOS CI/CD.
---

## Codemagic integration key name
The key in `codemagic.yaml` must be `byte2eat_admin` (all lowercase).
Apple Developer Portal integration page shows: `byte2eat_admin` (Key: 6587GDLVZP).
Previous failures used `Byte2eat_admin` or `byte2eat_codemagic_2026-06` — both wrong.

**Why:** Codemagic key names are case-sensitive and must match the integration name exactly.

## Bundle ID
`Com.bitecooking.app` — note capital C. This is how it was registered in App Store Connect.
Must be set consistently in:
- `codemagic.yaml` (`BUNDLE_ID` var)
- `capacitor.config.ts` (`appId`)
- `ios/App/App.xcodeproj/project.pbxproj` (Debug + Release `PRODUCT_BUNDLE_IDENTIFIER`)
- `ios/App/App/capacitor.config.json` (`appId`)

## IAP Product IDs (must match App Store Connect exactly)
- Single scan: `com.byt2eat.single` (CONSUMABLE)
- 10-scan pack: `com.byt2eat.premium10` (NON_CONSUMABLE)
- 30-pack `com.byt2eat.saver` was removed from sale — do not re-add.

Set in `src/lib/use-iap.ts` and `src/lib/app-info.ts`.

## Git push auth
GitHub remote uses HTTPS. Auth via `GITHUB_PERSONAL_ACCESS_TOKEN` env var.
To push from shell: `echo "https://skeff001-coder:$GITHUB_PERSONAL_ACCESS_TOKEN@github.com" > ~/.git-credentials && git config --global credential.helper store`
Lock files that block git: `.git/index.lock`, `.git/refs/remotes/origin/main.lock`, `.git/objects/maintenance.lock` — safe to `rm -f`.

## dist/ folder
`artifacts/culinary-scan-assist/dist/` is tracked in git (needed for Codemagic Capacitor build).
Rebuild with: `pnpm --filter @workspace/culinary-scan-assist run build:capacitor`
Always rebuild after changing product IDs or bundle ID in source files.
