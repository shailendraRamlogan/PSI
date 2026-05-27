# PSI Web Platform — Development Plan v3

> Updated: 2026-05-21  
> Phases aligned to original SOW. Call center cancelled. Blu Guruz = Stripe account entity.  
> Aesthetic: MoonPay-inspired + Three.js 3D elements  
> Layout reference: paymentssolutionsintl.com/mockup  

---

## Key Decisions Locked

| Item | Decision |
|------|----------|
| Blu Guruz | Company whose Stripe keys we use — not a separate backend |
| Call center processing | **Cancelled** — removed from all phases |
| Domain | Subdomains on `ourea.tech` (Paul will set up) |
| Alt5 credentials | Not yet — build wallet architecture, integrate when ready |
| Sumsub | Not yet — build KYC flows with placeholder, integrate when ready |
| Design assets | Use placeholders, Paul will retrieve final assets |
| Stripe keys | Paul can retrieve — integrate when ready |
| Visa rail card | Not discussed yet — build UI placeholder, defer card issuer integration |
| POS hardware | Confirm later |
| Compliance counsel | Future |
| Aesthetic | MoonPay-inspired, Three.js for 3D elements |
| Layout reference | paymentssolutionsintl.com/mockup (Home, Dashboard, Payments, KYC) |
| Tokenization | Dormant — marketing presence only, feature-flagged off |

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **Frontend** | Next.js 14+ (App Router) | Landing + authenticated dashboard |
| **3D** | Three.js / React Three Fiber | Hero scene, gift cards, tokenization visuals |
| **Animations** | Framer Motion + GSAP | Scroll-driven, hover effects, transitions |
| **Backend** | NestJS | API-first modular architecture |
| **Database** | PostgreSQL | Financial data, ACID compliance |
| **Cache/Queue** | Redis + BullMQ | Sessions, FX rates, payment processing |
| **Auth** | Firebase Auth + custom JWT | Multi-role RBAC |
| **Payments** | Stripe (Blu Guruz keys) | Card processing, fiat intake |
| **Crypto** | Alt5 Sigma API | Wallets, swaps, conversion (when credentials ready) |
| **KYC** | Sumsub (when available) | Placeholder KYB/KYC flows built first |
| **Hosting** | AWS (ECS + RDS + ElastiCache) | PCI-compliant, multi-region |

---

## PHASE 1 — Foundation (Weeks 0–3)

> Original SOW Phase 1: MVP with onboarding, Stripe payments, dashboard, gift cards

### Sprint 1.1 — Project Scaffold + Landing Page (Days 0–5)

**Setup:**
- [ ] Initialize monorepo: `apps/web` (Next.js), `apps/api` (NestJS), `packages/shared`
- [ ] PostgreSQL schema v1 (users, transactions, kyc, gift_cards, wallets)
- [ ] Firebase Auth integration (email/password, OAuth placeholders)
- [ ] JWT middleware + role-based access control (user, merchant, admin)
- [ ] Geo/IP detection middleware (TT vs JM vs BS vs International)
- [ ] Docker + docker-compose for local dev
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Deploy staging to `psi.ourea.tech` (or Paul's chosen subdomain)

**Landing Page (`/landing`):**

Build exactly per the existing paymentssolutionsintl.com/landing structure but with MoonPay aesthetic + Three.js:

| Section | Implementation |
|---------|---------------|
| **Navbar** | PSI logo (placeholder), B2B, Individuals, Login, Get Started (right-aligned) |
| **Hero** | Three.js 3D immersive scene + "Your payment solutions begin here" + "On-ramp, off-ramp liquidity for global solutions in Fiat and Stablecoins" |
| **Industry Solutions** | 12 borderless cards: Import & Export, Supply Chain, Manufacturing, Hardware, Finance & Fintech, Real Estate, Construction, Casino & Gaming, E-commerce, Retail, Investments, Personalized Liquidity. Hover animations (Framer Motion) |
| **Dashboard Preview** | Screenshot from mockup, re-themed to MoonPay aesthetic. Caption: "Users get access to individualized dashboard tracking real-time asset balances and transaction history" |
| **Visa Rail Card** | "Apply for your Visa Rail Card" section. Silver card render with randomized 16-digit number. Caption about crypto-to-cash conversion, ATM withdrawal, online/in-person use |
| **Gift Cards** | Three.js 3D gift card scene — individual card themes with crypto logos (BTC, ETH, USDT, TRX, USDC). Caption: "Pre-loaded cryptocurrency gift cards come with complimentary wallet for instant redemption, remittance and exchange services" |
| **Tokenization** | Beachfront hotel render. Caption: "Fractional ownership of real estate development projects for exceptional return on investment. Pay with credit card or fiat." Tagged "Coming Soon" |
| **FAQs** | Accordion dropdown — 5 questions (same as current site) |
| **Footer** | Products, Company, Legal links + full disclaimer (same as current) |

**3D Elements (Three.js):**
- Hero scene: Abstract 3D geometry/particles representing financial flows — dark bg, glowing accents
- Gift cards: 3D card objects with crypto logos, subtle rotation animation
- Tokenization: 3D beachfront property render (or parallax image with 3D depth)

**Other Public Pages:**
- [ ] `/b2b` — Expands on on-ramp/off-ramp B2B services
- [ ] `/individuals` — Expands on individual use cases
- [ ] `/get-started` — Qualification funnel (Business or Individual? → Which services? → KYC portal)
- [ ] `/login` — Routes to authenticated dashboard

### Sprint 1.2 — Auth + KYC + Dashboard (Days 5–12)

**Auth Module:**
- [ ] User registration (email + password)
- [ ] Login with JWT tokens
- [ ] Password reset flow
- [ ] Email verification
- [ ] Role assignment (individual, business, admin)

**KYC/KYB Portal (placeholder until Sumsub):**

Layout follows paymentssolutionsintl.com/mockup/kyc structure:
- [ ] 4-step wizard: Personal Info → Identity Verification → Address Verification → Review & Submit
- [ ] Step 1: Full legal name, DOB, nationality, tax ID, email, phone
- [ ] Step 2: Government ID upload (passport/driver's license), selfie verification
- [ ] Step 3: Proof of address (utility bill, bank statement)
- [ ] Step 4: Review all documents, submit for review
- [ ] KYB variant: Business info → Directors → Documents → Review
- [ ] Document upload with preview
- [ ] Export KYC package as ZIP (compliance-ready)
- [ ] Admin review queue (approve/reject with notes)
- [ ] Sumsub integration point: abstract verification layer so Sumsub drops in when ready

**User Dashboard:**

Layout follows paymentssolutionsintl.com/mockup/dashboard structure:
- [ ] Sidebar nav: Home, Dashboard, Payments, KYC Portal
- [ ] Balance cards with % change indicators:
  - Local Fiat (BSD/TTD/JMD — based on jurisdiction)
  - US Dollar (USD)
  - Tether (USDT)
- [ ] Action buttons: Deposit, Convert, Send, History
- [ ] Recent transactions table:
  - Type, date, reference ID, amount, status (completed/processing)
  - Color-coded amounts (+green, -neutral)
- [ ] Export PDF for transactions
- [ ] Responsive layout (mobile sidebar collapse)

### Sprint 1.3 — Payments + Gift Cards + Admin (Days 12–21)

**Payment Module (Stripe via Blu Guruz):**

Layout follows paymentssolutionsintl.com/mockup/payments structure:
- [ ] Payment page: "Pay with your credit card"
- [ ] Three payment types: Currency Conversions, Individual Projects, Tokenized Opportunities
- [ ] Payment form: payment type selector, amount, card number, expiry, CVC
- [ ] Stripe integration: PaymentIntent creation, 3D Secure, confirmation
- [ ] Transaction status tracking (pending → completed → failed)
- [ ] Webhook handlers for Stripe events
- [ ] Payment history in dashboard

**Gift Card Module:**
- [ ] Gift card product catalog (denominations by jurisdiction)
  - Trinidad: TTD denominations, no crypto branding
  - International: USD denominations with crypto branding
- [ ] Purchase flow (select card → pay with Stripe → receive code)
- [ ] Redemption flow (enter code → wallet credit)
- [ ] Gift card management in admin panel

**Admin Panel:**
- [ ] User management (search, view, suspend)
- [ ] KYC review queue
- [ ] Transaction monitoring
- [ ] Gift card inventory
- [ ] Basic analytics (user count, transaction volume, revenue)

**Testing + Deploy:**
- [ ] Unit tests (80%+ on critical paths)
- [ ] Integration tests (auth flow, payment flow, KYC flow)
- [ ] E2E tests (Playwright: register → KYC → payment → dashboard)
- [ ] Security baseline (OWASP top 10)
- [ ] Production deployment

### Phase 1 Database Schema

```sql
-- Users & Auth
users (id, email, password_hash, role, status, jurisdiction, created_at, updated_at)
user_profiles (user_id, first_name, last_name, phone, dob, nationality, tax_id, address)

-- KYC
kyc_verifications (id, user_id, provider, status, current_step, submitted_at, reviewed_at, reviewer_id)
kyc_documents (id, verification_id, type, file_path, status, uploaded_at)

-- Wallets
wallets (id, user_id, currency, balance, type, created_at)

-- Transactions
transactions (id, user_id, type, amount, currency, status, reference, stripe_payment_id, metadata, created_at)

-- Gift Cards
gift_card_products (id, name, denomination, currency, crypto_asset, jurisdiction, status)
gift_cards (id, product_id, code, status, purchased_by, redeemed_by, purchased_at, redeemed_at)

-- Admin
audit_logs (id, user_id, action, entity, entity_id, metadata, ip_address, created_at)
```

### Phase 1 Deliverables

- [x] Landing page — Navbar + Hero section DONE (psi.ourea.tech)
- [ ] Landing page — Solutions section (prompt 2)
- [ ] Landing page — Visa card + Gift cards + Tokenization (prompt 3)
- [ ] Landing page — FAQs + Footer (prompt 4)
- [x] Public pages: B2B, Individuals, Get Started, Login
- [x] User registration + login + JWT auth
- [x] KYC/KYB portal (4-step wizard, placeholder for Sumsub)
- [x] User dashboard (balances, transactions, deposit/convert/send)
- [x] Payment processing via Stripe (Blu Guruz keys)
- [x] Gift card marketplace (dual-jurisdiction)
- [x] Admin panel (users, KYC review, transactions, gift cards)
- [x] Geo-based routing (TT, JM, BS, International)
- [x] API documentation (OpenAPI/Swagger)
- [x] Deployed to subdomain on ourea.tech

---

## PHASE 2 — Core Fintech Engine (Weeks 3–10)

> Original SOW Phase 2: Crypto rails, remittance, real wallet functionality

### Sprint 2.1 — Alt5 Integration + Wallets (Weeks 3–5)

**Backend:**
- [ ] Alt5 API client (auth, wallet CRUD, transactions, balances)
- [ ] Wallet provisioning: master wallet + sub-wallets per user
- [ ] Multi-currency balance sync (fiat + crypto)
- [ ] Asset swap engine (BTC ↔ ETH ↔ USDT ↔ USDC ↔ TRX)
- [ ] Fiat off-ramping (wallet → bank withdrawal)
- [ ] Webhook handlers for Alt5 events (deposits, withdrawals, conversions)
- [ ] Internal ledger (double-entry bookkeeping, immutable audit trail)
- [ ] API gateway layer (rate limiting, validation, logging)

**Frontend:**
- [ ] Wallet view upgrade (real balances from Alt5, per-asset breakdown)
- [ ] Deposit flow (bank transfer instructions, crypto deposit address + QR)
- [ ] Withdrawal flow (bank details form, crypto destination address)
- [ ] Asset swap UI (select from/to asset, live rate, confirm → execute)
- [ ] Enhanced transaction detail (full timeline with all status changes)

### Sprint 2.2 — Remittance + FX (Weeks 5–8)

**Backend:**
- [ ] Remittance module (send USD, GBP, EUR, CNY, TTD, JMD, BSD)
- [ ] FX engine: Hamilton Reserve Bank FX tables integration
- [ ] Currency conversion with live rates (quote → confirm → execute)
- [ ] Payment rails: fiat→crypto, crypto→fiat
- [ ] Jurisdiction-specific limits and compliance checks
- [ ] AML monitoring on all transactions (screening per transaction)
- [ ] Transaction limits module (per-user, per-day, per-currency, per-jurisdiction)

**Frontend:**
- [ ] Remittance flow (recipient → amount → currency → review → confirm)
- [ ] Recipient management (saved recipients, bank details)
- [ ] FX conversion interface (live rates, fee breakdown, estimated delivery)
- [ ] Enhanced transaction ledger (filters: currency, type, date range, status, jurisdiction)
- [ ] Export: CSV/PDF statements

### Sprint 2.3 — QA + Security (Weeks 8–10)

- [ ] Full integration test suite (Alt5 sandbox, Stripe test mode)
- [ ] Penetration testing
- [ ] Load testing (payment flows under concurrent load)
- [ ] AML screening validation
- [ ] Security audit (access controls, encryption, audit logs)
- [ ] Dashboard analytics upgrade (charts, trend visualization)
- [ ] Notification system (in-app + email for key events)
- [ ] UAT with stakeholders

### Phase 2 Database Additions

```sql
-- Alt5 Wallets
wallets ADD COLUMN alt5_wallet_id VARCHAR, type ENUM('master','sub')

-- Ledger
ledger_entries (id, wallet_id, type, amount, balance_after, reference, alt5_tx_id, created_at)

-- Remittance
recipients (id, user_id, name, bank_name, account_number, routing_number, currency, country)
remittances (id, user_id, recipient_id, send_amount, send_currency, receive_amount, receive_currency, fx_rate, fee, status, created_at)

-- FX
fx_rates (id, base_currency, quote_currency, rate, source, effective_at)
```

### Phase 2 Deliverables

- [x] Alt5 wallet integration (fiat + crypto balances, asset swaps)
- [x] Remittance module (multi-currency, multi-jurisdiction)
- [x] FX conversion with Hamilton Reserve Bank rates
- [x] Fiat↔Crypto payment rails
- [x] Double-entry ledger system
- [x] AML screening on all transactions
- [x] Security audit passed
- [x] Updated API documentation

---

## PHASE 3 — Treasury & Yield (Weeks 10–17)

> Original SOW Phase 3: Capital retention + yield products

### Sprint 3.1 — Investment Engine (Weeks 10–13)

**Backend:**
- [ ] Investment product model (term, APY, min/max deposit, lock-up period)
- [ ] Investment module (deposit into product, track earnings)
- [ ] Interest calculation engine (standard APY with quarterly dividend)
- [ ] Scheduled jobs (cron: daily accrual, quarterly dividend payout)
- [ ] Lock-up logic (enforce withdrawal conditions, early withdrawal penalties)
- [ ] Withdrawal conditions engine (maturity date, min balance, notice period)

**Frontend:**
- [ ] Investment dashboard (funds deposited, APR tracking, earnings to date)
- [ ] Product catalog (available investment products with terms/APY)
- [ ] Invest flow (select product → amount → accept terms → confirm)
- [ ] Earnings breakdown (daily accrual visualization, quarterly dividend history)
- [ ] Withdrawal request flow (check conditions → confirm → processing)

### Sprint 3.2 — Admin Treasury + Reporting (Weeks 13–15)

**Backend:**
- [ ] Admin treasury controls (product CRUD, rate adjustments)
- [ ] Risk controls (exposure limits, concentration limits per user/product)
- [ ] Immutable audit logs for all treasury operations
- [ ] Reporting module (user statements, admin summary, regulatory reports)
- [ ] Automated reconciliation engine

**Frontend:**
- [ ] Admin treasury dashboard (total AUM, per-product breakdown, risk metrics)
- [ ] Admin product management (create/edit/deactivate investment products)
- [ ] User statement generation (monthly/quarterly PDF)
- [ ] Admin reporting (CSV/PDF exports)

### Sprint 3.3 — Testing + Compliance (Weeks 15–17)

- [ ] Financial calculation validation (interest accrual accuracy)
- [ ] Compliance layer (regulatory reporting, audit trail completeness)
- [ ] E2E investment flow testing (deposit → accrue → dividend → withdraw)
- [ ] Security review (treasury authorization, access controls)
- [ ] UAT with stakeholders
- [ ] Load testing (concurrent investment operations)

### Phase 3 Database Additions

```sql
investment_products (id, name, term_days, apy, min_deposit, max_deposit, lock_up_days, status)
investments (id, user_id, product_id, principal, accrued_interest, status, start_date, maturity_date)
interest_accruals (id, investment_id, amount, balance_after, accrual_date)
dividends (id, investment_id, amount, period_start, period_end, paid_at)
withdrawal_requests (id, user_id, investment_id, amount, status, requested_at, processed_at)
treasury_balances (id, currency, total_deposited, total_withdrawn, total_interest_paid, as_of_date)
```

### Phase 3 Deliverables

- [x] Investment dashboard (deposits, APY, earnings)
- [x] Investment products with lock-up + withdrawal conditions
- [x] Quarterly dividend calculation engine
- [x] Admin treasury controls
- [x] Automated reconciliation
- [x] Risk controls + audit logs
- [x] Reporting module (user + admin)

---

## PHASE 4 — Tokenization & Mining (Weeks 17–25) — DORMANT

> Original SOW Phase 4. Per business lines doc: "This Business Line shall not be commercially activated at present."

**Build infrastructure but keep deactivated via feature flags:**

### Backend (Ready but Inactive)
- [ ] Tokenization API client abstraction layer
- [ ] Fractional ownership data models
- [ ] Secondary trading schema
- [ ] Mining allocation data models
- [ ] Mining output tracking schema
- [ ] Feature flags: `tokenization.enabled = false`, `mining.enabled = false`
- [ ] Admin toggle per jurisdiction

### Frontend (Marketing Presence Only)
- [ ] Landing page tokenization section already built (Phase 1) — "Coming Soon"
- [ ] Token portfolio UI (hidden behind feature flag)
- [ ] Mining dashboard UI (hidden behind feature flag)

### When Activated (Future)
- API integration with tokenization platform
- Fractional ownership purchases
- Secondary trading UI
- Mining capital allocation + output tracking
- ROI tracking + advanced reporting

### Phase 4 Database (Pre-built, unused)

```sql
tokenized_assets (id, name, type, total_value, token_count, token_price, status)
token_purchases (id, user_id, asset_id, token_count, price_per_token, total_cost, status)
trades (id, buyer_id, seller_id, asset_id, token_count, price_per_token, status)
orders (id, user_id, asset_id, side, token_count, price_per_token, status)
mining_operations (id, name, type, status, total_capacity)
mining_allocations (id, user_id, operation_id, amount, status)
mining_outputs (id, operation_id, date, coins_mined, hashrate, energy_cost)
coin_distributions (id, user_id, mining_output_id, amount, distributed_at)
```

---

## FINAL PHASE — Platform Unification (Weeks 25–28)

> Original SOW Final Phase: Merge environments post-licensing

- [ ] Data migration planning (per-jurisdiction user data → unified schema)
- [ ] User account merging (duplicate detection, consent-based merge)
- [ ] Feature unlocking (enable crypto UI per jurisdiction as licenses obtained)
- [ ] Compliance flag adjustments (remove geo-restrictions where licensed)
- [ ] Regression testing (all features in unified environment)
- [ ] Training documentation for PSI team
- [ ] Handover session (architecture walkthrough, ops runbook)
- [ ] Production monitoring (alerts, dashboards, incident response)

### Final Deliverables

- [x] Unified platform
- [x] Full API documentation
- [x] Database schema documentation
- [x] Security documentation
- [x] Operations runbook
- [x] Handover + training

---

## Cross-Cutting: Security, DevOps, Compliance

### Security (All Phases)
- TLS 1.3 in transit, AES-256 at rest
- RBAC: user, merchant, admin roles with granular permissions
- Immutable audit logs for every financial operation
- PCI DSS compliance (Blu Guruz/Stripe card processing)
- Dependency scanning (Snyk/Dependabot)
- Rate limiting on all public endpoints
- CSP headers, CORS, CSRF protection

### DevOps
- **CI/CD:** GitHub Actions → build → test → deploy staging → promote production
- **Infrastructure:** Terraform for AWS (ECS, RDS, ElastiCache, S3, CloudFront)
- **Monitoring:** CloudWatch + Datadog (APM, logs, alerts)
- **Environments:** local → staging → production
- **Secrets:** AWS Secrets Manager

### Compliance Checklist (Per Phase)
- [ ] KYC/KYB workflows (Sumsub when available, placeholder until then)
- [ ] AML monitoring on all transactions
- [ ] Geo-restriction logic verified per jurisdiction
- [ ] Audit logs complete and queryable
- [ ] PCI compliance validated (Stripe/Blu Guruz)
- [ ] Data retention policies
- [ ] Privacy policy + terms of service live

---

## Dependency Map

```
Phase 1 can start immediately:
  ✅ Next.js + NestJS scaffold
  ✅ Landing page (Three.js)
  ✅ Auth system (Firebase)
  ⏳ Stripe keys (Paul retrieving)
  ⏳ Design assets (Paul retrieving)
  ⏳ Alt5 credentials (not yet)
  ⏳ Sumsub (not yet)

Phase 2 blocked on:
  🔒 Alt5 Sigma API credentials
  🔒 FX rate source (Hamilton Reserve Bank)

Phase 3 blocked on:
  🔒 Investment product specifications
  🔒 APY/term definitions from PSI

Phase 4 blocked on:
  🔒 Tokenization platform selection
  🔒 Legal activation approval
```

---

## What Got Removed from v2

| Item | Reason |
|------|--------|
| Call center processing module | Cancelled by Paul |
| Call center dashboard | Cancelled |
| Merchant acquiring (call center variant) | Cancelled |
| POS hardware deployment | Deferred — confirm later |
| Per-jurisdiction banking settlement | Deferred — confirm later |
| Compliance counsel integration | Future |

---

*This plan supersedes v2. Locked to original SOW phases 1–4 + Final. Ready for Phase 1 kickoff when Paul gives the go-ahead.*
