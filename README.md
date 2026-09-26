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
  docs/UNITY_WORLD.md
  start-mobile.sh
  start-mobile.bat
  mobile/            ← Expo app
  backend/           ← Express API + Prisma
  unity/             ← 3D World (Unity 6.3). Not embedded in Expo Go yet.
```

---

## Unity World

The Clash of Clans–quality town is the Unity project in `unity/`, on top of this village app (Diner, Home, Food, Travel, Bills, Main Vault). The SVG town stays the in-app picture. Why, and the message contract: [docs/UNITY_WORLD.md](docs/UNITY_WORLD.md).

Unity Editor is a one-time install. This repo does not include the editor, and `Assets/Scenes/TerraWorld.unity` does not exist until Unity creates it.

### Install Unity once (Mac)

1. Download Unity Hub: https://unity.com/download
2. Sign in. Unity Personal is the free license.
3. **Installs → Install Editor → Official releases → Unity 6.3 LTS** (`6000.3`).
   `unity/ProjectSettings/ProjectVersion.txt` pins `6000.3.6f1`. A newer `6000.3` patch is fine. Do not open this project in a `6000.4` or newer Update release.
4. Skip iOS and Android modules. Those are for a later embed.
5. **Projects → Add → Add project from disk**, and choose the `unity` folder.
6. Wait for the first import. It should open `Assets/Scenes/TerraWorld.unity`. If the Hierarchy is empty, use **Terra → Build World Scene**.
7. After the scene exists, commit `unity/Assets/Scenes/TerraWorld.unity` and the `.meta` files Unity generated.

### What “done” looks like

Press **Play** in the Game view.

You should see a ground plane and six colored blocks in the same ring as the phone town: Diner and Home behind, Main Vault in the center, Food, Travel, and Bills in front, each with a name. The camera is isometric.

- Left-drag (or one finger): pan
- Scroll wheel (or pinch): zoom
- Right-drag: yaw
- Click a building: the Console logs `districtPress` and that key (`dining`, `property`, `vault`, …)

While playing, **Terra → Send Sample Districts** posts the sample JSON. Heights follow the money. A negative available balance turns a building red.

In the Expo app, the **3D** chip on the town (top right) opens the host. It lists the live vault and districts and the JSON. It does not draw 3D. Expo Go cannot embed the Unity view.

### Not in this slice

- No Clash of Clans art, characters, or effects
- No App Store / Play Store build, and no Unity player inside the app
- Deposit, Move, Freeze, Ask, and the backup API are unchanged

---

## Quick checks

| Goal | Command |
|------|---------|
| Start app | `cd mobile && npm install && npx expo start` |
| Run tests | `cd mobile && npm test` |
| Start API | `cd backend && npm run dev` |

If `npm install` fails, update Node to the current LTS and try again.
