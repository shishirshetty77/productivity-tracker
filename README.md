# Half-Hour Productivity Tracker

A production-ready web application for tracking daily activities in 30-minute intervals. Export your productivity data in LLM-friendly formats for analysis.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-7-2d3748)
![SQLite](https://img.shields.io/badge/SQLite-3-003b57)

## Features

- 📅 **Date-based Tracking**: Select any date and track activities
- ⏰ **Flexible Day Windows**: Define your productive hours (e.g., 09:00 to 22:00)
- 📝 **30-Minute Blocks**: Auto-generated time intervals for consistent tracking
- ✅ **Quick Entry**: Checkbox completion + activity description
- 💾 **Auto-Save**: Changes save automatically with visual feedback
- 🌙 **Dark Mode**: System-aware with manual toggle
- 📊 **Progress Tracking**: Visual progress bar with completion percentage
- 📤 **LLM-Friendly Export**: Download all data as JSON or Markdown
- ⌨️ **Keyboard Navigation**: Arrow keys, Enter, and Tab support

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd terraform-eks

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup

```bash
# Build and run with Docker Compose
docker compose up --build

# Stop the containers
docker compose down
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema
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
```

## Keyboard Shortcuts

| Key   | Action                       |
| ----- | ---------------------------- |
| ↑/↓   | Navigate between time blocks |
| Enter | Toggle block completion      |
| Tab   | Move to next input field     |

## Environment Variables

| Variable       | Description          | Default         |
| -------------- | -------------------- | --------------- |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## License

MIT
