# Terra

Budget app: district budgets and transactions. React Native for the screens, Node/Prisma for accounts and sync, Unity for the 3D World.

The phone app runs offline. The backend is only for register, login, and syncing districts and transactions.

## App

Node.js 20+.

```bash
cd mobile
npm install
npx expo start
```

Phone: Expo Go, same Wi-Fi. Simulator: press `i` or `a`. First screen: **Continue offline**.

Backend (optional):

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

API on `http://localhost:4000`. On a real phone, set `API_BASE_URL` in `mobile/src/api/client.ts` to your computer’s LAN IP.

## Unity World

The Clash of Clans–quality town is the Unity project in `unity/`, not the three.js page inside the app. Why, and the message contract: [docs/UNITY_WORLD.md](docs/UNITY_WORLD.md).

Unity Editor is a one-time install. This repo does not vendor the editor, and a scene file is not checked in until the editor has created it.

### Install Unity once (Mac)

Checked on the machine that added this scaffold: no Unity Editor and no Unity Hub under `/Applications`, and `unity` is not on the PATH. Install it yourself before expecting a 3D view.

1. Download Unity Hub: https://unity.com/download
2. Open Hub and sign in. Unity Personal is the free license.
3. **Installs → Install Editor → Official releases → Unity 6.3 LTS** (version line `6000.3`).
   `unity/ProjectSettings/ProjectVersion.txt` pins `6000.3.6f1`. A newer `6000.3` patch from that same LTS line is fine. Hub may ask to update the pin when the project opens. Do not open this project in a `6000.4` or newer Update release.
4. Leave the install at the default Mac editor module. Skip iOS and Android. Those are for a later embed, not for looking at the scene.
5. **Projects → Add → Add project from disk**, and choose the `unity` folder in this repo.
6. Wait for the first import. It creates `Library/` (gitignored) and should open `Assets/Scenes/TerraWorld.unity`. If the Hierarchy is empty, use the menu **Terra → Build World Scene**.
7. After that scene exists, commit `unity/Assets/Scenes/TerraWorld.unity` and the `.meta` files Unity generated. They are not in this PR because the editor has to write them.

### What “done” looks like

Press **Play**. Click the Game view first so the mouse controls land there.

You should see a ground plane and seven colored block buildings, one per default district (Dining, Groceries, Transport, Entertainment, Shopping, Subscriptions, Other), with a name above each. The camera is isometric.

- Left-drag (or one finger): pan
- Scroll wheel (or pinch): zoom
- Right-drag: yaw
- Click a building: the Console logs `districtPress` and that district’s key

While playing, **Terra → Send Sample Districts** posts the sample JSON into the scene. Heights stay tied to `monthlyBudget`, and colors shift with `healthPct`. That JSON is the same shape the phone builds.

In the Expo app, **Unity host** on the World screen shows that payload from your live districts. It does not draw 3D. Expo Go cannot embed the Unity view.

### Not in this PR

- No Clash of Clans art, characters, or effects
- No App Store / Play Store build, and no Unity player embedded in the app
- Auth, district routes, and the transaction API are unchanged
- The existing WebView town is still the in-app picture until a dev-client embed exists. It is not the destination
