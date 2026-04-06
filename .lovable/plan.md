

# Psychological Anonymous Interaction Game — Full Build Plan

This is a large-scale upgrade. To avoid errors and keep things working at each step, I recommend building in **3 phases**.

---

## Phase 1: Shadow Profiles + Enhanced Visitor Experience + Coded Chat

### Database Changes

1. **Extend `interactions` table** — add columns:
   - `anonymous_id` (text) — generated ID like `#X92K`
   - `device_type` (text) — `mobile` or `desktop` (detected client-side via user-agent)
   - `city` (text, nullable) — approximate city from free IP geolocation API
   - `session_fingerprint` (text) — hash to track repeat visitors without identifying them

2. **New `puzzles` table** — stores puzzle definitions:
   - `id`, `level` (int), `question` (text), `answer` (text), `hint_reward` (text), `difficulty` (text)

3. **New `puzzle_progress` table** — tracks which puzzles a user has solved per interaction:
   - `id`, `user_id` (profile owner), `interaction_anonymous_id`, `puzzle_id`, `solved_at`
   - RLS: only the profile owner can read/write their own progress

4. **New `guesses` table** — for "Guess Who" feature:
   - `id`, `user_id`, `interaction_anonymous_id`, `guess_text`, `created_at`

5. **Add new interaction types** to the enum — expand to include coded chat categories:
   - `proximity_close`, `proximity_circle`, `proximity_often`
   - `time_past`, `time_recent`, `time_long`
   - `relationship_friend`, `relationship_know`, `relationship_interested`

### Frontend Changes

1. **Visitor Page (`VisitorPage.tsx`)** — major upgrade:
   - Detect device type (mobile/desktop) from `navigator.userAgent`
   - Fetch approximate city using a free IP geolocation service (ip-api.com)
   - Generate a random anonymous ID (`#` + 4 alphanumeric chars) per session
   - Store all metadata with each interaction
   - Add **Coded Chat** section with categorized button groups (Proximity, Time, Relationship)
   - Enforce restrictions: no free text in coded chat, no names, no numbers

2. **Dashboard (`Dashboard.tsx`)** — major upgrade:
   - Show shadow profiles: group interactions by `anonymous_id`
   - Display mystery hints per shadow profile:
     - "This person is closer than you think" (if same city)
     - "Sent recently" (if < 1hr ago)
     - "This is not their first interaction" (if repeat visitor)
   - **Guess Who** button per shadow profile — input a guess, get mystery response
   - **Puzzle System** — progressive reveal UI:
     - Show locked hint cards per shadow profile
     - Each card has a puzzle (riddle/logic question)
     - Solving reveals one piece of info (city, device, frequency, etc.)
   - **Profile Energy Bar** — visual bar based on total interaction count (no numbers shown)
   - **Attention messages** — "Your profile is gaining attention today" when interactions spike

3. **New component: `PuzzleModal.tsx`** — modal with puzzle question, answer input, success/failure feedback

4. **New component: `ShadowProfileCard.tsx`** — displays a single anonymous visitor's aggregated data with locked/unlocked hints

---

## Phase 2: Premium System + Stripe Payments

### Database Changes

1. **Add `is_vip` and `vip_until` columns to `profiles`** table
2. **New `payment_requests` table** — for crypto manual verification:
   - `id`, `user_id`, `method` (stripe/crypto), `transaction_id`, `status` (pending/approved/rejected), `created_at`

### Integration

1. **Enable Stripe** using the Lovable Stripe integration tool
2. Create a VIP subscription product
3. Build a VIP upgrade page with:
   - Stripe checkout button (auto-activation)
   - Crypto (USDT) section with wallet address + QR code + transaction ID submission
4. **Premium features gating**:
   - "Ask directly" button — unlocks free text messaging between owner and anonymous sender
   - Token system — owner grants permission for sender to reply freely

### Frontend

1. **New page: `VIPPage.tsx`** — payment options, feature comparison
2. **Update Dashboard** — show VIP badge, unlock premium hints
3. **Update VisitorPage** — if owner is VIP, show boosted profile styling

---

## Phase 3: Admin Dashboard

### Database Changes

1. **`user_roles` table** — with `app_role` enum (admin, user)
2. **`has_role()` security definer function** for RLS

### Frontend

1. **New page: `AdminDashboard.tsx`** — secured route, only accessible by admin role
   - Platform stats: total users, daily active, total interactions, puzzle completion rate
   - User management: list users, suspend/delete
   - Interaction moderation: view flagged content (NOT message content — just metadata)
   - Configuration: payment method toggles, puzzle difficulty settings
2. **Admin cannot see**: private message content, personal identity, location data

---

## Technical Details

- **Geolocation**: Use `fetch('http://ip-api.com/json/')` on visitor page (free, no API key, city-level only)
- **Anonymous ID generation**: `'#' + Math.random().toString(36).substring(2, 6).toUpperCase()` stored in sessionStorage for consistency within a visit
- **Puzzle content**: Seed 12-15 puzzles of increasing difficulty via migration INSERT statements
- **Profile Energy**: Calculate as `Math.min(100, interactions.length * 5)` — displayed as a gradient bar
- **Coded chat restrictions**: Button-only interaction, validated server-side via interaction_type enum
- **Route structure**: `/admin` for admin panel, `/vip` for upgrade page

---

## Recommended Build Order

I suggest starting with **Phase 1** (shadow profiles, puzzles, coded chat, enhanced dashboard) as it delivers the core game mechanics that make this product unique. Phases 2 and 3 can follow once the core experience is validated.

Shall I proceed with Phase 1?

