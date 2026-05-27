# SCOPE OF WORK — PSI (Payment Solutions International) Web Platform

**Document Version:** 1.0  
**Date:** May 25, 2026  
**Status:** BINDING — Defines contractual deliverables  
**Client:** Payment Solutions International (PSI)  
**Development Entity:** Shailendra Ramlogan (via Blu Guruz)  
**Platform Domains:** psi.ourea.tech (public), psi-panel.ourea.tech (admin)

---

## 1. PROJECT OVERVIEW

Payment Solutions International (PSI) requires a full-stack fintech web platform providing on-ramp/off-ramp liquidity services across fiat and stablecoins. The platform serves B2B and individual users across multiple Caribbean and international jurisdictions (Trinidad & Tobago, Jamaica, Bahamas, International).

The platform will be built in four phases plus a final unification phase, with Phase 4 (Tokenization & Mining) delivered as dormant infrastructure only — not commercially activated.

**Blu Guruz** is the entity whose Stripe merchant account will be used for card processing. This is not a separate platform — it is the payment processing vehicle.

---

## 2. TECHNOLOGY STACK

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14+ (App Router) |
| 3D Rendering | Three.js / React Three Fiber |
| Animation | Framer Motion + GSAP |
| Backend API | NestJS |
| Database | PostgreSQL |
| Cache / Queue | Redis + BullMQ |
| Authentication | Firebase Auth + Custom JWT |
| Card Processing | Stripe (via Blu Guruz account) |
| Crypto Rails | Alt5 Sigma API |
| KYC/KYB Verification | Sumsub (integration-ready) |
| Cloud Infrastructure | AWS (ECS + RDS + ElastiCache + S3 + CloudFront) |
| CI/CD | GitHub Actions |
| Infrastructure-as-Code | Terraform |
| Monitoring | CloudWatch + Datadog |

---

## 3. DELIVERABLES BY PHASE

### PHASE 1 — Foundation (Weeks 0–3)

#### 3.1.1 Landing Page & Public Website

**Status: COMPLETED ✅** (Live at psi.ourea.tech)

The following sections have been built and deployed:

| Section | Description | Status |
|---------|-------------|--------|
| Navbar | PSI logo, B2B link, Individuals link, Login, Get Started CTA | ✅ Complete |
| Hero | Three.js 3D globe with atmospheric shells, financial routing network (15 hub cities, 23 transaction routes, animated pulses), floating UI panels (FX Conversion, TX Confirmed, Liquidity Pool, 24H Volume, Live Transfer, Stablecoin Route), cursor-reactive | ✅ Complete |
| Industry Solutions | 12 borderless cards (Import & Export, Supply Chain, Manufacturing, Hardware, Finance & Fintech, Real Estate, Construction, Casino & Gaming, E-commerce, Retail, Investments, Personalized Liquidity), cursor spotlight effect | ✅ Complete |
| Dashboard Preview | Cinematic angled frame with holographic shimmer, floating metrics overlay | ✅ Complete |
| Visa Rail Card | CSS 3D silver card render, metallic shimmer, cursor tilt, randomized card number | ✅ Complete |
| Gift Cards | Three.js crypto gift card showcase (BTC, ETH, USDT, TRX, USDC), cinematic slideshow with edge fade gradients, ambient glow layers | ✅ Complete |
| Tokenization | CSS beachfront hotel scene, investment overlays, mini charts, "Coming Soon" badge | ✅ Complete |
| FAQs | Accordion dropdown, glassmorphism styling, one-open-at-a-time behavior | ✅ Complete |
| Footer | Enterprise-grade, legal disclaimers, social icons, compliance badges | ✅ Complete |

#### 3.1.2 Additional Public Pages

| Page | Description | Status |
|------|-------------|--------|
| `/b2b` | Expanded B2B on-ramp/off-ramp service descriptions | 🔲 Pending |
| `/individuals` | Individual user use case descriptions | 🔲 Pending |
| `/get-started` | Qualification funnel (Business or Individual → Services → KYC portal) | 🔲 Pending |
| `/login` | Authentication entry point → dashboard | 🔲 Pending |

#### 3.1.3 Authentication System

| Feature | Description | Status |
|---------|-------------|--------|
| User Registration | Email + password signup | 🔲 Pending |
| Login / Logout | JWT-based authentication with refresh tokens | 🔲 Pending |
| Password Reset | Email-based reset flow | 🔲 Pending |
| Email Verification | Verification link on registration | 🔲 Pending |
| Role Assignment | Individual, Business, Admin roles with RBAC | 🔲 Pending |
| Geo/IP Detection | Auto-detect jurisdiction (TT, JM, BS, International) | 🔲 Pending |

#### 3.1.4 KYC/KYB Portal

| Feature | Description | Status |
|---------|-------------|--------|
| 4-Step Individual KYC Wizard | Personal Info → Identity Verification → Address Verification → Review & Submit | 🔲 Pending |
| KYB Business Variant | Business Info → Directors → Documents → Review | 🔲 Pending |
| Document Upload | File upload with preview (government ID, proof of address) | 🔲 Pending |
| KYC Package Export | ZIP export for compliance | 🔲 Pending |
| Admin Review Queue | Approve/reject with notes | 🔲 Pending |
| Sumsub Integration Point | Abstract verification layer — Sumsub drops in when credentials provided | 🔲 Pending |

#### 3.1.5 User Dashboard

| Feature | Description | Status |
|---------|-------------|--------|
| Sidebar Navigation | Home, Dashboard, Payments, KYC Portal | 🔲 Pending |
| Balance Cards | Local Fiat (BSD/TTD/JMD), USD, USDT with % change indicators | 🔲 Pending |
| Action Buttons | Deposit, Convert, Send, History | 🔲 Pending |
| Transaction Table | Type, date, reference ID, amount, status — color-coded | 🔲 Pending |
| PDF Export | Transaction history export | 🔲 Pending |
| Responsive Layout | Mobile sidebar collapse | 🔲 Pending |

#### 3.1.6 Payment Processing (Stripe)

| Feature | Description | Status |
|---------|-------------|--------|
| Payment Page | "Pay with your credit card" with 3 payment types (Currency Conversions, Individual Projects, Tokenized Opportunities) | 🔲 Pending |
| Payment Form | Card number, expiry, CVC with real-time validation | 🔲 Pending |
| Stripe Integration | PaymentIntent creation, 3D Secure, confirmation | 🔲 Pending |
| Transaction Tracking | Pending → Completed → Failed state machine | 🔲 Pending |
| Webhook Handlers | Stripe event processing | 🔲 Pending |
| Payment History | Integrated into dashboard | 🔲 Pending |

#### 3.1.7 Gift Card Marketplace

| Feature | Description | Status |
|---------|-------------|--------|
| Product Catalog | Denominations by jurisdiction (TTD for Trinidad, USD International with crypto branding) | 🔲 Pending |
| Purchase Flow | Select card → pay via Stripe → receive redemption code | 🔲 Pending |
| Redemption Flow | Enter code → wallet credit | 🔲 Pending |
| Admin Inventory | Gift card stock management | 🔲 Pending |

#### 3.1.8 Admin Panel

| Feature | Description | Status |
|---------|-------------|--------|
| User Management | Search, view, suspend users | 🔲 Pending |
| KYC Review Queue | Approve/reject submissions with notes | 🔲 Pending |
| Transaction Monitoring | Real-time transaction oversight | 🔲 Pending |
| Gift Card Inventory | Stock management and reporting | 🔲 Pending |
| Basic Analytics | User count, transaction volume, revenue metrics | 🔲 Pending |

#### 3.1.9 Project Infrastructure

| Item | Description | Status |
|------|-------------|--------|
| Monorepo Setup | `apps/web` (Next.js), `apps/api` (NestJS), `packages/shared` | 🔲 Pending |
| PostgreSQL Schema v1 | Users, transactions, kyc, gift_cards, wallets tables | 🔲 Pending |
| Docker Compose | Local development environment | 🔲 Pending |
| CI/CD Pipeline | GitHub Actions (build → test → deploy) | 🔲 Pending |
| Staging Deployment | psi.ourea.tech + psi-panel.ourea.tech | 🔲 Pending |

#### 3.1.10 Phase 1 Database Schema

```sql
users (id, email, password_hash, role, status, jurisdiction, created_at, updated_at)
user_profiles (user_id, first_name, last_name, phone, dob, nationality, tax_id, address)
kyc_verifications (id, user_id, provider, status, current_step, submitted_at, reviewed_at, reviewer_id)
kyc_documents (id, verification_id, type, file_path, status, uploaded_at)
wallets (id, user_id, currency, balance, type, created_at)
transactions (id, user_id, type, amount, currency, status, reference, stripe_payment_id, metadata, created_at)
gift_card_products (id, name, denomination, currency, crypto_asset, jurisdiction, status)
gift_cards (id, product_id, code, status, purchased_by, redeemed_by, purchased_at, redeemed_at)
audit_logs (id, user_id, action, entity, entity_id, metadata, ip_address, created_at)
```

---

### PHASE 2 — Core Fintech Engine (Weeks 3–10)

#### 3.2.1 Alt5 Integration & Wallets

| Feature | Description | Status |
|---------|-------------|--------|
| Alt5 API Client | Authentication, wallet CRUD, transactions, balances | 🔲 Pending |
| Wallet Provisioning | Master wallet + per-user sub-wallets | 🔲 Pending |
| Multi-Currency Sync | Real-time fiat + crypto balance sync | 🔲 Pending |
| Asset Swap Engine | BTC ↔ ETH ↔ USDT ↔ USDC ↔ TRX conversion | 🔲 Pending |
| Fiat Off-Ramping | Wallet → bank withdrawal | 🔲 Pending |
| Alt5 Webhooks | Deposit, withdrawal, conversion event handlers | 🔲 Pending |
| Internal Ledger | Double-entry bookkeeping, immutable audit trail | 🔲 Pending |
| API Gateway | Rate limiting, validation, logging | 🔲 Pending |

**Frontend Wallet Features:**

| Feature | Description | Status |
|---------|-------------|--------|
| Wallet View | Real balances from Alt5, per-asset breakdown | 🔲 Pending |
| Deposit Flow | Bank transfer instructions + crypto deposit address with QR code | 🔲 Pending |
| Withdrawal Flow | Bank details form + crypto destination address | 🔲 Pending |
| Asset Swap UI | Select from/to asset, live rate display, confirm → execute | 🔲 Pending |
| Enhanced Transaction Detail | Full timeline with all status changes | 🔲 Pending |

#### 3.2.2 Remittance & FX

| Feature | Description | Status |
|---------|-------------|--------|
| Remittance Module | Send USD, GBP, EUR, CNY, TTD, JMD, BSD | 🔲 Pending |
| FX Engine | Hamilton Reserve Bank FX tables integration | 🔲 Pending |
| Live Currency Conversion | Quote → Confirm → Execute with live rates | 🔲 Pending |
| Payment Rails | Fiat→crypto and crypto→fiat bridges | 🔲 Pending |
| Jurisdiction Compliance | Per-jurisdiction limits and compliance checks | 🔲 Pending |
| AML Monitoring | Per-transaction anti-money laundering screening | 🔲 Pending |
| Transaction Limits | Per-user, per-day, per-currency, per-jurisdiction | 🔲 Pending |

**Frontend Remittance Features:**

| Feature | Description | Status |
|---------|-------------|--------|
| Remittance Flow | Recipient → Amount → Currency → Review → Confirm | 🔲 Pending |
| Recipient Management | Saved recipients with bank details | 🔲 Pending |
| FX Conversion Interface | Live rates, fee breakdown, estimated delivery | 🔲 Pending |
| Enhanced Transaction Ledger | Filters: currency, type, date range, status, jurisdiction | 🔲 Pending |
| Statement Export | CSV and PDF exports | 🔲 Pending |

#### 3.2.3 QA & Security

| Item | Description | Status |
|------|-------------|--------|
| Integration Tests | Alt5 sandbox + Stripe test mode | 🔲 Pending |
| Penetration Testing | External security assessment | 🔲 Pending |
| Load Testing | Concurrent payment flow testing | 🔲 Pending |
| AML Validation | Screening accuracy verification | 🔲 Pending |
| Security Audit | Access controls, encryption, audit logs | 🔲 Pending |
| Dashboard Analytics | Charts and trend visualization | 🔲 Pending |
| Notification System | In-app + email for key events | 🔲 Pending |
| UAT | Stakeholder acceptance testing | 🔲 Pending |

#### 3.2.4 Phase 2 Database Additions

```sql
wallets ADD COLUMN alt5_wallet_id VARCHAR, type ENUM('master','sub')
ledger_entries (id, wallet_id, type, amount, balance_after, reference, alt5_tx_id, created_at)
recipients (id, user_id, name, bank_name, account_number, routing_number, currency, country)
remittances (id, user_id, recipient_id, send_amount, send_currency, receive_amount, receive_currency, fx_rate, fee, status, created_at)
fx_rates (id, base_currency, quote_currency, rate, source, effective_at)
```

---

### PHASE 3 — Treasury & Yield (Weeks 10–17)

#### 3.3.1 Investment Engine

| Feature | Description | Status |
|---------|-------------|--------|
| Investment Products | Configurable term, APY, min/max deposit, lock-up period | 🔲 Pending |
| Investment Module | Deposit into product, track earnings | 🔲 Pending |
| Interest Calculation | Standard APY with quarterly dividend | 🔲 Pending |
| Scheduled Jobs | Daily accrual, quarterly dividend payout (cron) | 🔲 Pending |
| Lock-up Logic | Withdrawal conditions, early withdrawal penalties | 🔲 Pending |
| Withdrawal Engine | Maturity date, min balance, notice period enforcement | 🔲 Pending |

**Frontend Investment Features:**

| Feature | Description | Status |
|---------|-------------|--------|
| Investment Dashboard | Funds deposited, APR tracking, earnings to date | 🔲 Pending |
| Product Catalog | Available investment products with terms/APY | 🔲 Pending |
| Invest Flow | Select product → Amount → Accept terms → Confirm | 🔲 Pending |
| Earnings Breakdown | Daily accrual visualization, quarterly dividend history | 🔲 Pending |
| Withdrawal Request | Check conditions → Confirm → Processing | 🔲 Pending |

#### 3.3.2 Admin Treasury & Reporting

| Feature | Description | Status |
|---------|-------------|--------|
| Treasury Controls | Product CRUD, rate adjustments | 🔲 Pending |
| Risk Controls | Exposure limits, concentration limits per user/product | 🔲 Pending |
| Treasury Audit Logs | Immutable logs for all treasury operations | 🔲 Pending |
| Reporting Module | User statements, admin summary, regulatory reports | 🔲 Pending |
| Reconciliation Engine | Automated financial reconciliation | 🔲 Pending |

**Frontend Admin Features:**

| Feature | Description | Status |
|---------|-------------|--------|
| Treasury Dashboard | Total AUM, per-product breakdown, risk metrics | 🔲 Pending |
| Product Management | Create/edit/deactivate investment products | 🔲 Pending |
| User Statements | Monthly/quarterly PDF generation | 🔲 Pending |
| Admin Reporting | CSV/PDF exports for all financial data | 🔲 Pending |

#### 3.3.3 Phase 3 Testing

| Item | Description | Status |
|------|-------------|--------|
| Financial Validation | Interest accrual accuracy verification | 🔲 Pending |
| Compliance Layer | Regulatory reporting, audit trail completeness | 🔲 Pending |
| E2E Investment Testing | Deposit → Accrue → Dividend → Withdraw | 🔲 Pending |
| Security Review | Treasury authorization and access controls | 🔲 Pending |
| Load Testing | Concurrent investment operations | 🔲 Pending |
| UAT | Stakeholder acceptance testing | 🔲 Pending |

#### 3.3.4 Phase 3 Database Additions

```sql
investment_products (id, name, term_days, apy, min_deposit, max_deposit, lock_up_days, status)
investments (id, user_id, product_id, principal, accrued_interest, status, start_date, maturity_date)
interest_accruals (id, investment_id, amount, balance_after, accrual_date)
dividends (id, investment_id, amount, period_start, period_end, paid_at)
withdrawal_requests (id, user_id, investment_id, amount, status, requested_at, processed_at)
treasury_balances (id, currency, total_deposited, total_withdrawn, total_interest_paid, as_of_date)
```

---

### PHASE 4 — Tokenization & Mining (Weeks 17–25) — DORMANT

> **Per business lines directive: "This Business Line shall not be commercially activated at present."**  
> Infrastructure will be built and feature-flagged OFF. No commercial activation.

#### 3.4.1 Backend (Ready but Inactive)

| Feature | Description | Status |
|---------|-------------|--------|
| Tokenization API Abstraction | Client layer for future platform integration | 🔲 Pending |
| Fractional Ownership Models | Data models for tokenized assets | 🔲 Pending |
| Secondary Trading Schema | Buy/sell order matching schema | 🔲 Pending |
| Mining Allocation Models | Capital allocation data models | 🔲 Pending |
| Mining Output Tracking | Hashrate, coins mined, energy cost tracking | 🔲 Pending |
| Feature Flags | `tokenization.enabled = false`, `mining.enabled = false` | 🔲 Pending |
| Admin Jurisdiction Toggle | Per-jurisdiction activation controls | 🔲 Pending |

#### 3.4.2 Frontend (Marketing Presence Only)

| Feature | Description | Status |
|---------|-------------|--------|
| Landing Page Section | Already built in Phase 1 — "Coming Soon" badge | ✅ Complete |
| Token Portfolio UI | Hidden behind feature flag | 🔲 Pending |
| Mining Dashboard UI | Hidden behind feature flag | 🔲 Pending |

#### 3.4.3 Phase 4 Database (Pre-built, Unused)

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

### FINAL PHASE — Platform Unification (Weeks 25–28)

| Deliverable | Description | Status |
|-------------|-------------|--------|
| Data Migration Planning | Per-jurisdiction user data → unified schema | 🔲 Pending |
| User Account Merging | Duplicate detection, consent-based merge | 🔲 Pending |
| Feature Unlocking | Enable crypto UI per jurisdiction as licenses obtained | 🔲 Pending |
| Compliance Flag Adjustments | Remove geo-restrictions where licensed | 🔲 Pending |
| Regression Testing | All features in unified environment | 🔲 Pending |
| Training Documentation | Architecture walkthroughs for PSI team | 🔲 Pending |
| Handover Session | Architecture walkthrough + ops runbook review | 🔲 Pending |
| Production Monitoring | Alerts, dashboards, incident response setup | 🔲 Pending |

---

## 4. CROSS-CUTTING REQUIREMENTS

### 4.1 Security

- TLS 1.3 for all data in transit
- AES-256 encryption at rest
- Role-Based Access Control (user, merchant, admin) with granular permissions
- Immutable audit logs for every financial operation
- PCI DSS compliance via Blu Guruz/Stripe card processing
- Dependency scanning (Snyk/Dependabot)
- Rate limiting on all public API endpoints
- CSP headers, CORS, CSRF protection

### 4.2 DevOps & Infrastructure

- **CI/CD:** GitHub Actions → Build → Test → Deploy staging → Promote production
- **Infrastructure:** Terraform for AWS (ECS, RDS, ElastiCache, S3, CloudFront)
- **Monitoring:** CloudWatch + Datadog (APM, logs, alerts)
- **Environments:** Local → Staging → Production
- **Secrets Management:** AWS Secrets Manager

### 4.3 Compliance (All Phases)

- KYC/KYB workflows (Sumsub when available, placeholder until then)
- AML monitoring on all transactions
- Geo-restriction logic verified per jurisdiction
- Audit logs complete and queryable
- PCI compliance validated (Stripe/Blu Guruz)
- Data retention policies implemented
- Privacy policy + terms of service live

---

## 5. EXPLICITLY OUT OF SCOPE

The following items were originally considered but have been **removed from this engagement**:

| Item | Reason |
|------|--------|
| Call center processing module | Cancelled by client |
| Call center dashboard | Cancelled by client |
| Merchant acquiring (call center variant) | Cancelled by client |
| POS hardware deployment | Deferred — to be confirmed separately |
| Per-jurisdiction banking settlement | Deferred — to be confirmed separately |
| Compliance counsel integration | Future engagement |
| Tokenization commercial activation | Dormant per business lines directive |
| Mining commercial activation | Dormant per business lines directive |

---

## 6. CLIENT-PROVIDED REQUIREMENTS

The following must be provided by PSI/Client for development to proceed on dependent features:

| Item | Blocks Phase | Status |
|------|-------------|--------|
| Stripe API keys (Blu Guruz account) | Phase 1 (Payments) | ⏳ Pending |
| Alt5 Sigma API credentials | Phase 2 (Crypto rails) | ⏳ Pending |
| FX rate source (Hamilton Reserve Bank) | Phase 2 (FX engine) | ⏳ Pending |
| Sumsub credentials | Phase 1 (KYC) | ⏳ Pending |
| Investment product specifications (APY, terms) | Phase 3 (Treasury) | ⏳ Pending |
| Final design assets (logos, imagery) | Phase 1 (Landing) | ⏳ Pending |
| Visa rail card issuer integration details | Future | Not discussed |
| Tokenization platform selection | Phase 4 activation | Future |
| Legal activation approval (tokenization/mining) | Phase 4 activation | Future |

Delays in providing these items will extend the corresponding phase timelines proportionally.

---

## 7. TIMELINE

| Phase | Duration | Calendar | Key Milestone |
|-------|----------|----------|---------------|
| Phase 1 — Foundation | 3 weeks | Weeks 0–3 | Landing page live + Auth + KYC + Payments + Dashboard + Admin |
| Phase 2 — Core Fintech | 7 weeks | Weeks 3–10 | Alt5 wallets + Remittance + FX + AML + Security audit |
| Phase 3 — Treasury & Yield | 7 weeks | Weeks 10–17 | Investment engine + Treasury controls + Reporting |
| Phase 4 — Tokenization (Dormant) | 8 weeks | Weeks 17–25 | Feature-flagged infrastructure built, not activated |
| Final — Unification | 3 weeks | Weeks 25–28 | Platform merge + Training + Handover |
| **Total** | **28 weeks** | | |

> **Note:** Phase start dates are contingent on client-provided dependencies (Section 6). Phase 1 is unblocked and can begin immediately.

---

## 8. ACCEPTANCE CRITERIA

Each phase will be considered delivered when:

1. **All features** listed in the phase deliverables section are functional in the staging environment
2. **Testing** has been completed per the QA items listed for that phase
3. **Client UAT** sign-off is obtained for the phase
4. **Documentation** for that phase is delivered (API docs, schema docs, security docs as applicable)
5. **Deployment** to production is completed (or staging for client review)

---

## 9. CHANGE ORDER PROCESS

Any modifications to this scope must be documented in writing and will be handled through a formal change order process:

1. Change request submitted (either party)
2. Impact assessment (timeline, cost, dependencies)
3. Written approval by both parties
4. Updated SOW document version

Minor clarifications that do not alter deliverables, timeline, or dependencies do not require a formal change order.

---

## 10. INTELLECTUAL PROPERTY & OWNERSHIP

- All source code, designs, and documentation produced under this engagement are the property of PSI (Payment Solutions International)
- Third-party licenses (npm packages, fonts, stock assets) remain subject to their respective licenses
- Client is responsible for ongoing maintenance after handover

---

## 11. SIGN-OFF

By signing below, both parties agree to the scope, deliverables, timeline, and terms outlined in this document.

**Client — Payment Solutions International**

Name: ___________________________

Title: ___________________________

Signature: _______________________ Date: ___________

---

**Developer — Shailendra Ramlogan**

Name: Shailendra Ramlogan

Title: Lead Developer

Signature: _______________________ Date: ___________

---

*This document supersedes all prior versions, conversations, and informal agreements regarding the PSI platform scope. The development plan (DEVELOPMENT-PLAN.md v3) serves as the technical reference; this document is the binding scope.*
