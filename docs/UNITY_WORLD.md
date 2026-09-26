# Terra World: Unity, not WebGL

This is the architecture for a Clash of Clans–quality 3D town on the **village app** (the town in the screenshot: Diner, Home, Food, Travel, Bills, Main Vault). It is a foundation, not a demo that pretends a browser canvas is a game.

## Decision

| Layer | Owns |
| --- | --- |
| **Unity 6.3 LTS** (`unity/`) | The World. Isometric camera, placeholder buildings, lighting, and later the real art. |
| **React Native (Expo)** (`mobile/`) | Auth, the town screen, Deposit, Move, Activity, Freeze, Preview, Ask, Goals, district detail. |
| **Node + Prisma** (`backend/`) | `User` and a backup blob. The ledger stays on the phone. Unchanged by this slice. |

Unity is the renderer because CoC-style play is a native 3D scene: a fixed isometric camera, buildings you pan across, and lighting. That is a game-engine job. React Native stays the app around it.

Districts in this app live in the phone store (`mobile/src/store/budgetStore.ts`), not as Prisma rows. The building id is that local id: `dining`, `property`, `groceries`, `transport`, `bills`. The center building is `vault`. Vault is a pocket, not a district. A tap on it opens Move, the same as the current town.

## What we are rejecting

**Expo, `react-three-fiber`, and the three.js page in `mobile/assets/webview/scene.html` are not the long-term CoC path.**

`WorldWebView` still knows how to inject JavaScript into that page. The town screen does not mount it. The picture you see today is the SVG village (`VillageMap`). Neither of those is the destination:

- The WebView scene is a web page. It has no asset pipeline, no lightmaps, and it shares a JS thread with the page. It cannot become a town you pan like CoC.
- `react-three-fiber` on Expo GL is the same WebGL stack with a React wrapper. It produces another technically-3D scene. It does not add the engine or the art tools this needs.
- Expo Go cannot embed a native Unity view. Shipping the town inside the app later means a dev client, with Unity exported as a library. That embed is **not** this slice.

Do not extend `scene.html`.

## Bridge

React Native does not share objects with Unity. They pass JSON.

### React Native → Unity

GameObject `TerraWorld`, method `Receive`.

```json
{
  "type": "setDistricts",
  "vault": { "key": "vault", "label": "Main Vault", "amount": 1280, "locked": 100 },
  "districts": [
    {
      "key": "dining",
      "label": "Diner",
      "icon": "",
      "monthlyBudget": 250,
      "available": 40,
      "spent": 210,
      "allocated": 250
    }
  ]
}
```

`monthlyBudget` is the district’s plan. `available`, `spent`, and `allocated` come from the same allocation state the town already shows. `amount` is ready-to-assign. `locked` is frozen vault money.

`mobile/src/unity/bridge.ts` builds this from the live store. The Unity host screen shows it. Nothing in that screen draws 3D.

### Unity → React Native (contract only, until embed)

```json
{ "type": "districtPress", "key": "dining" }
```

`vault` is the center building. After embed, a district key opens `DistrictDetail`. `vault` opens Move. In the editor, a click logs the key.

`unity/Assets/StreamingAssets/sample-districts.json` is the same shape. **Terra → Send Sample Districts** posts it into `TerraBridge.Receive`.

## How the pieces meet later

Not in this PR:

1. Export the Unity project as a library (iOS and Android).
2. Add a React Native dev client. Expo Go will not load it.
3. Call `Receive` on `TerraWorld` with `toUnitySetDistrictsMessage(...)`.
4. On `districtPress`, open `DistrictDetail` or Move when the key is `vault`.

A common embed package is `@azesmway/react-native-unity`. This repo does not depend on it yet.

## Placeholder scene

`TerraWorldBuilder` builds the first scene:

- Orthographic camera, pitch about 52°, yaw 45°.
- Left-drag or one finger pans. Scroll or pinch zooms. Right-drag yaws.
- Blocks for Diner, Home, Main Vault, Food, Travel, and Bills, in the same ring as the current town.
- Height follows the money. A `setDistricts` message turns a building red when `available` is negative.

The scene file `Assets/Scenes/TerraWorld.unity` is created by the editor on first open (**Terra → Build World Scene** if it does not). It is not hand-written YAML.

## Explicitly out of scope

- CoC art, characters, animations, or a store build.
- Replacing the SVG town before the Unity view is actually embedded.
- Replacing login, Deposit, Move, Freeze, or the backup API.
