# 30-Day Development Checklist - Swiss Tenant Assistant MVP v1

## Audit Status - 2026-06-16

- Foundation is in place: Nuxt 4 + TypeScript + Pinia + Tailwind + shadcn-vue + i18n + Zod + Nitro API.
- Backend baseline is in place: MySQL + Drizzle schema/migrations + env setup + product seed.
- Implemented product pieces: auth flows, route protection, landing/app shell/dashboard UI, document upload/download/delete, PDF text extraction, OCR for image uploads, extraction persistence.
- Main gaps remain: normalization/structured extraction, rule engine, AI integration, check pipelines, payments, emails, reports, admin panel, deployment hardening, automated tests.
- Checklist corrections in this audit:
  - Day 4 and Day 5 schema blocks are complete in code.
  - Day 12 OCR fallback for textless PDFs is not complete yet; current code detects textless PDFs but returns `501` for PDF OCR fallback.

## Week 1

### Day 1
- [x] Finalize MVP v1 scope
- [ ] Confirm launch languages: `DE` or `DE + EN`
- [x] Confirm monetization: `pay-per-use`
- [x] Confirm product list:
  - [x] `Nebenkosten Check`
  - [x] `Mietvertrag Check`
  - [x] `Letter`
- [x] Confirm disclaimer text
- [x] Confirm consent texts
- [x] Confirm first release user flows

### Day 2
- [x] Initialize `Nuxt 4` project
- [x] Configure `TypeScript`
- [x] Configure `Pinia`
- [x] Configure `Tailwind CSS`
- [x] Configure `shadcn-vue`
- [x] Configure `@nuxtjs/i18n`
- [x] Configure `Zod`
- [x] Configure `Nitro Server API`
- [x] Create base folder structure

### Day 3
- [x] Set up `MySQL`
- [x] Set up `Drizzle ORM`
- [x] Set up `drizzle-kit`
- [x] Create `.env.example`
- [x] Configure local env loading
- [x] Create DB connection layer
- [x] Test local DB connectivity

### Day 4
- [x] Implement schema:
  - [x] `users`
  - [x] `user_sessions`
  - [x] `cases`
  - [x] `documents`
  - [x] `document_extractions`
  - [x] `checks`
  - [x] `check_documents`
- [x] Add indexes and foreign keys

### Day 5
- [x] Implement schema:
  - [x] `rule_findings`
  - [x] `ai_runs`
  - [x] `letters`
  - [x] `reports`
  - [x] `products`
  - [x] `payments`
  - [x] `email_messages`
  - [x] `signed_links`
- [x] `audit_logs`
- [x] `system_errors`
- [x] Generate first migration
- [x] Run migration from clean DB
- [x] Seed MVP products

## Week 2

### Day 6
- [x] Implement registration API
- [x] Implement login API
- [x] Implement logout API
- [x] Add password hashing
- [x] Add session/token persistence
- [x] Add role handling: `user`, `admin`

### Day 7
- [x] Implement forgot password flow
- [x] Implement reset password flow
- [x] Store consent timestamps
- [x] Protect authenticated routes
- [x] Protect admin routes
- [x] Test auth end-to-end

### Day 8
- [x] Build base app shell
- [x] Build auth pages
- [x] Build dashboard skeleton
- [x] Add route guards
- [x] Add basic navigation
- [x] Add locale switcher if included in MVP

### Day 9
- [x] Implement document upload API
- [x] Validate file type
- [x] Validate file extension
- [x] Validate file size
- [x] Save files to `storage/uploads`
- [x] Save metadata to `documents`

### Day 10
- [x] Implement document detail endpoint
- [x] Implement document delete endpoint
- [x] Implement signed download link generation
- [x] Implement secure file download endpoint
- [x] Add audit logs for upload/download/delete
- [x] Test upload/download/delete flow

## Week 3

### Day 11
- [x] Integrate `pdf-parse` or `pdfjs-dist`
- [x] Implement text extraction from PDF
- [x] Save extraction result to `document_extractions`
- [x] Define extraction status transitions
- [x] Test extraction on text-based PDFs

### Day 12
- [x] Integrate `Tesseract.js`
- [x] Detect scanned/textless PDFs
- [ ] Implement OCR fallback
- [x] Save OCR results
- [x] Compare extraction vs OCR output quality
- [ ] Test scanned PDF flow

### Day 13
- [ ] Implement text normalization
- [ ] Define structured extraction JSON shape
- [ ] Extract basic entities:
  - [ ] dates
  - [ ] amounts
  - [ ] contract values
  - [ ] expense positions
- [ ] Store structured extraction results

### Day 14
- [ ] Create rule engine module
- [ ] Define common rule interfaces
- [ ] Define finding structure
- [ ] Define risk score strategy
- [ ] Implement persistence of findings in `rule_findings`

### Day 15
- [ ] Implement `Nebenkosten` rules
- [ ] Add suspicious keyword detection
- [ ] Add contract mismatch checks
- [ ] Add previous-year comparison logic
- [ ] Add anomaly detection
- [ ] Test rule engine on sample Nebenkosten documents

## Week 4

### Day 16
- [ ] Implement `Mietvertrag` rules
- [ ] Add deposit > 3 months check
- [ ] Add Nebenkosten clarity checks
- [ ] Add Kündigungsfrist checks
- [ ] Add clause-risk checks
- [ ] Test rule engine on sample contracts

### Day 17
- [ ] Integrate `OpenAI API`
- [ ] Implement AI service wrapper
- [ ] Create prompt for `summary`
- [ ] Create prompt for `recommendations`
- [ ] Define structured JSON response validation
- [ ] Log calls to `ai_runs`

### Day 18
- [ ] Add AI prompt for `letter_generation`
- [ ] Add AI failure fallback
- [ ] Add disclaimer injection
- [ ] Add safe error handling for AI failures
- [ ] Test AI outputs on sample extracted data

### Day 19
- [ ] Build `Nebenkosten Checker` backend flow
- [ ] Create `case` on check start
- [ ] Create `check`
- [ ] Link uploaded docs via `check_documents`
- [ ] Run extraction -> rules -> AI summary pipeline
- [ ] Persist results in `checks`

### Day 20
- [ ] Build `Nebenkosten Checker` frontend flow
- [ ] Create upload form
- [ ] Show processing state
- [ ] Show pre-payment result preview
- [ ] Show findings and score
- [ ] Test module end-to-end

## Week 5

### Day 21
- [ ] Build `Mietvertrag Checker` backend flow
- [ ] Create contract analysis pipeline
- [ ] Persist extracted clauses
- [ ] Run rules + AI explanation
- [ ] Save final result to `checks`

### Day 22
- [ ] Build `Mietvertrag Checker` frontend flow
- [ ] Create upload form
- [ ] Show extracted contract summary
- [ ] Show risk list
- [ ] Show pre-payment result preview
- [ ] Test module end-to-end

### Day 23
- [ ] Define MVP letter types
- [ ] Build letter generator backend
- [ ] Generate `subject`
- [ ] Generate `body_text`
- [ ] Save records to `letters`
- [ ] Link letters to `case` / `check`

### Day 24
- [ ] Build letter generator frontend
- [ ] Build input forms for letter variables
- [ ] Add AI-assisted generation
- [ ] Add result preview
- [ ] Test standalone letter flow

### Day 25
- [ ] Integrate `pdf-lib`
- [ ] Build PDF report template
- [ ] Build PDF letter template
- [ ] Save reports to `storage/reports`
- [ ] Register generated PDFs in `documents`
- [ ] Test PDF generation for report and letter

## Week 6

### Day 26
- [ ] Integrate `Stripe Checkout`
- [ ] Create checkout session endpoint
- [ ] Create payment records in `payments`
- [ ] Implement payment gating for checks/letters
- [ ] Test checkout creation

### Day 27
- [ ] Implement `Stripe Webhook`
- [ ] Verify webhook signatures
- [ ] Update payment statuses
- [ ] Unlock report/letter after successful payment
- [ ] Handle failed/expired payment states
- [ ] Test payment flow end-to-end

### Day 28
- [ ] Integrate `Brevo`
- [ ] Build email templates:
  - [ ] upload confirmation
  - [ ] analysis ready
  - [ ] payment receipt
  - [ ] report access link
- [ ] Log emails in `email_messages`
- [ ] Test email delivery flow

### Day 29
- [ ] Build admin panel pages:
  - [ ] Users
  - [ ] Payments
  - [ ] Checks
  - [ ] Documents
  - [ ] AI Logs
  - [ ] Errors
- [ ] Add basic filters
- [ ] Add retry/delete/inspect actions
- [ ] Test admin access control

### Day 30
- [ ] Add rate limiting
- [ ] Review signed links TTL
- [ ] Add auto-delete job for documents
- [ ] Add audit log coverage review
- [ ] Create legal pages:
  - [ ] Impressum
  - [ ] Privacy Policy
  - [ ] Terms
  - [ ] Disclaimer
  - [ ] Cookie Policy
- [ ] Run full MVP smoke test
- [ ] Fix critical launch blockers
- [ ] Prepare deployment checklist
