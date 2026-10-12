# Ubuntu Afrique — Wave Y JP handover and Cursor prompt

**Job type:** U
**Date:** 2026-10-12
**For:** JP
**From:** Ruvan
**Platform SHA:** `96b4d68` / **0.1.61** on `ubuntu-fork/main`
**Ubuntu book:** `rbyipalrasawbjpsppgu` (`ua_*` only)
**Aureus prod:** `fgubaqoftdeefcakejwu` — refuse every write
**This file:** paper + a prompt JP pastes into Cursor. Not Day 30. Not a flag flip.

JP: paste **Section A** into Cursor as one prompt. Cursor must pull the **Ubuntu Afrique** repo below, unlock the test admin accounts on the Ubuntu book, then walk you through the verify list in **Section C**.

---

## Correct repo (do not guess)

| Use this | Do not use |
|---|---|
| GitHub: `https://github.com/MRSHAGNASTY/ubuntu-afrique.git` | `JPRademeyer84/john-james-projects` (frozen parent, not the Ubuntu write remote) |
| Branch: `main` | `master` / Aureus `origin/master` |
| Pin: `96b4d68` / package `0.1.61` / `name: ubuntu-afrique` | `JPRademeyer84/aureus_africa` |
| Remote name on Ruvan machine: `ubuntu-fork` | `JPRademeyer84/ubuntu-afrique-analyzer` (wrong app) |
| Local already-correct tree: `C:\\Users\\LeadDev\\john-james-projects` | Any `aureus_africa__*` worktree |

If Cursor is already in `C:\\Users\\LeadDev\\john-james-projects`, do not clone a second copy. Fetch `ubuntu-fork` and hard-check HEAD.

Preview hosts (SSO on). Production alias is **stale** — do not test there:

- `https://john-james-projects-r8tjhyfnx-smart-united-network.vercel.app`
- `https://john-james-projects-micjz0u6f-smart-united-network.vercel.app`
- `https://john-james-projects.vercel.app` — **wrong tree** (`/dashboard/network|wallet|kyc` 404). Ignore it.

`PRODUCTION_COMPLETE` is **false** on purpose. Preview-complete only.

---

## Section A — paste this whole block into JP's Cursor

```text
U: Wave Y JP Ubuntu Afrique setup and verify. One job. ubuntu-fork only.

Pull the correct repo, unlock JP test accounts on the Ubuntu book, then run the verify list. Do not write Aureus. Do not flip marketplace_enabled or any nft_* flag. Do not vercel --prod. Do not Day 30. Do not install Shopify or any Vercel Marketplace commerce provider. Do not push origin. Do not write git config.

## 1. Isolate the tree

Correct GitHub repo: https://github.com/MRSHAGNASTY/ubuntu-afrique.git
Correct branch: main
Required pin: 96b4d68
Required package.json: name ubuntu-afrique, version 0.1.61

If the workspace is already C:\Users\LeadDev\john-james-projects:
- git remote -v must show ubuntu-fork = MRSHAGNASTY/ubuntu-afrique
- git fetch ubuntu-fork
- git rev-parse HEAD must be 96b4d68
- If HEAD differs, stop and say so. Do not merge origin. Do not reset unless I named it.

If the workspace is empty or is Aureus / john-james-projects-without-ubuntu-fork:
- git clone https://github.com/MRSHAGNASTY/ubuntu-afrique.git
- checkout main
- confirm 96b4d68 and 0.1.61
- Refuse to work in JPRademeyer84/aureus_africa, JPRademeyer84/ubuntu-afrique-analyzer, or any aureus_africa__* worktree.

Refuse UTF-16 writes. After any file write, confirm the file starts with ASCII/UTF-8 bytes, not 69 00.

## 2. Hard stops

Ubuntu DB only: rbyipalrasawbjpsppgu (ua_*).
Refuse every write to Aureus fgubaqoftdeefcakejwu.
Public POST /api/marketplace/order and POST /api/nft/order must stay 403.
Named open: CARD and FRACTION only (UA_PSP_STAGING).
NFT production trading stays off until 1,400,000 Aureus shares sold AND a later named sentence.
Do not set PRODUCTION_COMPLETE=true.
Do not ask again for GitHub / Vercel / Supabase tokens if machine auth exists. If Ubuntu service role is missing, ask only for that one credential.
Actor lock if you commit (you should not commit in this job): No Post On Sunday <mr.shagnasty1990@gmail.com> via git -c. Never JPRademeyer84.

## 3. Unlock JP test accounts (Ubuntu only)

There is no SUPER ADMIN role in code. Staff unlock = ua_users + email_confirm + KYC COMPLETED + all six ua_admin_roles. Secret-only routes still use env UA_COMMERCE_CONFIRM_SECRET. Never print that secret. Never write it into the Desktop handover file.

Create these civilian users via POST /api/auth/register on a local or preview host that is the 0.1.61 tree (or persistCivilianOnboard + auth.admin.createUser against Ubuntu only). Password at least 8 chars. email_confirm true. Username must not be AA777.

1) jp.admin
   email: jp.admin@ubuntu-afrique.test
   username: jp.admin
   After create: POST /api/admin/roles with confirm secret for each role:
   FINANCE, KYC, MARKETPLACE, CARD, SHARE, SUPPORT
   Then submit member KYC (fullName + country only; refuse Aureus KYC fields) and POST /api/admin/kyc/review decision COMPLETED.

2) jp.member
   email: jp.member@ubuntu-afrique.test
   username: jp.member
   sponsorCode: jp.admin (or jp.admin ua_users.id)
   KYC COMPLETED. No admin roles. This is the member click-path account.

3) jp.sponsor
   email: jp.sponsor@ubuntu-afrique.test
   username: jp.sponsor
   KYC COMPLETED. No admin roles. Use as a second personal leg if you need independent-leg display.

If a username/email already exists on ua_users, reuse it. Do not duplicate. Do not insert into Aureus auth or Aureus KYC.

Write credentials once to:
C:\Users\LeadDev\Desktop\Ubuntu-Afrique-JP-Test-Accounts.local.md
UTF-8. Do not commit. Do not push. Include userId, username, email, password, roles, kyc status, sponsor.

Verify with Ubuntu SELECT only:
- ua_users rows for the three usernames
- ua_sponsor_tree: jp.member sponsored by jp.admin
- ua_admin_roles: jp.admin has all six roles; jp.member and jp.sponsor have zero
- ua_kyc_profiles: all three COMPLETED
- ua_system_settings: marketplace_enabled and all nft_* remain false; cards/fractions/gap stay as already named-open

## 4. Engine lock (Cursor runs this)

cd the ubuntu-afrique tree
npm test
Must be 133/133. If not, stop. Do not "fix" by flipping flags.

These numbered tests already pass in CI. JP does not re-implement them. JP verifies the matching click-path in section 5.

Required money tests (already green):
130 Gap $100 full chain 10+6+4+3+2=25
131 compression SSA to BSM to VP 10+10+5=25
132 unclaimed ends at ASM paid 16 Ubuntu keeps 9
133 plastic $100 cost 55 gap 25 BLP 5 gross 15
134 metal $150 cost 75 gap 37.50 BLP 7.50 gross 30
135 fraction at $200: 0.05 share, allocation 5, gap 2.50, BLP 0.50, balance 2
136 80000 remaining: 1.6M fractions at $200, 2.4M at $300, history locked
137 0.25 remaining at $200 rejects more than $50
138 marketplace $100 uses STANDARD_25 only; CUSTOM_30 throws; public order 403
139-144 NFT 5/5/5/5/80, original seller, compression, dup payment, double buy — public order 403
146 confirm needs matching recorded payment event
147 media logo/banner/gallery; public upload closed
149 high-priority admin alerts
150 backup planner refuses Aureus
152 NFT production off below 1,400,000 shares

Honesty: PREVIEW_COMPLETE=true, PRODUCTION_COMPLETE=false, purchaseOpen=CARD,FRACTION.

## 5. What JP must click and verify

Use preview with Vercel SSO (JP is on Smart United Network). Do not use john-james-projects.vercel.app.

Login: /auth/login as jp.member and as jp.admin.
Register path already used for the three accounts. First-run: login, dashboard, KYC, cards or invest. KYC does not block CARD/FRACTION pay.

Member (jp.member) — must work:
- /dashboard — Ubuntu book, rank, QV, wallet, cards, fractions. No Aureus investment totals.
- /dashboard/kyc — status COMPLETED. fullName + country only.
- /dashboard/network — sponsor jp.admin, directs, qualified legs. No full-tree scan freeze.
- /dashboard/wallet — ledger derived balance, not an editable wallet_balance field.
- /dashboard/cards — named CARD checkout. Place plastic $100 pending. Do not treat staging pay as live PSP.
- /dashboard/invest — named FRACTION checkout. $10 unit. Phase lock. Inventory cannot oversell.
- /dashboard/pay — complete CARD or FRACTION through UA_PSP_STAGING only if you intend a dummy settle. Prefer one plastic and one fraction pending if you do not want more dummy volume.
- /dashboard/orders — CARD and FRACTION rows only.
- /dashboard/notifications — in-app only.
- /affiliate — Ubuntu network + wallet, not ua_commissions.
- /marketplace and /marketplace/company/{slug} and /marketplace/products — browse works.
- POST /api/marketplace/order — 403. That is a PASS.
- /nft and /dashboard/nft — preview, Coming Soon / trading off copy, 5/5/5/5/80 quote read-only.
- POST /api/nft/order — 403. That is a PASS.
- Confirm button on NFT listing stays disabled.

Admin (jp.admin, all six roles) — must work:
- /admin — Ubuntu Afrique administration, not Aureus administration.
- /admin/cards — filter plastic/metal, fulfilment, tracking, refund path visible. Refund creates reversals, does not delete.
- /admin/fractions — orders, liability remit. Reserved is not remitted.
- /admin/kyc — Ubuntu profiles only. COMPLETED / REJECTED + reason.
- /admin/ranks — progress. Do not silent-promote a live member. Do not invent a second rank system.
- /admin/finance — ledger / commerce totals.
- /admin/reports — date range read-only. Totals reconcile to finance summary. Do not mutate money.
- /admin/marketplace — companies, products, media. No live company payout. Buy stays 403.
- /admin/nft — assets and recon. No transfer, no insert sale, no flag flip.

Closed on purpose (PASS if closed):
- Marketplace public buy
- NFT public buy
- NFT production trading
- Product-specific Gap schedules other than STANDARD_25
- vercel --prod / Day 30
- Email channel (in-app only)
- Real PSP (staging only)

## 6. Stop and report

Write a short Desktop note:
C:\Users\LeadDev\Desktop\Ubuntu-Afrique-Wave-Y-JP-Verify-Result.md
UTF-8. Include: tree path, HEAD, npm test count, three userIds, which click-paths passed, which failed, confirmation that marketplace/NFT still 403, confirmation Aureus was not written.

Do not commit. Do not push. Do not open Wave U/V/W/X.
```

---

## Section B — what Cursor is allowed to unlock

Ubuntu admin roles in code (all six on `jp.admin`):

| Role | Desk |
|---|---|
| FINANCE | /admin/finance, /admin/reports |
| KYC | /admin/kyc |
| CARD | /admin/cards |
| SHARE | /admin/fractions |
| MARKETPLACE | /admin/marketplace and /admin/nft (browse/recon only) |
| SUPPORT | role read |

Grant API: `POST /api/admin/roles` with `UA_COMMERCE_CONFIRM_SECRET` (requiredRole is null, so the first grant is secret-only). Body: `{ userId, role, confirmSecret }`.

KYC review: `POST /api/admin/kyc/review` with KYC role or secret. Decision `COMPLETED`. No Aureus KYC field names.

"Fully unlocked" means: confirmed auth user, completed Ubuntu KYC, all six roles on `jp.admin`. It does **not** mean marketplace buy, NFT buy, or production.

---

## Section C — JP test card (print and tick)

Open = must work. Closed = 403/disabled is a pass.

### C1. Identity and isolation

- [ ] Workspace is MRSHAGNASTY/ubuntu-afrique `main` at `96b4d68` / 0.1.61
- [ ] `npm test` 133/133
- [ ] No Aureus tab, no Aureus SQL, no Aureus KYC fields
- [ ] Production host `john-james-projects.vercel.app` was **not** used as the test site

### C2. Member path (jp.member)

- [ ] Register/login works
- [ ] Dashboard shows rank / QV / wallet / cards / fractions from Ubuntu
- [ ] KYC COMPLETED (fullName + country)
- [ ] Network shows sponsor `jp.admin`
- [ ] Wallet lists ledger types, not a typed-in balance
- [ ] CARD plastic quote $100 / cost $55 / gap $25 / BLP $5 / gross $15
- [ ] FRACTION $10 at current phase; ownership does not change if you only look at a higher phase
- [ ] Orders page shows CARD/FRACTION only
- [ ] Affiliate page is Ubuntu, not old commissions

### C3. Commerce gates

- [ ] CARD checkout named-open
- [ ] FRACTION checkout named-open
- [ ] Marketplace pages browse
- [ ] Marketplace order API 403
- [ ] NFT pages preview 5/5/5/5/80
- [ ] NFT order API 403
- [ ] Copy says production NFT trading off until 1,400,000 shares sold

### C4. Admin path (jp.admin)

- [ ] All six desks open
- [ ] Card fulfilment + refund visible
- [ ] Fraction remit does not treat reserve as paid
- [ ] KYC review Ubuntu-only
- [ ] Reports read-only
- [ ] Marketplace/NFT admin does not settle a public buy

### C5. Do not mark as fail

- [ ] Section 57 Product B 8/12/15/18/20 missing — one STANDARD_25 engine is the rule
- [ ] 30-day / 3-developer calendar not restarted
- [ ] PRODUCTION_COMPLETE=false
- [ ] Staging PSP, not a live card processor
- [ ] In-app notify, no email

---

## Section D — after JP signs

JP replies with the verify result file (or ticks C1–C4).

Next named prompts, only when Ruvan names them, in this order:

1. `U: Wave V enable Ubuntu marketplace_enabled`
2. `U: Wave X` with the real PSP name (not Shopify)
3. `U: Wave U Day 30` with the exact host and whether `vercel --prod` is allowed
4. `U: Wave W enable Ubuntu nft_marketplace_enabled` only after 1,400,000 shares sold

Until then the platform is **preview-complete**, not production-complete.

---

## Section E — Ruvan machine notes

Worktree already correct: `C:\\Users\\LeadDev\\john-james-projects`
Remote: `ubuntu-fork` = `https://github.com/MRSHAGNASTY/ubuntu-afrique.git`
HEAD: `96b4d68`
Integrity write: `Desktop\\Ubuntu-Afrique-Spec-Integrity-and-Roadmap-Correlation-2026-10-12.md`

If JP cannot clone `MRSHAGNASTY/ubuntu-afrique`, grant him read access on that repo. Do not send him `JPRademeyer84/john-james-projects` as the Ubuntu source of truth.
