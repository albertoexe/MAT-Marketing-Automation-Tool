# MAT — Marketing Automation Tool

Piattaforma CRM interna per Marketing & Vendite. Gestione contatti, punteggio lead automatico, pipeline vendite e automazione del passaggio MQL → SQL.

## Stack

| Layer | Tecnologia |
|---|---|
| Desktop | Electron |
| Frontend | React + TypeScript + TailwindCSS |
| Build | electron-vite |
| Database (prod) | Supabase |

## Avvio rapido (sviluppo)

```bash
npm install
npm run dev
```

### Credenziali demo

| Utente | Email | Ruolo |
|---|---|---|
| Alice Rossi | alice@company.com | Marketing |
| Bob Ferri | bob@company.com | Marketing |
| Carlo Bianchi | carlo@company.com | Vendite |
| Diana Conti | diana@company.com | Vendite |
| Emilio Greco | emilio@company.com | Vendite |

Password: `password123`

## Funzionalità MVP

- ✅ Autenticazione con ruoli (Marketing / Vendite)
- ✅ Gestione contatti con ricerca e filtri per fase
- ✅ Motore di punteggio lead (eventi preimpostati + manuale)
- ✅ Automazione SQL: score ≥ 100 → promozione automatica + notifica + attività
- ✅ Pipeline Kanban a 6 stadi con valori deal in €
- ✅ Cronologia attività per contatto
- ✅ Sistema notifiche in-app
- ✅ Attività e task con alert scadenze

## Configurazione produzione (Supabase)

Crea un file `.env` nella root del progetto:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Struttura progetto

```
src/
├── main/              # Processo principale Electron
├── preload/           # Script preload (contextBridge)
└── renderer/src/
    ├── features/      # Moduli per dominio (auth, contacts, notifications)
    ├── pages/         # Pagine top-level (Dashboard, Pipeline, Tasks)
    ├── components/    # Componenti UI condivisi
    ├── lib/
    │   ├── mock/      # Dati mock per sviluppo
    │   └── services/  # Service layer (mock → Supabase)
    └── types/         # TypeScript types condivisi
```
