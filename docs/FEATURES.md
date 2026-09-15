# Velu feature blueprint

What each role can do **today** on the live app. This is a capability inventory, not a roadmap. Architecture (routes, APIs, data) lives in [ARCHITECTURE.md](./ARCHITECTURE.md).

Production: [velu-app-sigma.vercel.app](https://velu-app-sigma.vercel.app).

---

## Capability matrix

| Capability | Guest | Buyer | Builder | Agent | pending_agent | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Browse marketing landing | Yes | Redirected home | Redirected home | Redirected home | Redirected home | Redirected home |
| Register / sign in | Yes | Yes | Yes | Yes | Yes | Yes |
| Join builder waitlist | Yes | — | — | — | — | Manage |
| View published builder profile | Yes | Yes | Yes | Yes | Yes | Yes |
| Browse land / builders map | — | Yes | — | — | — | Listings admin |
| Register owned land | — | Yes | — | — | — | Create listings |
| Request soil / site survey | — | Request only | — | — | — | — |
| Request architects | — | Request only | — | — | — | — |
| Save build brief | — | Yes | View on sold lead | — | — | — |
| See sold leads in radius | — | — | If onboarded | — | — | All listings |
| Submit a build package | — | — | One per lot | — | — | View only |
| Compare / recommend / tender | — | Yes | — | — | — | View proposals |
| Accept / decline a package | — | Yes | — | — | — | — |
| Message the other party | — | On owned sold lot | On sold lead | — | — | View threads |
| Track build milestones | View | View only | Advance | — | — | — |
| Create / change listing status | — | — | — | Yes | View only | Full CRUD |
| Approve pending agents | — | — | — | — | — | Yes |
| Manage users / flags | — | — | — | — | — | Yes |

---

## Guest (not signed in)

**Where:** `/`, `/login`, `/register/*`, `/builders/join`, `/builders/:id`

### Can do

- Read the marketing landing (how it works, sample compare, trust copy).
- **Register as buyer** (`/register/buyer`), including **I already own land** (`?intent=own-land` → My land after signup).
- **Register as builder** (3-step signup: account, licence, service area).
- **Register as agent** (name, agency, optional licence).
- **Sign in** with password or email magic-link / 6-digit code.
- **Forgot / reset password**.
- **Join the builder waitlist** at `/builders/join` (name, email, specialties) — does **not** create an account.
- **View a published builder profile** (bio, licence, portfolio, gallery, reviews, website). Unpublished profiles 404.

### Cannot

- Open `/buyer/*`, `/builder/*`, `/agent/*`, or `/admin/*` (sent to login).
- Use the live map, Compare, or messaging.
- Contact a builder from the public profile (no message / approach button).
- Treat landing proposal cards, ticker, or map pins as live data — they are marketing mocks. “View full proposal” and “Approach builder” go to **register**.

---

## Buyer

**Home:** `/buyer/map`  
**Nav:** Map · My land · Requirements · Compare · Messages  
**Also:** notification bell, sign out, `/buyer/project/:id` after accept, public `/builders/:id`

### Account

- Register and sign in; sign out from the header.
- After signup, land on the map (or My land if they chose “already own land”).

### Map (`/buyer/map`)

- Switch **Land** vs **Builders**.
- Filter lots by status (Available / Under contract / Sold), suburb, price, and land size.
- Pan/zoom; open a pin or list row to see address, price, size, frontage, zoning, status.
- On a builder pin: see name, licence, years; open **View profile**.

**Cannot from the map:** mark a lot sold, buy a lot, message an agent, save a search, or see lot-boundary / zoning overlays. Compare copy says “mark the lot as sold on the map” — that action is **agent / Domain sync only**.

### My land (`/buyer/my-land`)

- **Register a block** they already hold: address (must geocode in NSW), size, frontage, zoning, optional land value, optional site-report add-ons.
- Submit **Find builders for my land** — creates a `buyer_owned` lot (treated as sold), notifies builders in range, then sends them to Compare.
- Register more than one block. **Cannot edit or delete** a parcel after it is created.

On each registered parcel:

| Tab | Can do |
| --- | --- |
| Overview | See proposal count; jump to Compare |
| Site reports | Request soil report / site survey; see status (requested → delivered) |
| Builders | See nearby licensed builders; open profile; **Invite to review land** (starts a message) |
| Architects | Pick from the directory, add notes, send a request |
| Workspace | Shortcuts to Messages and Compare; list active build projects |

Site-report and architect requests are **request + status only**. No pay, accept quote, or cancel in the UI.

### Requirements (`/buyer/requirements`)

- Save a build brief: house type, storeys, granny flat, beds, baths, cars, living rooms, ensuite, settlement date, land measurements, notes.
- Edit or replace the saved brief.
- This brief is what **Recommend**, **Tender report**, and the builder’s lead page use.

### Compare (`/buyer/compare`)

Five tabs:

| Tab | Can do |
| --- | --- |
| **Compare** | See pending packages as cards (price, weeks, specs, breakdown, inclusions). Side-by-side table when **two or more** packages are pending. Accept or decline. Message the builder. Open their profile. Load **demonstration packages** if they have land but too few quotes. |
| **Recommend** | See a ranked pick vs the saved brief (score, why this one, watch-outs, next steps). Rules-based — not an external LLM. |
| **Tender report** | Read gap / watch / ok findings per package. |
| **Published designs** | Browse a catalogue of indicative single- and double-storey packages. Filter only — cannot request or add to Compare. |
| **Upcoming** | Placeholder card only. No live estates. |

**Accept** creates a construction project, declines the other pending packages on that lot, and opens `/buyer/project/:id`.  
**Do not accept a live demo proposal** unless you intend to change that buyer’s production state.

### Messages (`/buyer/messages`)

- List threads; open a thread; send replies.
- Start a thread from a proposal card or “Invite to review land”.
- First message must be at least 10 characters. Phone numbers and emails are blocked.
- Only on a **sold lot linked to this buyer**. Cannot message from a map listing they do not own.

### Project (`/buyer/project/:id`)

- See address, builder, and the six-stage tracker (Contract → Slab → Frame → Lock-up → Fixing → Handover).
- **View only.** The builder advances stages.

### Notifications

- Open the bell; mark a notice read.
- Typical jumps: new proposal → Compare; new message → Messages; milestone → Project.

### Demo extras

- **Load demonstration packages** on Compare / Recommend (needs a registered block and `SUPABASE_SERVICE_ROLE_KEY` on the server, or SQL `025_demo_comparison_proposals.sql`).
- Demo login: `demo.buyer2@velu.dev` / `VeluDemo123!` (Sam — Oran Park). `demo.buyer@velu.dev` is Alex (Mount Annan).

---

## Builder

**Home:** `/builder/dashboard`  
**Nav:** Home · Profile · Leads · Proposals · Messages  
**Signup:** `/register/builder` sets them **onboarded immediately** (no admin approval in the signup path).

### Can do

- See dashboard stats: onboarded state, service radius, anchor, sold-lot count.
- **Edit and publish a public profile** (headline, bio, portfolio, gallery, reviews, publish toggle). Preview `/builders/:id`.
- **See sold / buyer-owned lots in their service radius** (`/builder/leads`). Feed refreshes live. Empty if they have no geocoded anchor or nothing in range.
- Open a lead (`/builder/leads/:id`): lot details + the buyer’s saved brief (if shared).
- **Contact the buyer** (in-app message — no phone/email).
- **Submit one package per lot:** name, home specs, price, breakdown, inclusions, notes; load/save templates. Cannot submit a second package for the same lot; **cannot edit or withdraw** after send.
- List sent packages and their status (`/builder/proposals`).
- Message buyers on those sold leads.
- After a buyer **accepts**: open `/builder/project/:id` and **advance milestones one stage at a time**.

Leads, proposals, and messaging require `is_onboarded = true`. Licence-valid and onboarding-status fields exist for **admin** but do not block the builder UI today.

### Cannot

- See or quote lots that are only “available” (not sold / buyer-owned).
- Browse the buyer map.
- Accept a package on the buyer’s behalf.
- Put a phone number or email in a message.

### Demo builders

Same password `VeluDemo123!`:

- `demo.builder@velu.dev` — James Whitfield, Apex Homes
- `demo.builder2@velu.dev` — Maria Santos, Meridian
- `demo.builder3@velu.dev` — David Nguyen, SouthWest Living

---

## Agent

**Home:** `/agent/listings`  
**Nav:** Listings · New listing

### Approved agent (`role = agent`)

- **Create a vacant-land listing:** address (must geocode), price, size, frontage, zoning, starting status Available or Under offer.
- **Advance status** only, in order: Available → Under offer → Sold. Sold notifies builders in range.
- Open a listing detail. **Cannot edit** address/price/size after create. **Cannot delete.** **Cannot un-sell.**
- Self-serve register at `/register/agent` creates an **approved agent** immediately (not pending).

### Pending agent (`role = pending_agent`)

- Can open the agent pages (list is empty unless admin assigned lots).
- **Cannot create listings or change status** (API + RLS require `agent`).
- Admin must **Approve** (→ agent) or **Reject** (→ buyer) at `/admin/agent-approvals`. Signup does not put people in this state automatically — admin assigns it.

### Cannot

- Message buyers or builders.
- Submit or compare build packages.
- Use the buyer map.

---

## Admin

**Home:** `/admin/dashboard`  
**Nav:** Dashboard · Listings · Users · Agent approvals · Builders · Builder interest · Inquiries · Proposals · Settings

Needs an `admin` profile and `SUPABASE_SERVICE_ROLE_KEY` for most writes.

### Can do

| Area | Actions |
| --- | --- |
| **Dashboard** | Counts and alerts (listings, users, builders, waitlist, inquiries, open proposals, pending agents). |
| **Listings** | Search all lots; **create** (optional agent assignment); **edit** all fields and reassign agent; **delete**. |
| **Users** | Search / filter by role; change role (buyer, builder, agent, pending_agent, admin); edit name, phone, company, licence; **send password reset** or **set password**. |
| **Agent approvals** | Approve pending agents or reject them to buyer (reason stored). |
| **Builders** | Filter onboarded / published; set licence, onboarding status, onboarded flag, licence-valid, insurance, published, notes. |
| **Builder interest** | Review `/builders/join` rows; mark new / contacted / invited / archived; delete. |
| **Inquiries** | Read thread metadata and last preview. **No reply.** |
| **Proposals** | Read all packages and statuses. **Cannot accept or decline for a buyer.** |
| **Settings** | Toggle feature flags. Flags are stored; most product screens do not yet hide behind them. |

### Cannot

- Impersonate a buyer to accept a package.
- Join in-app chats as a participant.
- Advance a construction milestone.

---

## Shown in the product but not a real action yet

These appear in copy or UI and should not be treated as shipped features:

| What you see | What actually happens |
| --- | --- |
| “Mark the lot as sold on the map” (Compare empty state) | Buyers have no sold control. Agents (own listings) or Domain sync change status. |
| Landing “save searches with alerts”, “NSW lot boundaries”, live ticker | Marketing only. |
| Landing “View full proposal” / “Approach builder” | Goes to register. |
| Compare **Upcoming** | Placeholder. |
| Compare **Published designs** | Browse/filter catalogue only. |
| Site report / architect “quoted / accepted / delivered” | Buyer can request and watch status; no pay or accept-quote UI. |
| Feature flags in Admin → Settings | Toggles persist; they do not gate most screens yet. |
| Builder licence-valid / onboarding-status | Admin fields; signup still marks the builder onboarded. |

---

## Typical happy path (what works end to end)

1. Buyer registers a block on **My land** (or an agent marks their listing **Sold**).
2. Builders in range see it on **Leads** and send a package.
3. Buyer opens **Compare**, optionally **Recommend** / **Tender report**.
4. Buyer **Accepts** one package.
5. Both sides open the **project**; the builder moves milestones.
6. Either side can **message** the other on that lot (no phone/email in the thread).

That loop is the product. Everything else (directory, waitlist, admin, demo packages) supports it.
