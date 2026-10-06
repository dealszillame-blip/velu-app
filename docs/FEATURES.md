# Velu feature blueprint

What each role can do **today** on the live app. This is a capability inventory, not a roadmap. Architecture (routes, APIs, data) lives in [ARCHITECTURE.md](./ARCHITECTURE.md).

Production: [velu-app-sigma.vercel.app](https://velu-app-sigma.vercel.app).

---

## Capability matrix

| Capability | Guest | Buyer | Builder | Agent | pending_agent | Admin | Provider |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Browse marketing landing | Yes | Redirected home | Redirected home | Redirected home | Redirected home | Redirected home | Redirected home |
| Register / sign in | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Join builder waitlist | Yes | — | — | — | — | Manage | — |
| View published builder profile | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Browse land / builders map | — | Yes | — | — | — | Listings admin | — |
| Register owned land | — | Yes | — | — | — | Create listings | — |
| Request site-report add-ons | — | Request only | — | — | — | — | Quote / deliver |
| Request architects | — | Request only | — | — | — | — | — |
| Save build brief | — | Yes | View on sold lead | — | — | — | — |
| See nearby NSW-licensed builders | — | Directory | — | — | — | Import / refresh | — |
| See sold leads in radius | — | — | If onboarded | — | — | All listings | — |
| Submit a build package | — | — | One live per lot | — | — | View only | — |
| Compare / recommend / tender | — | Yes | — | — | — | View proposals | — |
| Accept / decline a package | — | Yes | — | — | — | — | — |
| Message the other party | — | On owned sold lot | On sold lead | — | — | View threads | — |
| Track build milestones | View | View only | Advance | — | — | — | — |
| Create / change listing status | — | — | — | Yes | View only | Full CRUD | — |
| Approve pending agents | — | — | — | — | — | Yes | — |
| Manage users / flags | — | — | — | — | — | Yes | — |
| Import NSW register / Google ratings | — | — | — | — | — | Data | — |

Sixth role: `report_provider` (column **Provider**). Home is `/provider/reports`. Admin assigns the role; there is no public provider signup.

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

- Open `/buyer/*`, `/builder/*`, `/agent/*`, `/admin/*`, or `/provider/*` (sent to login).
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

- **Register a block** they already hold: address (must geocode in NSW), size, frontage, depth, optional land value, optional site-report add-ons. Zoning is **not** collected on the form (database still defaults R2).
- A price that looks about **10×** too high for the lot size (or above a sane $/m²) is rejected. It is not auto-corrected.
- The same address for one buyer is **one parcel**. “Circuit” and “Cct” copies collapse, so a duplicate lead does not render twice.
- Submit **Find builders for my land** — creates a `buyer_owned` lot (treated as sold), notifies onboarded builders in range, then sends them to Compare.
- Register more than one block. **Cannot edit or delete** a parcel after it is created.

On each registered parcel:

| Tab | Can do |
| --- | --- |
| Overview | See proposal count; jump to Compare |
| Site reports | Request soil, site survey, 3rd-party inspection, BAL, acoustic, and/or legal check; see status (requested → delivered) |
| Builders | See nearby **NSW Fair Trading contractor-builder licences** (Greater Sydney, status Current) plus any onboarded Velu builders. Cards show licence number / Verify NSW link, Google rating when matched, last sale, delay, builder type. Placeholder licences and names (UUU, AAAAA, and similar) are hidden. **Invite to review land** only for onboarded Velu accounts — register-only rows are not users. |
| Architects | Pick from the directory, add notes, send a request |
| Workspace | Shortcuts to Messages and Compare; list active build projects |

Site-report and architect requests are **request + status only** for the buyer. Providers quote and attach a deliverable; there is still no in-app payment. Nearby register rows are a **directory**, not quotes — a package still requires an onboarded builder.

### Requirements (`/buyer/requirements`)

- Save a build brief: house type, storeys, granny flat, beds, baths, cars, living rooms, ensuite, **construction grade** (ground / medium / luxury), **preferred builder types** (bulk / semi-custom / custom / designer), settlement date, land measurements, notes.
- Edit or replace the saved brief.
- Save is **blocked** when storeys and notes contradict (G+1 or two-storey vs notes that clearly say single-level, or the reverse) until the buyer aligns them or confirms the contradiction.
- Shown beside a lot, **listing** size, frontage, and depth win over the brief. The Figtree parcel is 518 m², 13.5 m frontage, 20 m depth.
- This brief is what **Recommend**, **Tender report**, and the builder’s lead page use.

### Compare (`/buyer/compare`)

Six tabs:

| Tab | Can do |
| --- | --- |
| **Compare** | Pending packages as cards (price, contract type, weeks, specs, breakdown, inclusions) and a side-by-side table when **two or more** are pending. Cards show the NSW licence (Verify NSW) and insurance — a directory badge, not a live icare HBCF check. Statutory warranty is always on screen (Home Building Act: 6 years major defects, 2 years other). Site-cost lines stay an estimate until a soil report is **delivered** (warning only; quotes are not blocked). Accept or decline. Accept tells the buyer to confirm cooling-off, deposits, and contract terms with a solicitor and NSW Fair Trading. No hard-coded deposit %. Velu does not collect the deposit. Message the builder, open their profile, or load **demonstration packages** if land is registered but quotes are thin. |
| **Recommend** | Ranked **brief-fit** score vs the saved brief (bedrooms, bathrooms, storeys, granny flat, cars, price), with why, watch-outs, and next steps. Storeys are a hard layout filter (single vs G+1). Notes that clearly say single-level do not penalise a 1-storey package. Optional Gemini write-up when `GEMINI_API_KEY` is set; OpenAI only if Gemini is missing or fails. No working key means the rules sentence stays. Page copy calls this a brief-fit scorer, not an AI decision engine. |
| **Tender report** | Gap / watch / ok findings per package against stored tender knowledge. Optional Gemini narrative (OpenAI fallback) when a server key is set. Site $ stays an estimate until a soil report is delivered — not a hard block. Callout to request a **legal check** on My land before accepting. |
| **Milestones** | See accepted projects and the six-stage tracker (view only — same as `/buyer/project/:id`). |
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
**Sign-in:** a missing `next`, or `next=/`, opens `/builder/dashboard`.

### Can do

- See dashboard stats: onboarded state, service radius, anchor, sold-lot count.
- **Edit and publish a public profile** (headline, bio, portfolio, gallery, reviews, publish toggle). Preview `/builders/:id`. Star ratings are not self-entered. A Google Maps link can be saved; a number shows only when Places or the NSW register supplied it, otherwise it is omitted or labelled unverified.
- **See sold / buyer-owned lots in their service radius** (`/builder/leads`). Feed refreshes live. Empty if they have no geocoded anchor or nothing in range.
- Open a lead (`/builder/leads/:id`): lot details + the buyer’s saved brief (if shared).
- **Contact the buyer** (in-app message — no phone/email).
- **Submit one live package per lot.** Contract type is required: fixed price, cost plus, or hybrid. The breakdown catalog is site, base, kitchen, bathroom, electrical, external, contingency, prime cost, and provisional sum. Each line is lump sum, PC, PS, or allowance. Site lines stay provisional until a soil report is delivered — the form warns and does not block the quote. Load/save templates.
- A second live package for the same lot is rejected until the first is withdrawn or expired.
- **Pending** or **viewed** packages can be edited in place, or withdrawn so a new package can be sent. An **accepted** package cannot be edited or withdrawn.
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
- `demo.dhursan@velu.dev` — Dhursan Homes (NSW licences 369795C / 341107C) after `npm run seed:demo`.

Nearby **NSW register** cards on My land are **not** these accounts. They are public-register rows.

---

## Report provider

**Home:** `/provider/reports`  
**Nav:** Reports  

Admin assigns `report_provider` on a user (no self-serve register). Demo: `demo.soil@velu.dev` (soil / BAL / legal) and `demo.survey@velu.dev` (survey / acoustic / inspection), password `VeluDemo123!` after seed.

### Can do

- List site-report requests assigned to them.
- Set status (quoted → in progress → delivered), quoted price, notes, and a deliverable URL.

### Cannot

- See buyer map, Compare, or builder leads.
- Message buyers in-app.
- Take payment.

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
**Nav:** Dashboard · Listings · Users · Agent approvals · Builders · Builder interest · Inquiries · Proposals · Settings · Data

Needs an `admin` profile and `SUPABASE_SERVICE_ROLE_KEY` for most writes.

### Can do

| Area | Actions |
| --- | --- |
| **Dashboard** | Counts and alerts (listings, users, builders, waitlist, inquiries, open proposals, pending agents). |
| **Listings** | Search all lots; **create** (optional agent assignment); **edit** all fields and reassign agent; **delete**. |
| **Users** | Search / filter by role; change role (buyer, builder, agent, pending_agent, admin, **report_provider**); edit name, phone, company, licence; **send password reset** or **set password**. |
| **Agent approvals** | Approve pending agents or reject them to buyer (reason stored). |
| **Builders** | Filter onboarded / published; set licence, onboarding status, onboarded flag, licence-valid, insurance, published, notes. |
| **Builder interest** | Review `/builders/join` rows; mark new / contacted / invited / archived; delete. |
| **Inquiries** | Read thread metadata and last preview. **No reply.** |
| **Proposals** | Read all packages and statuses. **Cannot accept or decline for a buyer.** |
| **Settings** | Toggle feature flags. Flags are stored; most product screens do not yet hide behind them. |
| **Data** | **Import Sydney snapshot** of ~10,193 Greater Sydney contractor-builder licences (not SQL — do not paste `npm` into Supabase). **Refresh from Verify NSW**. **Match Google reviews** (needs `GOOGLE_PLACES_API_KEY` — Places API, not scraping). **Run weekly update now**. Paste LLM JSON for last-sale / delay facts. |

### Cannot

- Impersonate a buyer to accept a package.
- Join in-app chats as a participant.
- Advance a construction milestone.

A Sunday job (Vercel Cron `GET /api/sync/builders` plus GitHub Action) rechecks stored licences on Verify NSW and refreshes Google ratings. Nearby only shows licences still marked **Current**.

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
| Site report / architect “quoted / accepted / delivered” | Buyer can request and watch status. Providers can quote and attach a file URL; no pay UI. |
| Google rating on a register builder | Empty until Admin matches Places (or the weekly job) with `GOOGLE_PLACES_API_KEY`. No google.com scraping. Places is optional — not required to use Compare. |
| Compare “Insurance / HBCF” | Directory flag (“Insurance verified” or “Not verified on Velu”). Not a live icare HBCF lookup. |
| Invite to review on an NSW register card | Hidden — only onboarded Velu builders can be messaged. |
| Feature flags in Admin → Settings | Toggles persist; they do not gate most screens yet. |
| Builder licence-valid / onboarding-status | Admin fields; signup still marks the builder onboarded. |

---

## Typical happy path (what works end to end)

1. Buyer registers a block on **My land** (or an agent marks their listing **Sold**).
2. My land → **Builders** lists nearby NSW-licensed contractors (directory) and onboarded Velu builders.
3. Onboarded builders in range see the lot on **Leads** and send a package.
4. Buyer opens **Compare**, optionally **Recommend** (brief-fit score; Gemini write-up only if a server key is set) / **Tender report** / **Milestones**.
5. Buyer **Accepts** one package.
6. Both sides open the **project**; the builder moves milestones.
7. Either side can **message** the other on that lot (no phone/email in the thread).

That loop is the product. The NSW register, site-report providers, waitlist, admin Data, and demo packages support it.
