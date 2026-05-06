# Claude — CRM App

You are Claude Code working on the CRM desktop app. Read `AGENTS.md` in this folder for full project context, stack, and rules.

## Behavior

- Prefix all AI-generated files with `(C)`.
- Ask before editing any file without the `(C)` prefix.
- Keep a minimal footprint — only touch files relevant to the current task.
- TypeScript + Zod everywhere. No implicit `any`.
- Keep features modular — one folder per domain (contacts, scoring, pipeline, auth).
