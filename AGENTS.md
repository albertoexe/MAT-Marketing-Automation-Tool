# CRM App — Agent Context

A unified Marketing & Sales automation platform: CRM, lead management, dynamic lead scoring, lifecycle automation, sales pipeline, and Outlook integration. Built for a 5-person internal team — 2 Marketing users, 3 Sales users.

Read the full project brief in the vault:
`C:\Users\AlbertoDeCol\Il mio Drive\Second Brain\Second Brain\03 Projects\CRM\AGENTS.md`

---

## Stack

| Layer | Choice |
|---|---|
| Packaging | Electron |
| Frontend | React + TypeScript + TailwindCSS |
| Build tool | electron-vite |
| Database / Auth / Realtime | Supabase |
| Automation | Supabase Edge Functions + pg_cron |
| Distribution | GitHub Releases |

## Folder Structure

```
crm-app/
├── src/
│   ├── main/              ← Electron main process
│   ├── preload/           ← Preload scripts (contextBridge)
│   └── renderer/
│       └── src/
│           ├── assets/    ← Global CSS (Tailwind)
│           ├── components/← Shared UI components
│           ├── features/  ← Feature modules (contacts, scoring, pipeline, auth...)
│           ├── pages/     ← Top-level page components
│           └── lib/       ← Supabase client, utilities
├── resources/             ← App icons, static assets
├── AGENTS.md              ← You are here
├── CLAUDE.md              ← Claude Code behavior layer
├── .env                   ← Supabase keys (not committed)
└── .env.example           ← Template for env vars
```

## Rules

- TypeScript + Zod everywhere — no implicit `any`
- Modular architecture — keep features isolated (contacts, scoring, pipeline, automation, auth)
- Event-driven for scoring updates, automation triggers, and notifications
- `(C)` prefix on AI-generated files
- Ask before editing files without `(C)` prefix
- Minimal footprint — only touch files relevant to current task

## MVP Phases

1. **Phase 1 — Foundations:** Auth (Supabase), Contact CRUD, Lead Scoring Engine
2. **Phase 2 — Automation:** Lifecycle automation, SQL handoff, Notifications
3. **Phase 3 — Integrations:** Sales Pipeline (Kanban), Outlook (light), Reporting
4. **Phase 4 — Polish:** GitHub Release build, installer, QA
