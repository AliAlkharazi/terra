# Spike A+B — Editor Play Mode Acceptance (Ali checklist)

**Slice:** Orthographic ~47.5° camera shell + Budget Hall + 7 district plots  
**Source:** `docs/unity-world/TERRA_UNITY_WORLD_VISUAL_PLAN.md` §6 + §11 (A+B)  
**How to run:** Open the Unity scene → Press Play → work the list top to bottom.  
**Pass rule:** Every **Must** item is PASS. **Nice** items do not block the slice.

---

## Out of scope this slice (do not fail A+B for these)
- LOD swaps, wilt/thrive materials, caretakers/birds, spend/save FX
- Combat / troops / walls-as-defense
- Expo / RN bridge, auth, real budget API
- Final art polish or seasonal themes

---

## Setup
- [ ] Scene opens without console errors (red). Warnings OK if noted.
- [ ] Hierarchy clearly shows: **Camera**, **Budget Hall**, and **7 district plots** (Dining, Groceries, Transport, Entertainment, Shopping, Subscriptions, Other).

---

## Spike A — Camera (Must)

| # | Check | Pass if… | ☐ |
|---|--------|----------|---|
| A1 | Orthographic | Camera is **Orthographic** (not Perspective). | ☐ |
| A2 | Pitch | Camera pitch is **47.5° ±2°** (Inspector: ~45–50° down). | ☐ |
| A3 | Fixed yaw | Yaw does **not** change while panning/zooming (no free-look). | ☐ |
| A4 | Pan | Drag (mouse or one-finger) pans across the ground plane. | ☐ |
| A5 | Zoom | Scroll / pinch changes `orthographicSize`; zoom **clamps** (cannot zoom into void or through floor). | ☐ |
| A6 | Bounds | Soft clamp keeps view on the island / map (cannot pan forever into empty space). | ☐ |
| A7 | Focus | Double-tap (or documented focus key) on a district smoothly pans+zooms toward it. | ☐ |
| A8 | Overview zoom | At max zoom-out you can see **Budget Hall + all 7 plots** in one frame. | ☐ |

## Spike B — Layout (Must)

| # | Check | Pass if… | ☐ |
|---|--------|----------|---|
| B1 | Budget Hall | Distinct central building / marker, readable as the hub (Town Hall analog). | ☐ |
| B2 | Seven plots | Exactly **7** district plots, each a different category id. | ☐ |
| B3 | Labels / color | Each plot is visually distinct (color and/or label): Dining, Groceries, Transport, Entertainment, Shopping, Subscriptions, Other. | ☐ |
| B4 | Wireframe layout | Roughly matches wireframe A (hall center-ish; districts around it — not a random pile). | ☐ |
| B5 | Paths | Simple paths (line renderer, decals, or ground marks) connect hall ↔ districts. | ☐ |
| B6 | Tap → id | Click/tap a district logs or shows its **category id** (Console or on-screen). | ☐ |
| B7 | Hall tap | Click/tap Budget Hall is distinguishable (logs `budget_hall` or equivalent — not a district id). | ☐ |

## Nice (optional — do not block merge of A+B)

| # | Check | ☐ |
|---|--------|---|
| N1 | Feels smooth (~60 fps on mid Mac with this empty/layout scene). | ☐ |
| N2 | Neighborhood zoom (~2–3 districts filling frame) feels intentional. | ☐ |
| N3 | Grid / footpads snap consistently under buildings. | ☐ |

---

## Result

- **Spike A:** PASS / FAIL  
- **Spike B:** PASS / FAIL  
- **Notes / blockers:** _(Ali or Mobile fill)_  

**Ship gate:** A + B both PASS → ready for Spike C (LOD) when Manager assigns.
