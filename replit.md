# Byte 2 Eat — AI Culinary Scan App

An AI-powered iOS app that scans your fridge with the camera and suggests personalized recipes using the ingredients it detects.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/culinary-scan-assist run dev` — run the web app (port 23253, preview at /culinary/)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/culinary-scan-assist run build:capacitor` — build web bundle for Capacitor (base path /)
- `cd artifacts/culinary-scan-assist && npx cap sync ios` — sync web build into iOS project
- `cd artifacts/culinary-scan-assist && npx cap open ios` — open in Xcode (requires macOS)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, TanStack Router (SPA mode)
- Styling: Tailwind CSS v4, custom green food theme
- Auth & DB: Supabase (auth, favorites, scan history)
- AI: OpenAI gpt-4o-mini via Replit AI Integrations (fridge analysis)
- Mobile: Capacitor 7 (iOS)
- API: Express 5 (Node.js)

## Where things live

- `artifacts/culinary-scan-assist/` — React/Vite SPA (the main app)
  - `src/routes/` — TanStack Router file-based routes (/, /scan, /auth, /favorites, /settings, /legal)
  - `src/lib/analyze-fridge.ts` — client-side function calling the API
  - `src/integrations/supabase/` — Supabase client + types
  - `capacitor.config.ts` — Capacitor config (appId: com.bitecooking.app)
  - `ios/` — Generated Xcode project (open with Xcode on a Mac)
- `artifacts/api-server/src/routes/analyze-fridge.ts` — AI fridge analysis endpoint
- `artifacts/api-server/src/routes/delete-account.ts` — DELETE /api/delete-account endpoint

## Architecture decisions

- TanStack Router in SPA mode (no SSR) to be compatible with Capacitor's static web bundle
- The AI fridge analysis runs server-side (Express + OpenAI) to keep the API key secure
- Supabase handles auth and favorites/scan history syncing
- Capacitor wraps the static Vite build (`dist/public`) as a native iOS app
- `import.meta.env.BASE_URL` passed as `basepath` to TanStack Router for correct routing in both dev (/culinary/) and production (/)

## Product

- Home screen: trending recipes, search, quick "Scan My Fridge" button, Settings gear icon
- Scan screen: live camera or photo upload → AI ingredient detection → recipe suggestions with health score
- Favorites: save/sync recipes (requires Supabase auth)
- Auth: email/password sign-in & sign-up via Supabase
- Settings: account management, sign out, delete account, legal links
- Legal: Privacy Policy (UK GDPR) + Terms of Service at /legal

## iOS App Store Setup (requires a Mac with Xcode)

1. Deploy the API server and confirm `VITE_API_BASE_URL` points to it
2. Run `pnpm run build:capacitor` in `artifacts/culinary-scan-assist/`
3. Run `npx cap sync ios`
4. Run `npx cap open ios` to open the Xcode project
5. In Xcode: set your Apple Developer Team, bundle ID (`com.bitecooking.app`), and build for device

## User preferences

- Project imported from GitHub: https://github.com/skeff001-coder/culinary-scan-assist
- Original app name: Bite (rebranded to Byte 2 Eat)

## App Store Submission Checklist

- Version: 1.0.0 (update in Xcode before submission — bundle ID: com.bitecooking.app)
- Premium IAP: £4.99 one-time, product ID `com.owenskeffington.bite.premium` (NON_CONSUMABLE)
- Trial: 1 free scan on first launch via `bite_scan_credits` in localStorage
- Restore Purchases: present in paywall modal
- Account Deletion: implemented in Settings → Delete Account (Apple requirement)
- Privacy Policy & Terms: in-app at /settings → Legal
- Health Disclaimer: shown below health score on scan results page
- Legal contact: privacy@byte2eat.app / support@byte2eat.app

## Environment Variables Required

### API Server (`artifacts/api-server`)
- `SUPABASE_URL` — Supabase project URL ✅ configured
- `SUPABASE_ANON_KEY` — Supabase anon/public key ✅ configured
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for account deletion) ✅ configured

### Web App (`artifacts/culinary-scan-assist`)
- `VITE_SUPABASE_URL` — Supabase project URL ✅ configured
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key ✅ configured
- `VITE_API_BASE_URL` — deployed API server URL ✅ configured

## Gotchas

- Always run `build:capacitor` then `cap sync ios` before opening in Xcode
- The Supabase client requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` env vars
- Camera access requires HTTPS or localhost — works natively in Capacitor on device
- `cap add ios` and `cap open ios` require macOS with Xcode installed
