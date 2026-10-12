# Ubuntu Afrique — JP Cursor Playwright login and test prompt

**Job type:** U
**Date:** 2026-10-12
**For:** JP
**From:** Ruvan
**Named host:** https://ubuntu-afrique.vercel.app
**SHA:** a478c86 / **0.1.64** on ubuntu-fork/main
**Ubuntu book:** rbyipalrasawbjpsppgu
**Aureus prod:** fgubaqoftdeefcakejwu — refuse every write

JP: paste **Section A** into Cursor as one prompt. Cursor must drive Playwright (Cursor browser) on the named host, log you in, and walk the tests with you.

Accounts already exist. Register rejected dotted usernames. Live usernames use underscores.

---

## Section A — paste this whole block into Cursor

```text
U: JP Ubuntu Afrique Playwright assist. One job.

Catch me up, then use Playwright / Cursor browser on https://ubuntu-afrique.vercel.app to log me in and walk the tests with me. Tell me exactly what you are about to click before you click it. Do not write Aureus. Do not enable any nft_* flag. Do not vercel --prod. Do not push origin. Do not write git config. Do not install Shopify or any Vercel Marketplace provider. Do not alias aureus.africa. Do not start Wave W.

## 0. Browser first

Use Playwright MCP (plugin-playwright-playwright) or the Cursor built-in browser. Do not ask me to open Chrome myself.

Immediately:
1. browser_navigate https://ubuntu-afrique.vercel.app/auth/login
2. Hard-refresh that tab (navigate again to the same URL if needed)
3. Confirm the document includes assets/index-44c7eSnH.js (0.1.64). If you still see index-CU2zbWqz.js, stop and say the named host is not 0.1.64.

Keep that tab. All later work is on https://ubuntu-afrique.vercel.app. Do not use john-james-projects.vercel.app as proof. Do not use aureus.africa.

## 1. Catch-up (verified)

Sister book Ubuntu Afrique only. Not Aureus.

GitHub: https://github.com/MRSHAGNASTY/ubuntu-afrique.git
Branch: main
Pin: a478c86
Package: ubuntu-afrique 0.1.64
If this workspace is C:\Users\LeadDev\john-james-projects, fetch ubuntu-fork and confirm HEAD a478c86. Do not merge origin. JPRademeyer84/john-james-projects is frozen.

Named host live: https://ubuntu-afrique.vercel.app
Deploy: dpl_Dwk6fy8TP2vpowyG4HZ2M65YpiFD / ubuntu-afrique-q1jwc8uv2 Ready
PRODUCTION_COMPLETE=true
Named open: CARD, FRACTION, MARKETPLACE
NFT public buy stays 403. That 403 is a PASS.
Ubuntu DB only: rbyipalrasawbjpsppgu (ua_*).
Refuse every write to Aureus fgubaqoftdeefcakejwu.
Dummy PSP only: UA_PSP_STAGING. One new CARD / FRACTION / MARKETPLACE is enough. Do not treat it as a live card processor.
UA_COMMERCE_CONFIRM_SECRET is Preview-only. Never print it. Never put it on Production.

Ruvan already unlocked KYC COMPLETED and the six jp_admin roles. Do not recreate users if they exist. Do not grant roles again unless SELECT shows they are missing.

## 2. Test logins (type these — already live)

Register rejected jp.admin. Live usernames are underscores. Emails keep the dots.

| Prompt name | Username | Email | Password | userId | KYC | Roles |
|---|---|---|---|---|---|---|
| jp.admin | jp_admin | jp.admin@ubuntu-afrique.test | Ua-Adm-xCYbsWyJUXrcjfWhVOxD5MRe | 11 | COMPLETED | FINANCE KYC MARKETPLACE CARD SHARE SUPPORT |
| jp.member | jp_member | jp.member@ubuntu-afrique.test | Ua-Mem-Rl1Dq1dnqhY5ALapmUv2Okhk | 12 | COMPLETED | none |
| jp.sponsor | jp_sponsor | jp.sponsor@ubuntu-afrique.test | Ua-Spo-BGBcmoW3fYPTuKxhhccxO5li | 13 | COMPLETED | none |

jp_member sponsor = jp_admin (11).

Write or refresh credentials to the Desktop that exists on THIS machine, UTF-8:
C:\Users\LeadDev\Desktop\Ubuntu-Afrique-JP-Test-Accounts.local.md
If that folder does not exist, write C:\Users\ASUS\Desktop\Ubuntu-Afrique-JP-Test-Accounts.local.md
Do not commit that file.

Say the three usernames and passwords in chat so I can type along. Then you drive Playwright.

## 3. Speak to me, then walk Playwright

Say this first:

You will test Ubuntu Afrique on https://ubuntu-afrique.vercel.app
Member account: jp_member
Admin account: jp_admin
Marketplace buy is open. NFT buy must stay 403.
Use dummy staging pay only. One CARD, one FRACTION, one MARKETPLACE is enough if those are not already PAID on this user.
Do not enable NFT trading. Do not touch Aureus.

Then walk. Before each step, tell me the URL and the control you will click. After each step, say PASS or FAIL with the on-screen text.

### Member path — sign in as jp_member

Playwright:
- browser_navigate https://ubuntu-afrique.vercel.app/auth/login
- browser_snapshot
- fill Email Address: jp.member@ubuntu-afrique.test
- fill Password: Ua-Mem-Rl1Dq1dnqhY5ALapmUv2Okhk
- click Sign In
- wait until URL is /dashboard
- ua-login 401 in console is expected (Aureus first, then Ubuntu). Ignore it.

Walk:
1. /dashboard — Ubuntu book. Welcome back, jp_member. Rank / wallet / cards / fractions. No Aureus investment totals. No Admin link (jp_member has zero roles).
2. /dashboard/kyc — COMPLETED. fullName + country only.
3. /dashboard/network — sponsor jp_admin. Must not 404.
4. /dashboard/wallet — derived ledger. Must not 404.
5. /dashboard/cards — if this user already has a PAID plastic, skip a second CARD. Otherwise buy CARD_PLASTIC $100, land on /dashboard/pay?kind=CARD, click Pay Ubuntu staging once.
6. /dashboard/invest — same rule for one $10 FRACTION and /dashboard/pay?kind=FRACTION.
7. /marketplace/products — open Wave H dummy $100 (URL /marketplace/product/UAT_MKT_100). Click Buy marketplace product. Must land on /dashboard/pay?kind=MARKETPLACE&orderId=... Heading must say Pay CARD, FRACTION, or MARKETPLACE. Must NOT say kind must be CARD or FRACTION. Click Pay Ubuntu staging once. Expect Paid MARKETPLACE ... @ $100.
8. /dashboard/orders — CARD / FRACTION / MARKETPLACE rows.
9. /dashboard/notifications — in-app only.
10. /affiliate — Ubuntu network + wallet, not ua_commissions.
11. /nft and /dashboard/nft — Coming Soon / trading off. Confirm disabled.
12. POST https://ubuntu-afrique.vercel.app/api/nft/order with session — 403 Public checkout is not open. That is a PASS.

Sign out (dashboard Sign Out).

### Admin path — sign in as jp_admin

Playwright:
- browser_navigate https://ubuntu-afrique.vercel.app/auth/login
- fill Email: jp.admin@ubuntu-afrique.test
- fill Password: Ua-Adm-xCYbsWyJUXrcjfWhVOxD5MRe
- click Sign In
- wait for /dashboard
- Admin link must be visible.

Walk:
13. /dashboard — Welcome back, jp_admin. KYC COMPLETED. Admin link present.
14. Click Admin. /admin must stay. Must NOT bounce to /auth/login.
    Expect: Ubuntu Afrique administration. Ubuntu user 11. Username jp_admin. Roles FINANCE KYC MARKETPLACE CARD SHARE SUPPORT.
15. /admin/finance — click Load finance summary with the confirm-secret box empty. Totals must load. Role session is enough. Do not paste a Production confirm secret (there is none).
16. /admin/cards — open the desk. Load orders with role session. Do not refund a live paid row unless I say so.
17. /admin/fractions — reserved is not remitted. Do not remit unless I say so.
18. /admin/kyc — Ubuntu profiles only. Look up userId 12 if you need a read. Do not reject COMPLETED KYC.
19. /admin/ranks — look at userId 12. Do not promote.
20. /admin/reports — load a weekly range with role session.
21. /admin/marketplace — companies/products/media. Named checkout is already open. Do not settle a company payout.
22. /admin/nft — recon only. No transfer. No sale insert. No flag flip.

Optional extra: as jp_admin you may also buy UAT_MKT_100 once if you want to see admin dummy Gap. Ruvan already paid dff787df-0103-4bb7-bb6e-a489f7e21c83 as jp_admin. Do not spam dummy volume.

Closed on purpose (PASS if closed):
- NFT public buy 403
- NFT production trading
- Product-specific Gap other than STANDARD_25
- Email (in-app only)
- Real PSP
- Production confirm secret

## 4. If something fails

- kind must be CARD or FRACTION on MARKETPLACE pay = host is not 0.1.64. Stop. Recheck index-44c7eSnH.js.
- /admin bounces to login = still isAureusAdmin bundle, or you are on jp_member. Stop.
- Finance Load fails without secret = role Bearer not sent. Snapshot the error text. Do not put UA_COMMERCE_CONFIRM_SECRET on Production.
- Register jp.admin fails = expected. Use jp_admin.

## 5. Stop and report

Write UTF-8 to the Desktop that exists:
C:\Users\LeadDev\Desktop\Ubuntu-Afrique-Wave-U-JP-Verify-Result.md
or C:\Users\ASUS\Desktop\Ubuntu-Afrique-Wave-U-JP-Verify-Result.md

Include: named host, bundle index-44c7eSnH.js yes/no, three userIds, each step PASS/FAIL with on-screen text, MARKETPLACE order id if you paid one, NFT 403, Aureus not written.

Do not commit. Do not push. Do not start Wave W.
```

---

## What Ruvan already proved on LeadDev

Named host 0.1.64 walk as jp_admin: /admin PASS, finance Load summary PASS (Gap count 6), MARKETPLACE Paid $100 order dff787df-0103-4bb7-bb6e-a489f7e21c83, NFT POST 403.