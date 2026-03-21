# MamaSalama 🤱

**MamaSalama** (Swahili for *"Safe Mother"*) is a free maternal and child health companion app built for mothers in Rwanda. It helps mothers navigate pregnancy, track their baby's growth, stay on top of vaccinations, and connect directly with community health workers — all in English or Kinyarwanda.

---

## Purpose

In Rwanda and across sub-Saharan Africa, many mothers lack easy access to reliable health information and professional guidance during pregnancy and early childhood. MamaSalama bridges that gap by putting a knowledgeable, compassionate health assistant in every mother's pocket — completely free of charge.

---

## Features

### For Mothers (Patients)
| Feature | Description |
|---|---|
| AI Health Chat | Ask health questions and get instant answers powered by Groq AI (llama-3.1-8b-instant) |
| Pregnancy Tracking | Track pregnancy week by week with tips and what to expect |
| Baby Growth | Log weight & height, compare to WHO growth standards |
| Milestones | Track developmental milestones for your child |
| Vaccinations | Follow the national vaccination schedule with reminders |
| Breastfeeding Tracker | Log feeding sessions and durations |
| Sleep & Diaper Log | Track baby's sleep patterns and diaper changes |
| Kick Counter | Monitor fetal movement during pregnancy |
| Health Journal | Record symptoms, moods, and daily health notes |
| Reminders | Set vaccination, appointment, and medication reminders |
| Nearby Facilities | Find hospitals, clinics, and pharmacies near you |
| Community Forum | Share experiences and ask questions in a safe space |
| Chat with Health Worker | Message a real community health worker directly |
| Push Notifications | Get reminded about upcoming appointments and vaccines |
| Offline Support | Read health articles offline as a PWA |
| Bilingual | Full support for English and Kinyarwanda |

### For Health Workers (Admin)
| Feature | Description |
|---|---|
| Admin Dashboard | Overview of all clients, cases, and activity |
| Client Management | View and manage registered mothers |
| Appointment Scheduling | Track and manage appointments |
| Vaccination Tracking | Monitor vaccination completion rates |
| Reminders Management | View and manage all client reminders |
| Case Chat | Respond to client messages and support cases |
| Broadcast Messages | Send notifications to individual users or all users |
| Data Export | Export client data as CSV for reporting |
| USSD Support | Reach mothers without smartphones via USSD |
| SMS Reminders | Send automated SMS reminders via Twilio |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Edge Functions | Deno (Supabase Edge Functions) |
| AI | Groq API — llama-3.1-8b-instant (free, no credit card) |
| SMS | Twilio |
| Push Notifications | Web Push API + VAPID |
| PWA | vite-plugin-pwa + Workbox |
| i18n | Custom hook — English (`en`) + Kinyarwanda (`rw`) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Groq](https://console.groq.com) API key (free, no credit card required)

### 1. Clone the repo
```bash
git clone https://github.com/Gedeon250/MamaSalama.git
cd MamaSalama
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### 4. Push database migrations
```bash
npx supabase db push
```

### 5. Set Supabase secrets
```bash
npx supabase secrets set GROQ_API_KEY=your_groq_api_key
npx supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_sid
npx supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
npx supabase secrets set TWILIO_PHONE_NUMBER=your_twilio_number
```

### 6. Deploy edge functions
```bash
npx supabase functions deploy
```

### 7. Start the dev server
```bash
npm run dev
```

---

## Project Structure

```
MamaSalama/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── admin/         # Admin-only components
│   │   ├── layout/        # Page layout, navigation
│   │   └── ui/            # shadcn/ui primitives
│   ├── contexts/          # React context providers
│   ├── hooks/             # Custom hooks (useAuth, useAdmin, etc.)
│   ├── i18n/              # English + Kinyarwanda translations
│   ├── pages/             # All app pages (patient + admin)
│   │   └── admin/         # Admin dashboard pages
│   └── integrations/
│       └── supabase/      # Supabase client + generated types
├── supabase/
│   ├── functions/         # Edge functions (AI, SMS, Push, USSD)
│   └── migrations/        # Database migrations
└── public/                # Static assets + PWA icons
```

---

## Deployment

### Build for production
```bash
npm run build
```

The `dist/` folder can be deployed to any static host:

- **Vercel** — connect your GitHub repo at [vercel.com](https://vercel.com)
- **Netlify** — connect your GitHub repo at [netlify.com](https://netlify.com)
- **Cloudflare Pages** — connect your GitHub repo at [pages.cloudflare.com](https://pages.cloudflare.com)

Set the same environment variables from your `.env` in your hosting provider's dashboard.

---

## Security

- All API keys are server-side only (Supabase Edge Function secrets)
- Row Level Security (RLS) enforced on all database tables
- Admin routes protected by role-based access control
- No sensitive keys exposed in the browser

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT — free to use, modify, and distribute.

---

> Built with love for mothers in Rwanda 🇷🇼
