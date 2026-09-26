# District forecast API — Acceptance (Backend only)

**Slice:** Rolling-average next-month spend forecast per district; horizon widens as months accumulate.  
**Out of scope:** Mobile UI, Unity World, spend/save kind, migrations beyond what’s needed for this read model.  
**Pass rule:** Every **Must** item PASS. Incomplete current calendar month is **never** counted in N.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Complete month** | A calendar month strictly before the current UTC (or app) month that has ended. |
| **N** | Count of complete months with ≥1 spend transaction in that district (saves excluded if kind exists; else all amounts as spend). |
| **Monthly total** | Sum of spend cents for that district in a complete month. |
| **Rolling average** | Mean of the last `horizonMonths` complete-month totals (or all N if N < horizon). |

### Horizon rule (Must)

| N (complete months) | `horizonMonths` | Forecast returned? |
|---------------------|-----------------|--------------------|
| 0 | — | **Omit** forecast object / field (or `null` — pick one and stick to it) |
| 1 | 1 | Yes |
| 2 | 2 | Yes |
| ≥3 | 3 | Yes (+ optional band) |

---

## Endpoint (Must)

- Authenticated route, e.g. `GET /districts/:id/forecast` **or** forecast embedded on `GET /districts` / `GET /districts/:id`.
- Document the chosen shape in the PR description.
- Returns **cents** (integer), never floats for money fields.

### Response fields when N ≥ 1 (Must)

| Field | Type | Rule |
|-------|------|------|
| `predictedNextMonthCents` | int | Rounded rolling average of the months used (half-up or banker’s — document which). |
| `horizonMonths` | 1 \| 2 \| 3 | Per table above. |
| `basedOnMonths` | int | Actual number of complete months averaged (≤ `horizonMonths`, equals N when N ≤ horizon). |
| `districtId` | uuid/string | Matches request district. |

### Optional band when N ≥ 3 (Must if present)

| Field | Type | Rule |
|-------|------|------|
| `bandLowCents` | int | Conservative lower bound from the same month set (e.g. min of last 3, or mean − 1σ — **document formula in PR**). |
| `bandHighCents` | int | Matching upper bound (max or mean + 1σ). |
| | | `bandLowCents` ≤ `predictedNextMonthCents` ≤ `bandHighCents`. |

When N < 3: **do not** include band fields (omit keys).

When N = 0: **omit** entire forecast (or return `forecast: null` — same choice as table).

---

## Behavior (Must)

1. Incomplete current month **excluded** from N and from averages.
2. District with no history → no forecast (N=0 path).
3. Another user’s district → 404 / 403 (authz).
4. Zero-spend complete months: if a month has zero spend, define whether it counts toward N — **default: only months with ≥1 spend count** (state in PR if different).
5. Deterministic: same DB state → same cents.

---

## Pass / fail checklist (Backend)

| # | Check | ☐ |
|---|--------|---|
| F1 | N=0 → forecast omitted / null; no invented numbers. | ☐ |
| F2 | N=1 → `horizonMonths=1`, `basedOnMonths=1`, prediction = that month’s total. | ☐ |
| F3 | N=2 → `horizonMonths=2`, average of both complete months. | ☐ |
| F4 | N≥3 → `horizonMonths=3`, average of last 3 complete months. | ☐ |
| F5 | Current (incomplete) month’s spend does **not** change prediction until month rolls. | ☐ |
| F6 | N≥3 → band present and brackets prediction; N<3 → no band keys. | ☐ |
| F7 | All money fields are integer cents. | ☐ |
| F8 | Auth required; cannot read another user’s district forecast. | ☐ |

---

## Nice (non-blocking)

- Query `?asOf=YYYY-MM` for frozen tests.
- Unit tests covering F1–F6 with fixed fixtures.

**Ship gate:** F1–F8 PASS. Mobile UI is a later slice.
