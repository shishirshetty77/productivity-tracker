# Half-Hour Productivity Tracker

A production-ready web application for tracking daily activities in 30-minute intervals. Export your productivity data in LLM-friendly formats for analysis.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6-2d3748)
![SQLite](https://img.shields.io/badge/SQLite-3-003b57)


## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/shishirshetty77/productivity-racker.git
cd productivity-racker

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Or manually create .env with:

# DATABASE_URL="file:./dev.db"


# Set up the database
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup

Create a `.env` file in the project root with the following content:

```env
# Database URL for Prisma (SQLite)
DATABASE_URL="file:./prisma/dev.db"
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker compose build --no-cache
docker compose up -d

# Stop the containers
docker compose down
```

The Docker app runs on port **3001**: [http://localhost:3001](http://localhost:3001)

> **Note:** Both dev (port 3000) and Docker (port 3001) share the same database file (`prisma/dev.db`), so your data stays consistent across both modes.

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── dev.db                 # SQLite database (created after migration)
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── days/          # Day CRUD operations
│   │   │   ├── timeblocks/    # TimeBlock updates
│   │   │   └── export/        # Data export
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript types
├── .env                       # Environment variables (create this!)
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker Compose config
└── package.json
```

## API Reference

### Days

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| GET    | `/api/days`        | Get all days     |
| POST   | `/api/days`        | Create a new day |
| GET    | `/api/days/[date]` | Get day by date  |
| PUT    | `/api/days/[date]` | Update day       |
| DELETE | `/api/days/[date]` | Delete day       |

### Time Blocks

| Method | Endpoint               | Description       |
| ------ | ---------------------- | ----------------- |
| PUT    | `/api/timeblocks/[id]` | Update time block |

### Export

| Method | Endpoint                      | Description        |
| ------ | ----------------------------- | ------------------ |
| GET    | `/api/export?format=json`     | Export as JSON     |
| GET    | `/api/export?format=markdown` | Export as Markdown |

## Export Format

### JSON (LLM-friendly)

```json
[
  {
    "date": "2024-01-15",
    "day_window": "09:00-17:00",
    "completed": true,
    "intervals": [
      {
        "start": "09:00",
        "end": "09:30",
        "done": true,
        "skipped": false,
        "activity": "Reviewed system design notes"
      }
    ]
  }
]
```

### Markdown

```markdown
# Productivity Log

## Date: 2024-01-15

- Day Window: 09:00–17:00
- Day Completed: Yes

### Time Blocks

- 09:00–09:30 | ✅ Done | Reviewed system design notes
- 09:30–10:00 | ❌ Skipped | Did not work in this period
```

## Keyboard Shortcuts

| Key   | Action                       |
| ----- | ---------------------------- |
| ↑/↓   | Navigate between time blocks |
| Enter | Toggle block completion      |
| Tab   | Move to next input field     |

## Environment Variables

| Variable       | Description          | Required | Default                |
| -------------- | -------------------- | -------- | ---------------------- |
| `DATABASE_URL` | SQLite database path | Yes      | `file:./prisma/dev.db` |

## Development

```bash
# Run development server (port 3000)
npm run dev

# Type checking
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Ports

| Mode   | Port | URL                   |
| ------ | ---- | --------------------- |
| Dev    | 3000 | http://localhost:3000 |
| Docker | 3001 | http://localhost:3001 |

## License

MIT
