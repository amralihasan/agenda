# Digital Paper Agenda (L'Édition Manuscrite)

A personal digital agenda web application engineered to faithfully reproduce the physical sensory experience of using a bespoke, premium paper notebook (inspired by Smythson, Hobonichi Techo, and classical letterpress stationery).

---

## Visual & UX Philosophy

- **Physical Open-Book Experience**: Dual-page open folio layout (Verso on the left, Recto on the right on desktop) resting upon a dark oiled burgundy leather desk canvas (`#200200`).
- **Tactile Paper Anatomy**: Warm unbleached cotton ivory paper (`#fcf9f3`), Smyth-sewn central spine crease, valley gradient shadows, draped silk ribbon marker with swallowtail tail, and die-cut notebook index tabs.
- **Letterpress & Archival Ink Typography**:
  - `EB Garamond` for classical old-style chapter titles, roman numerals, and tracked small-caps.
  - `Newsreader` for body text and fountain-pen cursive journal script in italics.
  - `Courier Prime` for typewriter timestamps, folios, and mechanical ledger markings.
  - `Amiri` and `Noto Naskh Arabic` for authentic Arabic calligraphy and typography.
- **Archival Rulings**: Continuous horizontal 24px feint ruling lines, Carmine red vertical margin guide lines (`#8c2d19`), and precision dot-grid paper fields.
- **No SaaS Dashboard Clutter**: Strictly zero KPI cards, analytics widgets, or floating plastic buttons. The agenda itself is the interface.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, date-fns, i18next
- **Backend**: Node.js, Express.js, TypeScript, Zod validation
- **Database**: SQLite with Prisma ORM
- **Testing**: Vitest, Supertest

---

## Application Structure

1. **Daily Agenda**
   - **Left Page (Verso)**: Date header (day name, full date, day of year, moon phase / calendar detail), Daily Priorities (up to 3 slots with Roman numerals, completion toggle, and inline editing), Horarium Chronologique (hourly schedule 06:00 to 22:00 with red vertical margin, add/edit/delete activities).
   - **Right Page (Recto)**: Daily Obligations & Tasks (ruled task ledger, square ink checkboxes with authentic `✕`, priority stamps, time tags, migration to another date), Interactive ink line for adding tasks, Personal Notes on a spacious dot-grid paper field with auto-save and pressed botanical watermark, Page footers.
2. **Weekly Agenda**
   - 7 days of the selected week with date navigation.
   - Semestrial Focus & Grand Objectives (weekly goals).
   - Tasks and schedule events connected directly to daily agendas.
   - Dedicated weekly feint-lined notes area.
3. **Monthly Agenda**
   - Traditional printed monthly calendar grid.
   - Monthly intentions & strategic milestones (checkable Roman numerals I to IV).
   - Day cells with subtle ink indicators for scheduled events, tasks, and notes.
   - Clicking any date directly opens that day's Daily Agenda.
4. **Notes (Liber Persona)**
   - Notebook-inspired reading and writing interface.
   - Note search, categorization (Philosophy, Architecture, Archive, Editorial, Personal), pin toggles.
   - Manuscript writing area with customizable paper styling: **Feint Ruled**, **Dot Grid**, or **Clean Vellum**.
   - Auto-saving changes to SQLite.
5. **Internationalization (i18n)**
   - Complete support for English (LTR) and Arabic (RTL).
   - Layout mirroring: in Arabic, pages and outer notebook tabs mirror appropriately to honor Arabic bookbinding traditions.
   - High-fidelity Arabic typography with Amiri and Noto Naskh Arabic.

---

## Installation & Local Startup

### Prerequisites
- Node.js (v18.0.0 or higher, tested on Node v22)
- npm (v9.0.0 or higher)

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```
This installs dependencies across the root, `server/`, and `client/` workspaces.

### 2. Database Setup & Seed
```bash
# Push schema to SQLite and seed realistic archival demonstration data
npm run db:migrate
npm run db:seed
```

### 3. Run Development Servers
To run both backend API (`http://localhost:3001`) and frontend Vite dev server (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## Private Server Deployment Instructions

The application is architected to run on a private server without external third-party cloud dependencies (no Supabase, Firebase, or external DB required).

### Production Build
```bash
# Build backend TypeScript and Vite client bundle
npm run build
```

The compiled backend will reside in `server/dist/` and the static frontend in `client/dist/`.

### Serving in Production

#### Option A: Node Process Manager (PM2 / Systemd)
1. Configure environment variables in `server/.env`:
   ```env
   PORT=3001
   DATABASE_URL="file:./dev.db"
   NODE_ENV=production
   ```
2. Start the backend:
   ```bash
   cd server
   npx pm2 start dist/index.js --name "agenda-api"
   ```
3. Serve `client/dist` via Nginx or Caddy:
   ```nginx
   server {
       listen 80;
       server_name agenda.internal.local;

       root /var/www/agenda/client/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Database Backup & Restoration

All application data is stored in SQLite (`server/prisma/dev.db` or `server/dev.db`).

### Method 1: In-App Archival Backup (UI)
1. Click the **Settings** gear icon in the top header.
2. Under **Database Backup & Restoration**, click **Download Ledger Backup (.json)**.
3. To restore on another machine or after maintenance, click **Restore Ledger from File** and select your `.json` backup file.

### Method 2: Direct SQLite File Backup (CLI)
To create a binary snapshot of your database:
```bash
# Backup SQLite file safely
sqlite3 server/prisma/dev.db ".backup 'server/backup-$(date +%Y%m%d).db'"
```

To restore from a binary backup:
```bash
cp server/backup-20261121.db server/prisma/dev.db
```

---

## Testing

Run backend API tests with Vitest:
```bash
npm run test
```
This runs suite checks covering:
- Health endpoint
- Settings initialization
- Daily agenda retrieval & priority slot mapping
- Task creation, completion toggling, and deletion
- Monthly calendar summaries
- Notes persistence
