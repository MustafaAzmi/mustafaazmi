

## Problem Analysis

1. **Location/IP/Distance all show "Unknown"**: The visitor page uses `fetch("https://ip-api.com/json/...")` but ip-api.com's free tier only works over HTTP (not HTTPS). Browsers block mixed content, so the call fails silently. City and IP are never captured.

2. **Puzzles are too easy**: Current puzzles are trivial (e.g., "What color is the sky?", "What is 2 + 2?"). Any user or AI can solve them instantly, removing the incentive to pay for VIP.

## Plan

### Step 1: Fix IP & Location Capture via Edge Function

Upgrade the existing `get-visitor-ip` edge function to:
- Capture the visitor's real IP from request headers
- Call a geolocation API **server-side** (using `ipapi.co` which supports HTTPS free tier, or `ip-api.com` over HTTP from Deno which is allowed)
- Return: `ip`, `city`, `country`, `lat`, `lon`

Update `VisitorPage.tsx` to call this edge function instead of `ip-api.com` directly. This fixes both the IP and city capture.

### Step 2: Add Real Distance Calculation

In `ShadowProfileCard.tsx`, if we have lat/lon for both visitor and owner, calculate actual distance using the Haversine formula. Store visitor lat/lon in the `interactions` table (new columns: `latitude`, `longitude`).

Database migration:
- Add `latitude` and `longitude` columns to `interactions` table

### Step 3: Replace Puzzles with Hard Questions

Replace all 12 puzzles with genuinely difficult questions that require real thinking and cannot be easily solved by AI. Examples:
- Riddles with ambiguous/lateral thinking answers
- Pattern recognition puzzles
- Questions requiring cultural/contextual knowledge
- Multi-step logic problems

Examples:
- Level 1: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?" → **map**
- Level 2: "The more you take, the more you leave behind. What am I?" → **footsteps**
- Level 3: "What disappears as soon as you say its name?" → **silence**
- Level 4: "I can be cracked, made, told, and played. What am I?" → **joke**
- Level 5: "What has a head and a tail but no body?" → **coin**
- Level 6: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?" → **echo**
- Level 7: "What comes once in a minute, twice in a moment, but never in a thousand years?" → **m** (the letter)
- Level 8: "The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they're using it. What is it?" → **coffin**

### Step 4: Update the Visitor Page

Modify `VisitorPage.tsx`:
- Replace the broken `ip-api.com` fetch with a call to the upgraded edge function
- Store `ip_address`, `city`, `latitude`, `longitude` in the interaction record

### Step 5: Update Shadow Profile Card

Modify `ShadowProfileCard.tsx`:
- Use stored lat/lon to show real distance (e.g., "~15 km away")
- Show actual IP when unlocked
- Show real city when unlocked

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/get-visitor-ip/index.ts` | Add server-side geolocation lookup |
| `src/pages/VisitorPage.tsx` | Call edge function instead of ip-api.com |
| `src/components/ShadowProfileCard.tsx` | Add Haversine distance calc, use lat/lon |
| Database migration | Add `latitude`, `longitude` to `interactions` |
| Database migration | Replace all puzzle rows with hard riddles |

