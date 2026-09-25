# Terra World: Unity, not WebGL

This is the architecture for a Clash of Clans–quality 3D town. It is a foundation, not a demo that pretends a browser canvas is a game.

## Decision

| Layer | Owns |
| --- | --- |
| **Unity 6.3 LTS** (`unity/`) | The World. Isometric camera, district buildings, lighting, and later the real art. |
| **React Native (Expo)** (`mobile/`) | Auth, settings, lists, transaction entry, district detail. The screens that are forms and text. |
| **Node + Prisma** (`backend/`) | `User`, `District` (`key`, `label`, `icon`, `monthlyBudget`), `Transaction`. Unchanged by this slice. |

Unity is the renderer because CoC-style play is a native 3D scene: a fixed isometric camera, dozens of buildings, baked or real-time lighting, and touch that pans a world. That is a game-engine job. React Native stays the app around it.

## What we are rejecting

**Expo, `react-three-fiber`, and the three.js WebView already in this repo are not the long-term CoC path.**

The current in-app “3D” is `mobile/assets/webview/scene.html`. It loads three.js from a CDN into `react-native-webview`. `WorldWebView` injects JavaScript strings (`terraSetDistricts`, and so on). That is a web page inside the app. It can show colored meshes. It cannot become a CoC town:

- No game asset pipeline (prefabs, lightmaps, LOD, occlusion). The scene is a script tag.
- The render runs on the WebView’s JS thread, not a native graphics engine. Frame time collapses as soon as the town stops being a handful of primitives.
- Touch is a browser gesture layer. It does not match a native isometric camera, and it fights React Native’s own gestures.
- It depends on unpkg at runtime. Airplane mode, or a CDN hiccup, and the town is gone.
- `react-three-fiber` on Expo GL is the same WebGL stack with a React wrapper. It produces another technically-3D scene. It does not add the engine, the lighting model, or the art tools CoC-quality work needs. Switching to it would repeat the WebView experiment under a new import.

Expo Go also cannot embed a native Unity view. Shipping CoC-quality 3D inside the app later means a dev client (prebuild), with Unity exported as a library. That embed is **not** this slice. The WebView stays for now so the current screen still has a picture. It is marked interim in code. Do not extend it.

## Bridge

React Native does not share objects with Unity. They pass JSON.

The building id is the district **key** (`dining`, `groceries`, …):

- On the phone, that string is `District.id` in `mobile/src/types`.
- In Prisma, that string is `District.key`.
- Prisma’s `District.id` is a UUID used by `/districts/:id`. It is not a building name. Do not send it to Unity.

### React Native → Unity

GameObject `TerraWorld`, method `Receive` (the call `postMessage` will use once a library is embedded).

```json
{
  "type": "setDistricts",
  "districts": [
    {
      "key": "dining",
      "label": "Dining",
      "icon": "🍜",
      "monthlyBudget": 250,
      "spent": 40,
      "healthPct": 80
    }
  ]
}
```

`monthlyBudget` is the Prisma / local district field. `spent` and `healthPct` come from the existing world snapshot (`buildWorldSnapshot`), so the town reflects the same numbers as the grid.

`mobile/src/unity/bridge.ts` builds this message from the live budget store. The Unity host screen shows it. Nothing in that screen draws 3D.

### Unity → React Native (contract only, until embed)

```json
{ "type": "districtPress", "key": "dining" }
```

In the editor, a click logs that line. After embed, the host navigates to the existing `DistrictDetail` screen with that key. Auth and the transaction API stay in React Native.

`unity/Assets/StreamingAssets/sample-districts.json` is the same shape. The menu **Terra → Send Sample Districts** posts it into `TerraBridge.Receive` so the contract can be checked without the phone.

## How the pieces meet later

Not in this PR. The mechanical next step after the editor scene looks right:

1. Export the Unity project as a library (iOS and Android).
2. Add a React Native dev client. Expo Go will not load it.
3. Call `Receive` on `TerraWorld` with `toUnitySetDistrictsMessage(...)`.
4. On `districtPress`, `navigation.navigate('DistrictDetail', { districtId: key })`.

A common embed package is `@azesmway/react-native-unity`. This repo does not depend on it yet: there is no exported library, and adding the package would break the Expo Go run.

## Placeholder scene

`unity/Assets/Scripts/TerraWorldRoot.cs` builds the first scene:

- Orthographic camera, pitch about 52°, yaw 45° (isometric).
- Left-drag or one finger pans. Scroll or pinch zooms. Right-drag yaws.
- One cube per default district in `mobile/src/store/budgetStore.ts` (`dining`, `groceries`, `transport`, `entertainment`, `shopping`, `subscriptions`, `other`).
- Height follows `monthlyBudget`. A `setDistricts` message recolors by `healthPct`.

The scene file `Assets/Scenes/TerraWorld.unity` is created by the editor on first open (`Terra → Build World Scene` if it does not). It is not hand-written YAML. A hand-written scene would be another fake.

## Explicitly out of scope

- CoC art, characters, animations, VFX, or a store build.
- Replacing login, the district API, or the local budget store.
- Deleting the WebView before the Unity view is actually embedded.
