# MamaCare Hub

A maternal and child health application for mothers in Rwanda. Supports pregnancy tracking, baby milestones, vaccinations, health journaling, and direct chat with community health workers.

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Languages:** English and Kinyarwanda (rw)

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Supabase Edge Functions

Set the required secret before deploying:

```sh
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key
```

Deploy all functions:

```sh
supabase functions deploy
```

## Database

Push migrations to your Supabase project:

```sh
supabase db push
```
