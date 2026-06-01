# App Store Connect API Key Rotation

## Why this matters

Apple ASC API keys have no built-in expiry notification. The `byte2eat_asc` key expired without warning and blocked every CI build until it was manually replaced. A 6-month rotation cadence with a calendar reminder prevents this class of outage entirely.

---

## Rotation schedule

**Rotate every 6 months.** Set a recurring calendar event shared with the whole team:

- Title: `🔑 Rotate Byte2Eat ASC API Key (Codemagic)`
- Recurrence: every 6 months
- Reminder: 2 weeks before (gives time to rotate before the old key is stale)
- Calendar: share with anyone who can trigger a release build

---

## Naming convention

When you create a new key in App Store Connect, include the creation month in the name so staleness is immediately visible in both Apple's dashboard and Codemagic:

```
byte2eat_codemagic_YYYY-MM
```

Example: a key generated in June 2026 → `byte2eat_codemagic_2026-06`

The current key used in `codemagic.yaml` (`integrations.app_store_connect`) is named `Byte2eat_admin` in Codemagic's Personal Account → Integrations. After each rotation, rename the Codemagic integration entry to match the new date-stamped name.

---

## Rotation checklist

### 1 — Generate a new key in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**
2. Click **+** to generate a new key
3. Name: `byte2eat_codemagic_YYYY-MM` (use the current year-month)
4. Role: **App Manager** (minimum required for Codemagic to upload and submit builds)
5. Download the `.p8` file — **Apple only lets you download it once**
6. Note the new **Key ID** and **Issuer ID** (visible on the same page)

### 2 — Upload to Codemagic

1. Log in to [codemagic.io](https://codemagic.io) → **Teams** → **Personal Account** → **Integrations**
2. Find the existing App Store Connect integration (`Byte2eat_admin`)
3. Click **Edit** and replace:
   - **Key ID** — paste the new Key ID from App Store Connect
   - **Issuer ID** — paste the Issuer ID (same page in ASC; usually unchanged)
   - **API key (.p8 file)** — upload the newly downloaded `.p8`
4. Rename the integration entry to `byte2eat_codemagic_YYYY-MM` to match the key name
5. Save

### 3 — Verify with a test build

1. Trigger a manual build in Codemagic for the `byte2eat-ios-release` workflow
2. Confirm the **Fetch signing files** step completes without `401 NOT_AUTHORIZED`
3. Confirm the build reaches the **publishing** step (TestFlight upload succeeds)

### 4 — Delete the old key

1. Back in App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API**
2. Find the old `byte2eat_codemagic_YYYY-MM` key (previous date)
3. Click **Revoke** — this immediately invalidates it; any build still using it will fail, so only do this after step 3 succeeds
4. Delete or archive the old `.p8` file from any local machines

---

## Quick reference

| What                  | Where                                                                          |
|-----------------------|--------------------------------------------------------------------------------|
| Generate / revoke key | appstoreconnect.apple.com → Users and Access → Integrations → ASC API         |
| Upload key            | codemagic.io → Personal Account → Integrations → App Store Connect            |
| Workflow file         | `codemagic.yaml` → `integrations.app_store_connect`                           |
| Support contact       | support@byte2eat.app                                                           |

---

## Last rotation log

| Date       | Key name                    | Rotated by   |
|------------|-----------------------------|--------------|
| 2026-06    | `byte2eat_codemagic_2026-06` | (set up)    |

Update this table each time you rotate. It's the fastest way to see how long the current key has been active.
