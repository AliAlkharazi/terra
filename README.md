# Terra

Visual budgeting app (Expo / React Native) with an optional Node backend for login, backup, and price estimates.

The app runs **offline by default**. You only need the backend if you want accounts, cloud backup, or smarter Ask answers.

---

## What you need on any computer

1. **Node.js 20 or newer** — https://nodejs.org (LTS)
2. A phone with **Expo Go** (App Store / Play Store), **or** a Mac with Xcode Simulator / Android Studio emulator

A zip alone cannot start without Node. After Node is installed, the steps below are enough.

---

## Open the app (mobile) — 4 steps

1. Unzip this folder anywhere.
2. Open a terminal in the `mobile` folder:

```bash
cd mobile
npm install
npx expo start
```

3. When the QR code appears:
   - **Phone:** open Expo Go and scan the QR code (same Wi‑Fi as the computer).
   - **Mac:** press `i` for iOS Simulator.
   - **Android emulator:** press `a`.

4. On the first screen choose **Continue offline** (simplest) or log in if the backend is running.

On Windows, use Command Prompt or PowerShell and the same commands.

Shortcut scripts (optional):

- Mac / Linux: `./start-mobile.sh`
- Windows: double‑click `start-mobile.bat`

---

## Phone cannot reach the computer?

Expo Go must be on the **same Wi‑Fi**. If the QR code fails, in the Expo terminal press `s` and try Tunnel mode.

---

## Backend (optional)

Only needed for register/login, Backup / Restore, and optional AI price estimates.

1. Install **PostgreSQL** and create a database named `terra` (or change the URL).
2. In the `backend` folder:

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

3. Backend listens on `http://localhost:4000`.

4. If you test on a **real phone**, open `mobile/src/api/client.ts` and set `API_BASE_URL` to your computer’s LAN IP, for example:

```ts
export const API_BASE_URL = 'http://192.168.1.23:4000';
```

Simulators can keep `http://localhost:4000`.

`OPENAI_API_KEY` in `.env` is optional. Without it, Ask still uses the built‑in price catalog.

---

## Project layout

```
terra/
  README.md          ← this file
  GUIDE.md           ← buttons and features
  start-mobile.sh
  start-mobile.bat
  mobile/            ← Expo app
  backend/           ← Express API + Prisma
```

---

## Quick checks

| Goal | Command |
|------|---------|
| Start app | `cd mobile && npm install && npx expo start` |
| Run tests | `cd mobile && npm test` |
| Start API | `cd backend && npm run dev` |

If `npm install` fails, update Node to the current LTS and try again.
