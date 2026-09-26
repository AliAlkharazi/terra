# Terra World (Unity)

Open this folder in **Unity 6.3 LTS** (`6000.3`, pinned at `6000.3.6f1`). Install steps are in the repo README under **Unity World**.

On first import, Unity creates `Assets/Scenes/TerraWorld.unity`. If the Hierarchy is empty, use **Terra → Build World Scene**. Then press **Play**.

Play starts on the full town: grass, a central **Budget Hall** with a light roof, and seven labeled plots (Dining, Groceries, Transport, Entertainment, Shopping, Subscriptions, Other) with paths. The Hierarchy shows **Camera**, **Budget Hall**, and those seven names. The camera is orthographic at **47.5°** pitch with a fixed yaw. Drag to pan, scroll or pinch to zoom (clamped), double-click or press **F** to focus the plot under the cursor. A district click logs its category key. A Budget Hall click logs `budget_hall`.

Acceptance checklist: `docs/unity-world/SPIKE_AB_PLAYMODE_AC.md`.

Architecture and the React Native bridge: `docs/UNITY_WORLD.md`.
