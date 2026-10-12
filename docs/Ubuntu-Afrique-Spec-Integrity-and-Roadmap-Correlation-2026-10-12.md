# Ubuntu Afrique — Spec Integrity and Roadmap Correlation

**Job type:** U (analysis / verify only. Not Wave Y handover. Not Day 30.)
**Date:** 2026-10-12
**Worktree:** `C:\\Users\\LeadDev\\john-james-projects`
**HEAD:** `96b4d68` / **0.1.61** / branch `main`
**Push remote:** ubuntu-fork = MRSHAGNASTY/ubuntu-afrique
**Do not push:** origin = JPRademeyer84/john-james-projects
**Ubuntu book:** rbyipalrasawbjpsppgu (ua_*)
**Aureus prod:** fgubaqoftdeefcakejwu — refuse every write
**Original matrix:** C:\\Users\\LeadDev\\Desktop\\UBUNTU_AFRIQUE_Build_Matrix.md (UTF-8, 162 sections)
**Current product board:** C:\\Users\\LeadDev\\Desktop\\Ubuntu-Afrique-Remaining-Build-Roadmap.md (N-T Done; Y after T; U/V/W/X Blocked)
**Historical board:** C:\\Users\\LeadDev\\Desktop\\Ubuntu-Afrique-Remaining-Work-Matrix.md (stale at Wave L CARD-only / Wave M). Do not treat it as current.

This run did not write Wave Y JP handover. This run did not install a Vercel Marketplace / Shopify commerce provider. That install is forbidden by Wave X and would duplicate the Ubuntu product/order/Gap book.

---

## 1. Verdict

| Gauge | Classification | Meaning |
|---|---|---|
| Structure vs 162-spec architecture | Compatible as a sister platform | One user, one tree, one rank, one Gap, one wallet, one product/order book. Live Aureus was not rewritten. |
| Functional engines vs required tests 130-144, 152 | Compatible | Fantasy + npm test 133/133. Numbers match the spec. |
| Design vs shared-system rules (sections 5, 160) | Compatible with two named refusals | One Gap engine only. Section 57 product-specific schedules stay refused. Public marketplace/NFT buy stay 403. |
| Member / admin product surfaces (N-T) | Compatible on preview source | Network, wallet, KYC, orders, cards, fractions, admin desks, reports, catalog browse, NFT preview, civilian register. |
| Phase 5 Day 26-30 production | Partially compatible / blocked | Preview-complete. PRODUCTION_COMPLETE = false. Wave U/V/W/X need named sentences. |
| 30-day / 3-developer calendar | Incompatible on purpose | Calendar retired 2026-10-02. Agent waves A-T replaced it. Do not restart. |
| Transform live Aureus compensation | Incompatible on purpose | Sister ua_* book. Isolation is the correct ethic. |
| Handover-ready now | Yes for Wave Y paper | Engines, surfaces, 403s, and roadmap correlation are verified. Not production-ready. |

Bottom line: the completion roadmap N-T correlates with the original 162-section matrix as a preview-complete sister platform. Checklist items that the spec called Day 30 / marketplace buy / NFT trading / real PSP are correctly unfinished. Do not treat them as missing defects.

---

## 2. What this run verified

| Check | Result |
|---|---|
| HEAD / version | 96b4d68 Tell the truth that named CARD and FRACTION checkout are open. / 0.1.61 |
| npm test | 133/133 |
| Fantasy engine script (no DB write) | PASS — 130, 131, 132, 133, 134, 135, 136, 139, independent legs, NFT 5/5/5/5/80, flags |
| Source 403s | src/routes/api/marketplace/order.ts and src/routes/api/nft/order.ts return 403 |
| Preview smoke list | 8 rows. PREVIEW_COMPLETE=true. PRODUCTION_COMPLETE=false |
| HTTP GET known previews | Both preview hosts 302 to Vercel SSO. Protection on. Click-path not run this session. |
| HTTP POST john-james-projects.vercel.app marketplace/NFT order | 403 (production alias is not the 0.1.61 tree; network/wallet/kyc GET 404) |
| HTTP POST preview marketplace/NFT order | 401 (SSO), not an open buy |
| Ubuntu SQL | 0001-0023 under supabase/ubuntu-only/ |
| Vercel Marketplace skill | Refused. Do not vercel integration add Shopify. |

---

## 3. Intentional deltas (do not fix in Wave Y)

| Spec | Built | Why keep |
|---|---|---|
| Transform existing Aureus software | Sister platform, own ua_* book | Live Aureus stays the live financial book |
| 3 developers / 30 calendar days | Agent waves A-T | Calendar retired 2026-10-02 |
| Section 57 product-specific Gap schedules | Marketplace forces STANDARD_25; rejects CUSTOM_30 | One Gap engine. Spec 138 still holds: $200 x 25% = $50 |
| Public marketplace / NFT purchase by Day 18 / 25 | Browse + engines; public order 403 | Flags stay false until named Wave V / W |
| NFT production trading | Coded, gated, nftMarketplaceEnabled false | Spec 65 / 152: off until 1,400,000 shares sold and named |
| Real PSP / email / Day 30 | Staging PSP only; in-app notify; no vercel --prod | Waves X / U blocked |
| Vercel Marketplace / Shopify catalog | Not installed | Would create a second commerce backend |

---

## 4. Roadmap correlation (original matrix to boards to HEAD)

The original spec is the definition of complete. The Remaining-Work-Matrix (2026-10-05) mapped Phases 1-4 onto waves A-L and left Phase 5 as Wave M. After CARD/FRACTION named-open, the Remaining-Build-Roadmap replaced Wave M with product waves N-T, then Y handover, then blocked U-X.

| Spec phase | Spec days / gate | Remaining-Work-Matrix | Remaining-Build-Roadmap | HEAD 0.1.61 |
|---|---|---|---|---|
| Phase 1 core (7-25) | Days 1-5. Day 5 gate | A-C engines | Consumed. Do not restart | Compatible. Gap/rank/QV/TV/BLP/wallet/GAP_COVER_V1 |
| Phase 2 cards + fractions (26-51) | Days 6-12. Day 12 gate | A-B + L CARD; FRACTION later named | Named CARD+FRACTION open | Compatible on preview source. Staging PSP. |
| Phase 3 marketplace (52-63) | Days 13-18. Day 18 gate | D secret-admin + K pages | Wave Q browse. Buy 403. Wave V blocked | Partially compatible. Pages yes. Public buy closed on purpose. |
| Phase 4 NFT (64-84) | Days 19-25. Day 25 gate | E staging + K pages | Wave R preview. Buy 403. Wave W blocked | Partially compatible. Records + 5/5/5/5/80. Production off. |
| Phase 5 (85-90) | Days 26-30 | Wave M | Wave T honesty; Wave U Day 30 blocked | Partially compatible. Preview tests yes. Production release no. |
| Member UX (115-116) | Final dashboard | G-I then missing | Waves N + S | Compatible on source |
| Admin (99-100, 117) | Admin desks | H-I secret + roles | Wave O desks | Compatible on source |
| Reports + notify (118, 122) | Reports / in-app | Missing on Oct-5 board | Wave P | Partially compatible. Read-only reports. In-app only. |
| Civilian register (8, 158) | Retain registration | Later | Wave S | Compatible. Ubuntu-only. No Aureus insert. |
| Honesty / flags (151-152) | Feature flags | Live SELECT Oct-5 | Wave T | Compatible. CARD/FRACTION true. marketplace/NFT false. |

Wave status that Wave Y must inherit (do not reopen Done; do not start Blocked):

| Wave | State | Evidence |
|---|---|---|
| A-M (engine / named CARD / FRACTION / PSP staging) | Done (historical) | Remaining-Work-Matrix + later named FRACTION open |
| N member book | Done | 86d52b9 / 0.1.55 |
| O admin product | Done | ef6f27c / 0.1.56 |
| P reports + notifications | Done | c59fa8b / 0.1.57 / 0023 |
| Q marketplace product | Done | 47d24fb / 0.1.58 / public buy 403 |
| R NFT product | Done | bd2b831 / 0.1.59 / public buy 403 |
| S civilian onboarding | Done | 6735ab3 / 0.1.60 |
| T honesty + tests | Done | 96b4d68 / 0.1.61 / 133 tests |
| Y JP handover | After T. Next named prompt. | This analysis is the prerequisite |
| U Day 30 | Blocked | Named sentence required. No vercel --prod |
| V marketplace on | Blocked | Named enable Ubuntu marketplace_enabled |
| W NFT on | Blocked | 1.4M sold and named |
| X real PSP | Blocked | Named provider. Do not install Shopify |

---

## 5. Side-by-side: spec groups vs implementation

Labels: Compatible / Partially compatible / Incompatible / Unknown.

### 5.1 Purpose and shared core (1-5, 159-160)

| Spec | Implementation | Class |
|---|---|---|
| Existing Aureus as foundation, do not rebuild auth/KYC/tree | Sister book. AA login can provision Ubuntu member + read-mirror. Civilian register writes ua_users + ua_sponsor_tree only | Compatible (isolation stronger than spec) |
| One user / KYC / tree / rank / Gap / wallet / product / order / payment | ua_* tables 0001-0023. One processGapCover. One rankEngine. One memberLedger | Compatible |
| Do not duplicate Gap inside modules | Cards, fractions, marketplace settlement, NFT gap all call processGapCover | Compatible |
| Developer 1/2/3 ownership language | Agent waves. Company IP. No module ownership | Compatible |

### 5.2 Compensation versioning and ranks (9-18, 130-132)

| Spec | Implementation | Class |
|---|---|---|
| New txns GAP_COVER_V1. Historical never recalc | COMP_PLAN_VERSION = GAP_COVER_V1. Aureus live plan untouched | Compatible |
| SSA 10 / ASM 16 / BSM 20 / SSM 23 / VP 25 | STANDARD_25_RANKS | Compatible |
| Compression + unclaimed stays with Ubuntu Afrique | Tests 130-132. Fantasy: 25.00 / 25.00 / paid 16 unclaimed 9 | Compatible |
| Independent legs: two ASMs under one personal = 1 | countQualifiedLegs. Incorrect=1, correct=2 | Compatible |
| One corporate rank for all products | No card/fraction/marketplace/NFT ranks | Compatible |

### 5.3 QV, Team Volume, BLP (19-23)

| Spec | Implementation | Class |
|---|---|---|
| QV stored separate from price | Price versions + confirm credits QV | Compatible |
| Cached TV, not full tree scan on every page | Aggregates + progress persist. Page uses API | Compatible |
| BLP 5% = 1.5/1.5/1/1. Monthly reset. Weights 1/2/3/5 | blpEngine.mjs + tests | Compatible |

### 5.4 Products, cards, fractions (27-50, 133-137)

| Spec | Implementation | Class |
|---|---|---|
| Shared product + price versions | ua_products / product_price_versions / 0008 seeds | Compatible |
| Plastic $100 / cost $55 / gap $25 / BLP $5 / gross $15 | Fantasy + test 133 | Compatible |
| Metal $150 / cost $75 / gap $37.50 / BLP $7.50 / gross $30 | Fantasy + test 134 | Compatible |
| Card flow + fulfilment + admin | Named public CARD order. Admin /admin/cards. Staging PSP | Partially compatible — real PSP Wave X |
| $10 fraction, phase lock, 100,000 underlying | FRACTION_UNIT_PRICE, INITIAL_UNDERLYING_SHARES, historical lock | Compatible |
| At $200: 0.05 share, allocation $5, gap $2.50, BLP $0.50, balance $2 | Test 135 | Compatible |
| Phase change 80,000 remaining to 1.6M / 2.4M fractions | Test 136 | Compatible |
| Inventory reject above remaining | Test 137. Reserve not sold. Reserved not remitted | Compatible |
| Liability ledger $10,000,000 original | liabilityEngine + remit API | Compatible |

### 5.5 Marketplace (52-63, 138)

| Spec | Implementation | Class |
|---|---|---|
| Company profile + /marketplace/company/{slug} | Pages exist. Media 0018 | Compatible (browse) |
| Search / categories / company desk / admin | Wave Q + admin /admin/marketplace | Partially compatible. Filters only when columns exist |
| Checkout + company settlement | Engine + secret settle. Public POST /api/marketplace/order 403 | Partially compatible (closed on purpose) |
| Product-specific Gap section 57 | Refused. STANDARD_25 only. Test 138 rejects CUSTOM_30 | Incompatible with section 57; Compatible with sections 5 / 138 / one engine |
| $200 marketplace to max Gap $50 | Same 25% engine as $100 to $25 | Compatible |

### 5.6 NFT (64-84, 139-144, 152)

| Spec | Implementation | Class |
|---|---|---|
| Assets / ownership / listing preview | /dashboard/nft, /nft, /nft/listing/$id, admin /admin/nft | Compatible (preview) |
| 5/5/5/5/80. First resale Sponsor. Later Original Seller | Fantasy + tests 139-141 | Compatible |
| NFT Gap scaled 5/25. Compression 20+20+10 on $1,000 | Test 142 | Compatible |
| Transfer / history / double-buy / duplicate payment | Tests 143-144 (engine). Public order 403 | Partially compatible |
| Production gate 1,400,000 | Test 152. nftProductionTradingAllowed false | Compatible |

### 5.7 Wallet, immutability, money, admin (91-100, 119-121)

| Spec | Implementation | Class |
|---|---|---|
| Ledger types Gap / BLP / NFT / refund / reversal | memberLedger credit set + reversals | Compatible |
| Snapshot + no silent edit | Price version on order. Refunds create reversals | Compatible |
| Idempotency | Duplicate confirm / webhook / NFT event tests | Compatible (unit) |
| DECIMAL / no JS float for money | money.mjs bigint | Compatible |
| Admin roles + audit | KYC/finance/card/share roles + 0020 + alerts 0019 | Partially compatible. Not every section 99 desk is a separate role UI |
| Notifications | In-app ua_notifications 0023. Email blocked | Partially compatible |

### 5.8 Tables / services / APIs (101-114)

Ubuntu uses ua_* names. Mapping is one-to-one enough for integrity: users, sponsor tree, ranks, volume, commissions, wallet, products, price versions, payments, cards, fractions, liability, marketplace companies/media/orders, NFT core, notifications, alerts, reversals, idempotency.

Shared commission API exists (POST /api/commissions/process). Card/fraction quote+order APIs exist. Marketplace/NFT public purchase APIs exist and 403.

Class: Compatible as a renamed sister schema.

### 5.9 Phase 5 checklist (85-90, 145-152)

| Day / rule | State | Class |
|---|---|---|
| 26 E2E cards/fractions/marketplace/NFT | Dummy + named CARD/FRACTION UAT runners. Marketplace/NFT buy not E2E | Partially compatible |
| 27 recon | Admin finance summary + reports. Not a signed Day 27 pack | Partially compatible |
| 28 concurrency | Unit 143-144, webhook dup. Live Ubuntu concurrency not re-run this session | Partially compatible |
| 29 management UAT | Not a signed JP pack. That is Wave Y | Unknown until Y |
| 30 production release | Blocked. Production alias stale vs 0.1.61 | Incompatible with must ship Day 30; Compatible with retired calendar |
| 145 server-side prices | Client overrides rejected | Compatible |
| 146 payment confirm gate | Staging PSP + matching recorded event | Compatible (staging) |
| 147 media | Logo/banner/gallery; public upload closed | Compatible |
| 148 indexes | 0017 | Compatible |
| 149 alerts | High-priority admin alerts | Compatible |
| 150 backup | Ubuntu-only planner. Refuses Aureus | Compatible (planner) |
| 151 flags | gap/cards/fractions open; marketplace/nft false | Compatible |

---

## 6. Definition of complete (153-157) — current gauge

| Definition | Class | Notes |
|---|---|---|
| 153 Core | Compatible | Legacy not used on new Ubuntu txns. Gap, compression, ranks, legs, QV, TV, BLP, wallet, reversals, alerts |
| 154 Cards | Partially compatible | Configurable, dynamic, named public purchase, Gap/QV/BLP, fulfilment admin, refund. Real PSP and production host not 0.1.61 |
| 155 Fractions | Partially compatible | $10, phase, lock, inventory, liability, Gap/QV/BLP. Same PSP/host caveat |
| 156 Marketplace | Partially compatible | Companies, pages, media, products, settlement engine, admin. Public buy 403. Section 57 refused |
| 157 NFT | Partially compatible | Assets, preview, 5/5/5/5/80, original seller, compression, 1.4M gate. Public buy 403. Production off |

---

## 7. Fantasy + required-test lock (this session)

Fantasy (no DB write) against live engines:

- 130 full chain $100 = 25.00 (10+6+4+3+2)
- 131 SSA to BSM to VP = 25.00 (10+10+5)
- 132 ends at ASM: paid 16.00, unclaimed 9.00
- 133 plastic gross 15.00
- 134 metal gross 30.00
- 135 fraction at $200 gross 2.00
- 136 80,000 remaining at $300 = 2,400,000 fractions
- 139 NFT $1,000 = 50/50/50/50/800; nftMarketplaceEnabled false
- Independent legs 1 vs 2
- Flags: purchaseOpen = CARD,FRACTION; marketplace/NFT false
- Source 403s present

npm test 133/133 includes the same required numbers plus 138, 140-144, 146-150, 152, isolation, N-T product locks.

---

## 8. HTTP smoke (read-only)

| Host | Result | Class |
|---|---|---|
| john-james-projects-r8tjhyfnx-smart-united-network.vercel.app | 302 Vercel SSO. POST order 401 | Unknown as 0.1.61 click-path until Johan SSO |
| john-james-projects-micjz0u6f-smart-united-network.vercel.app | Same SSO | Unknown as current tree |
| john-james-projects.vercel.app | Login 307. /dashboard/network|wallet|kyc 404. Cards/invest GET 200. POST marketplace/NFT 403 | Incompatible with 0.1.61 source. Stale production alias. Not proof of live 0.1.61 |

Do not treat the production alias as Wave T. Do not vercel --prod.

---

## 9. Design gauge

The 162-spec diagram is:

Aureus core -> user/KYC/network -> rank -> Gap -> (Cards | Fractions | Marketplace) -> unified ledger -> NFT ownership -> NFT marketplace 5/5/5/5/80.

The built diagram is the same with one isolation change at the root:

Ubuntu Afrique sister book (ua_*) -> user/KYC/network -> rank -> Gap -> (Cards open | Fractions open | Marketplace browse) -> unified ledger -> NFT records/preview -> NFT trading off.

That is functioning as designed for a preview-complete sister platform. It is not functioning as a Day-30 transformation of live Aureus, and it must not.

---

## 10. Handover readiness

Ready to write Wave Y (paper only):

- Spec to roadmap correlation is documented
- Required money tests pass
- Named CARD/FRACTION opens are honest
- Marketplace/NFT stay closed
- Isolation still refuses Aureus
- Blocked waves are named

Not ready to call the platform production-complete:

- Production host is not 0.1.61
- Preview SSO blocks unattended click-path
- Wave U/V/W/X still need named sentences
- JP has not signed the click-path pack (that is Wave Y)

---

## 11. Next prompt

U: Wave Y JP handover

Write the Desktop sign-off matrix only. Do not enable marketplace/NFT. Do not Day 30. Do not install Shopify. Do not push origin. Do not write Aureus.
