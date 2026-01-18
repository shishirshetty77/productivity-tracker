# Productivity Tracker

> A simple, distraction-free tool to track your day in 30-minute blocks.

## Why this exists

I realized that tracking every single minute is exhausting. Instead, I just want to know: **"Was this half-hour productive?"**

This app helps you:

- ✅ Mark blocks as "Done" or "Skipped" (because life happens).
- 📝 Jot down what you actually did.
- 🔒 Keep your data private with a simple login.
- 📊 Export your data to JSON.

## The Stack

Built with love and modern tech:

- **Next.js 15**: For a fast, responsive UI.
- **PostgreSQL**: Reliable data storage (via Neon).
- **Prisma**: Type-safe database interactions.
- **Tailwind CSS**: For that sleek, dark-mode capability.
- **Kubernetes Ready**: Helm chart included!

## How to Run Locally

### 1. Prerequisites

- Node.js 18+
- PostgreSQL (or use a free Neon instance)

### 2. Setup

```bash
# Clone the repo
git clone https://github.com/shishirshetty77/productivity-tracker.git
cd productivity-tracker

# Install dependencies
npm install

# Setup Environment
cp .env.example .env
# Edit .env and add your DATABASE_URL and a random AUTH_SECRET
```

### 3. Run

```bash
# Push database schema
npx prisma db push

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start tracking!

## Deployment

This app is ready for:

- **Vercel**: Zero config needed.
- **Kubernetes**: Use the included Helm chart in `charts/productivity-tracker`.

---

_Made with ❤️ by Shishir Shetty_
