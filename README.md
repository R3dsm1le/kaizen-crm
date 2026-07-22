# Kaizen CRM

A calm, AI-assisted CRM for a solo digital transformation consultancy.

> Everything is visible. Nothing is complicated.

Kaizen automates consulting lead management from discovery to closing: find leads, research them with AI, score them, generate personalized outreach, send emails, follow up automatically and track every interaction — all with **free services only**.

## Stack

Next.js 15 · React 19 · TypeScript · TailwindCSS 4 · shadcn-style UI · Drizzle ORM · Supabase (Postgres + Auth) · Zod · React Hook Form · Gemini (optional) · SMTP/Resend (optional) · Vercel

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 — a first-run screen asks for a Postgres connection string (create a free project at [supabase.com](https://supabase.com), copy Project Settings → Database → Connection string). Tables are created automatically. **No env editing required.**

Everything else — Gemini API key (free at aistudio.google.com), SMTP or Resend for sending, IMAP for reply detection, Google Places / website list / Apollo for lead discovery — is configured inside the app at **Settings**. Every integration is optional; the CRM works without any of them.

Env vars still work and take priority (see `.env.example`): `DATABASE_URL`, plus optional `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to gate the app behind a login (run `db/rls.sql` in the Supabase SQL editor if you use the API keys elsewhere) and `CRON_SECRET`.

## Apps

- **Windows (.exe)** — `npm run desktop:build` produces a portable exe and a one-click installer in `dist-desktop/` (Electron shell around the bundled server). First run shows the same in-app database setup. The **Build Windows EXE** GitHub Actions workflow builds these in the cloud on demand or on a `v*` tag.
- **Android (.apk)** — deploy the app first (e.g. Vercel), then run the **Build Android APK** workflow with your deployment URL; it produces `app-debug.apk` (a Capacitor shell that loads your instance). Requires no local Android SDK.
- **PWA** — the app ships a web manifest, so any phone or desktop browser can "Add to Home Screen / Install" directly from your deployed URL — often the simplest mobile option.

## Architecture

```
UI (app/, features/, components/)
  ↓ server actions (app/actions/)
Services (services/)          ← all business logic
  ↓ interfaces
Provider adapters (providers/) ← swappable: Gemini, SMTP, Resend, IMAP,
  ↓                              Google Maps, website scraper, CSV, Apollo
Database (db/, Drizzle + Postgres)
```

- **Services** own every business capability (`LeadDiscoveryService`, `CompanyResearchService`, `OutreachGenerationService`, `FollowUpService`, …). They are stateless and identical whether triggered from the UI, the Automation Center or cron.
- **Providers** hide vendors behind interfaces (`AIProvider`, `EmailProvider`, `LeadProvider`, `InboxProvider`). Adding a new lead source or LLM never touches the CRM.
- **Jobs** (`jobs/`) are thin wrappers that only call services. `/api/cron` runs every 15 minutes (see `vercel.json`); the `AutomationService` decides what is actually due based on each automation's schedule, pause state and daily limit.

## Pipeline

Lead Found → Research → Qualified → Outreach Ready → Email Sent → Waiting → Replied → Meeting Scheduled → Proposal Sent → Won / Lost

Follow-ups stop automatically on reply, won or lost.

## Keyboard

- `⌘K / Ctrl+K` — global search (companies, contacts, emails, activity)
- `/` — focus list search
- `n` — new lead
- `⌘Enter` — save note

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run db:generate` | generate SQL migration from schema changes |
| `npm run db:migrate` | apply migrations |
| `npm run db:studio` | browse the database |

## Deploying to Vercel

Import the repo, set `DATABASE_URL` (+ optional vars from `.env.example`), deploy. The cron schedule in `vercel.json` is picked up automatically; set `CRON_SECRET` to protect the endpoint. Prefer another scheduler (GitHub Actions, cron-job.org, crontab)? Point it at `GET /api/cron` with `Authorization: Bearer <CRON_SECRET>`.
