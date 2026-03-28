# MamaSalama

**MamaSalama** means *“Safe Mother”*.
It is a free mobile app that helps mothers in Rwanda take care of themselves during pregnancy and care for their babies after birth.

The app gives useful health information, tracks baby growth, reminds mothers about vaccines, and allows them to talk to community health workers. It works in both English and Kinyarwanda.

---
## Live link  : https://61b3345c.mamasalama.pages.dev/auth 

## Purpose

Many mothers in Rwanda and other African countries do not easily get trusted health information or support.

MamaSalama helps solve this problem by putting helpful health guidance directly on a mother’s phone — for free.

---

## Features

### For Mothers

* **Health Chat**: Ask health questions and get quick answers from AI.
* **Pregnancy Tracking**: Follow your pregnancy week by week with tips.
* **Baby Growth Tracking**: Record your baby’s weight and height and compare with standards.
* **Milestones**: Track your baby’s development stages.
* **Vaccination Reminders**: Stay updated with vaccine schedules.
* **Breastfeeding Tracker**: Record feeding times and duration.
* **Sleep & Diaper Tracker**: Monitor baby sleep and diaper changes.
* **Kick Counter**: Track baby movements during pregnancy.
* **Health Journal**: Write notes about symptoms, mood, and health.
* **Reminders**: Set alerts for medicine, appointments, and vaccines.
* **Nearby Health Centers**: Find hospitals, clinics, and pharmacies nearby.
* **Community Forum**: Talk with other mothers and share experiences.
* **Chat with Health Workers**: Message real health workers for help.
* **Notifications**: Get alerts for important health updates.
* **Offline Access**: Read some content even without internet.
* **Languages**: Available in English and Kinyarwanda.

---

### For Health Workers (Admin)

* **Dashboard**: See all users and activities.
* **Manage Mothers**: View and manage registered users.
* **Appointments**: Schedule and track visits.
* **Vaccination Tracking**: Monitor vaccine progress.
* **Manage Reminders**: Control notifications sent to users.
* **Chat Support**: Reply to mothers’ messages.
* **Broadcast Messages**: Send messages to many users at once.
* **Export Data**: Download reports in CSV format.
* **USSD Support**: Help mothers without smartphones.
* **SMS Reminders**: Send automatic messages using SMS.

---

## Tech Stack (Tools Used)

* **Frontend**: React + TypeScript
* **Design**: Tailwind CSS
* **Backend**: Supabase (database, login, storage)
* **AI**: Groq API
* **SMS**: Twilio
* **Notifications**: Web Push
* **Offline Support**: PWA
* **Languages**: English and Kinyarwanda

---

## Getting Started

### Requirements

* Node.js (version 18 or higher)
* Supabase account (free)
* Groq API key (free)

---

### 1. Clone the project

```bash
git clone https://github.com/Gedeon250/MamaSalama.git
cd MamaSalama
```

---

### 2. Install packages

```bash
npm install
```

---

### 3. Setup environment variables

```bash
cp .env.example .env
```

Edit the `.env` file and add your keys.

---

### 4. Setup database

```bash
npx supabase db push
```

---

### 5. Add secret keys

```bash
npx supabase secrets set GROQ_API_KEY=your_key
npx supabase secrets set TWILIO_ACCOUNT_SID=your_sid
npx supabase secrets set TWILIO_AUTH_TOKEN=your_token
npx supabase secrets set TWILIO_PHONE_NUMBER=your_number
```

---

### 6. Deploy backend functions

```bash
npx supabase functions deploy
```

---

### 7. Run the app

```bash
npm run dev
```

---

## Project Structure

* `src/` → main app code
* `components/` → UI parts
* `pages/` → app screens
* `hooks/` → reusable logic
* `supabase/` → backend functions and database
* `public/` → images and icons

---

## Deployment

To prepare the app for production:

```bash
npm run build
```

You can deploy it on:

* Vercel
* Netlify
* Cloudflare Pages

Make sure to add your environment variables there.

---

## Security

* Secret keys are protected on the server
* Database access is secured
* Admin access is restricted
* No sensitive data is exposed

---

## Contributing

You can contribute by submitting changes. For big changes, start by opening an issue.

---

## License

MIT License — free to use and modify.

---

**Made with care for mothers in Rwanda 🇷🇼**

