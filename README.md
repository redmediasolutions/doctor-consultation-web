# MedConnect Web (Next.js)

Web consoles for MedConnect, the in-store doctor video consultation system for the 5-store pharmacy chain.
It is a **frontend only**: all data lives in the shared Gladskin MariaDB and comes from the Gladskin
**Node.js API** under `/api/tele` (same server as the billing app). The store tablets run the
**MedConnect Flutter app** (doctor-consultation-app) against the same API.

| Page | Who | What it does |
| --- | --- | --- |
| `/doctor` | Doctors | Live queue from all stores, Agora video call with the store tablet, vitals, e-prescription, chat |
| `/pharmacy` | Store staff (owner: any store) | Prescriptions for the store arrive instantly; print, mark dispensed |
| `/admin` | Owner | Today's numbers, per-store breakdown, consultation log, add / disable doctors |
| `/prescription/<id>` | Signed-in users | A4 prescription, print or save as PDF |

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Firebase Auth · Agora Web SDK.

## Sign in

Same logins as the Gladskin billing app: **mobile number + OTP** (MSG91 cloud function → Firebase custom
token → Firebase ID token → `Authorization: Bearer …`). The Node API then decides who you are:

- `users.role = admin` → owner dashboard
- `users.role = store_manager / billing_staff` → pharmacy counter of `users.store_id`
- a row in `tele_doctors` (added from the owner dashboard) → doctor console

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

The API URL, Firebase client config and OTP URLs are built in (public values, the same as the Gladskin admin
app); `.env.local` can override them. The Node API must allow the site's origin in CORS: `http://localhost:3000`
is already allowed; add your deployed URL to `EXTRA_CORS_ORIGINS` in the server's `.env`.

## Deploy to Vercel

1. Push to GitHub → vercel.com → *Add New → Project* → pick the repo → **Deploy**.
2. No environment variables are needed (the public values above are built in; `.env.local` only overrides them).
3. On the Node server add the Vercel URL to `EXTRA_CORS_ORIGINS` in `.env` and run `pm2 restart <app>`.

## Project structure

```
src/
├── app/
│   ├── (auth)/login/            OTP sign-in
│   ├── (dashboard)/doctor|pharmacy|admin
│   └── prescription/[id]/       printable Rx
├── components/
│   ├── ui/                      shadcn/ui
│   ├── auth/ export/ forms/ layout/ providers/ (auth-provider)
│   ├── confirm-dialog.tsx  empty-state.tsx  profile-menu.tsx  theme-toggle.tsx
├── features/
│   ├── consultations/           doctor console, Agora call hook, Rx form (addform/), repository/
│   ├── prescriptions/           pharmacy counter, Rx view, repository/
│   ├── admin/                   owner dashboard, add doctor (addform/), repository/
│   └── auth/                    OTP login service, /auth/me repository, role guard
├── firebase/                    Firebase client config
├── hooks/                       use-auth, use-poll
└── lib/                         api (Bearer + token refresh), session, auth-logger, config, utils
```

`repository/` files are the only place that knows API paths (`/api/tele/...`).

## Before going live

- Regenerate the Agora certificate if it has been shared anywhere, and update `AGORA_APP_CERTIFICATE` on the server.
- Check teleconsultation prescribing rules for your state with the client's medical advisor.
