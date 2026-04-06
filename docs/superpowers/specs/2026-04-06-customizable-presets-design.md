# Customizable Donation Presets

## Overview

Add per-page customizable donation amount presets with an optional "tier" view that shows names and descriptions alongside amounts. When presets are not configured, pages fall back to the current hardcoded defaults.

## Data Model

### New column on `pages` table

```ts
presets: json().$type<PresetItem[]>()  // nullable, default null
```

### Zod schema (in `src/db/schema.ts`)

```ts
const presetItemSchema = z.object({
  amount: z.number().int().positive(),          // in cents
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(200).optional(),
});

const presetsSchema = z.array(presetItemSchema).min(1).max(10);
```

### Validation rules

- `presets` is nullable — `null` means "use defaults"
- When non-null, validated via `presetsSchema` at API write time (POST/PATCH)
- Amounts are in cents (consistent with `raised`, `goal`, and `DonationConfig.amount`)
- 1–10 presets allowed
- Migration: single `db:push` adds nullable JSON column. No data migration — existing pages get `null`.

## API Layer

### POST/PATCH `/v1/pages`

Accepts `presets` in the request body:

```json
{
  "presets": [
    { "amount": 1000, "name": "Supporter", "description": "Help us keep the lights on" },
    { "amount": 5000, "name": "Champion", "description": "Fund a student's tuition" },
    { "amount": 25000, "name": "Patron", "description": "Full scholarship for a semester" }
  ]
}
```

- Setting `presets` to `null` resets to defaults
- Validation: parse through `presetsSchema` before writing. Return 400 with Zod error details on invalid input.
- `insertPageSchema` / `updatePageSchema` get the `presets` field via drizzle-zod generation. A `.superRefine()` or `.transform()` validates the JSON structure since Drizzle's JSON type is untyped.

### GET `/v1/pages` and `/v1/pages/{id}`

Returns `presets` as-is (null or the array). No transformation.

### OAS schema

Add `presets` property to `src/app/(api)/api/oas/schemas/pages.ts` documenting the JSON array shape with `nullable: true`.

## Frontend Rendering

### Data flow

`DonateButton` already receives the `page` object as a prop. Read `page.presets`, validate with `presetsSchema.safeParse()`. If valid, use parsed presets. If null or invalid, fall back to current `AmountPresets` (`[1000, 2500, 5000, 10000, 25000]`).

### View switching

```ts
const isTierView = parsedPresets && parsedPresets.every(p => p.name);
```

- `isTierView = false` — presets without names (or defaults): current 3-column grid of `DonationAmountSelector` buttons
- `isTierView = true` — all presets have `name`: 1-column vertical tier stack

### Tier view layout

Each tier is a full-width `DonationAmountSelector` (reuses existing component):

```
┌─────────────────────────────────────────┐
│  Supporter                         $10  │
│  Help us keep the lights on             │
├─────────────────────────────────────────┤
│  Champion                          $50  │
│  Fund a student's tuition               │
├─────────────────────────────────────────┤
│  Patron                           $250  │
│  Full scholarship for a semester        │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│            Other amount                 │
└─────────────────────────────────────────┘
```

- Flexbox row: `justify-content: space-between; align-items: center`
- Left: name (`Text` `paragraphSmall`, bold) + description if present (`Text` `paragraphXSmall`, muted)
- Right: formatted amount (`Text` `paragraphSmall`, `fontWeight: 500`)
- Selected/hover states from existing `DonationAmountSelector.module.scss`
- "Other" row: full-width `DonationAmountSelector` with dashed border
- No radio button indicators — selection conveyed through border/background

### Default selection

First preset's amount becomes the initial selection (replaces hardcoded `1000`).

### Frequency

One set of presets regardless of frequency (one-time vs monthly). No per-frequency presets.

## Files to modify

1. `src/db/schema.ts` — add `presets` column and Zod schemas
2. `src/app/(api)/v1/pages/route.ts` — validate presets on POST
3. `src/app/(api)/v1/pages/[id]/route.ts` — validate presets on PATCH
4. `src/app/(api)/api/oas/schemas/pages.ts` — add presets to OAS
5. `src/app/(frontend)/[pageID]/DonateButton.tsx` — consume presets, conditional render
6. `src/components/DonationAmountSelector.tsx` — may need minor adjustments for full-width tier layout

## Out of scope

- Per-frequency presets (one-time vs monthly)
- Preset management UI (configured via API only)
- Preset analytics or tracking
