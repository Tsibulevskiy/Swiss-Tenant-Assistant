# Swiss Tenant Assistant

Nuxt 4 application for Swiss tenant workflows: document upload, OCR/text extraction, rule-based checks, AI summaries, letter generation, payments, email notifications, and admin operations.

## What Is Implemented

- Authentication with session-based user/admin access
- Document upload, storage, signed download links, and retention cleanup
- PDF text extraction and OCR fallback for scanned or textless PDFs
- Text normalization and structured extraction for:
  - `mietvertrag`
  - `nebenkostenabrechnung`
  - `previous_nebenkostenabrechnung`
- Rule engine with findings and weighted risk scoring for:
  - `Mietvertrag Check`
  - `Nebenkosten Check`
- AI summaries and recommendations via OpenAI Responses API with Zod-validated structured output
- Letter draft generation with PDF export
- Stripe Checkout, webhook handling, and payment-gated check results
- Brevo email integration with transactional templates
- Admin overview with retry/reprocess actions
- Rate limiting, audit logging, signed-link TTL hardening, and config validation

## Stack

- Nuxt 4
- TypeScript
- Pinia
- Tailwind CSS
- MySQL
- Drizzle ORM
- Tesseract.js
- OpenAI Responses API
- Stripe
- Brevo

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
copy .env.example .env
```

Start MySQL with Docker:

```bash
docker compose up -d mysql
docker compose ps
```

Apply database schema:

```bash
npm run db:push
```

Seed products for checkout flows:

```bash
npm run db:seed:products
```

## Environment

Minimum required variables for local development:

```env
NUXT_APP_URL=http://localhost:3000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=swiss_tenant_assistant
MYSQL_USER=sta_app
MYSQL_PASSWORD=change_me
MYSQL_ROOT_PASSWORD=change_me
NUXT_STORAGE_UPLOADS_DIR=storage/uploads
NUXT_STORAGE_REPORTS_DIR=storage/reports
```

Optional integrations:

- `NUXT_OPENAI_API_KEY`
- `NUXT_OPENAI_MODEL`
- `NUXT_STRIPE_SECRET_KEY`
- `NUXT_STRIPE_WEBHOOK_SECRET`
- `NUXT_BREVO_API_KEY`
- `NUXT_BREVO_SENDER_EMAIL`
- `NUXT_BREVO_SENDER_NAME`

Security and retention settings are also configured through `.env.example`.

## Development

Start the Nuxt dev server:

```bash
npm run dev
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm run test:rules
```

If Nuxt reports that another dev server is already running, stop the existing process or remove the stale lock in `.nuxt/nuxt.lock` only after confirming there is no active server for this repo.

## Main Application Areas

- `/documents` - upload, filters, processing status, extraction metadata preview
- `/checks` - check list, findings, risk score, payment-gated detail results
- `/letters` - draft generation, preview, saved drafts, PDF export
- `/checkout` - Stripe Checkout handoff
- `/admin` - users, payments, checks, documents, AI logs, system errors

## Current Gaps

- Integration and end-to-end test coverage is still limited
- Fixture documents exist as a structure and manifest, but the sample corpus is incomplete
- Some secondary pages are still lighter than the main `documents / checks / letters` flows

## Production Build

Build the application:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```
