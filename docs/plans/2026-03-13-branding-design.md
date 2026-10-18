# TruckConnect PH — Branding & Design System

**Date**: 2026-03-13
**Status**: Approved
**Stack**: Tailwind CSS + Headless UI, Light mode only

---

## Brand Identity

**Name:** TruckConnect PH
**Tagline:** "Move smarter. Earn more."
**Voice:** Clean, direct, helpful. No jargon. Bilingual-ready (EN primary, Tagalog-friendly).
**Personality:** Clean & Modern Tech — light, airy, professional. "The Grab of trucking."
**Logo concept:** Minimal truck silhouette formed by two connected arrows (two-sided marketplace). Geometric lines matching Inter font family.

---

## Color System

### Primary Palette

| Token | Color | Hex | Usage |
|---|---|---|---|
| `emerald-600` | Emerald Green | `#059669` | Primary buttons, CTAs, success states, earnings |
| `emerald-700` | Deep Emerald | `#047857` | Hover states, active elements |
| `emerald-50` | Mint Wash | `#ECFDF5` | Light backgrounds, cards, highlights |

### Neutral Palette

| Token | Color | Hex | Usage |
|---|---|---|---|
| `slate-900` | Near Black | `#0F172A` | Headings, primary text |
| `slate-600` | Dark Gray | `#475569` | Body text, descriptions |
| `slate-400` | Mid Gray | `#94A3B8` | Placeholders, disabled text |
| `slate-200` | Light Gray | `#E2E8F0` | Borders, dividers |
| `slate-50` | Off White | `#F8FAFC` | Page backgrounds |
| `white` | White | `#FFFFFF` | Cards, modals, inputs |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `red-500` | `#EF4444` | Errors, cancellations, truck ban warnings |
| `amber-500` | `#F59E0B` | Warnings, pending states, truck ban alerts |
| `blue-500` | `#3B82F6` | Info, links, tracking/GPS elements |
| `emerald-500` | `#10B981` | Success, confirmed, delivered, earnings |

---

## Typography

### Font Stack

| Role | Font | Weight | Tailwind Class |
|---|---|---|---|
| Headings | Inter | 700 (Bold) | `font-bold` |
| Subheadings | Inter | 600 (Semibold) | `font-semibold` |
| Body | Inter | 400 (Regular) | `font-normal` |
| Labels/Caps | Inter | 500 (Medium) | `font-medium` |
| Monospace (rates, IDs) | JetBrains Mono | 400 | `font-mono` |

### Type Scale (mobile-first)

| Element | Mobile | Desktop | Tailwind |
|---|---|---|---|
| Page title | 24px | 30px | `text-2xl md:text-3xl` |
| Section heading | 20px | 24px | `text-xl md:text-2xl` |
| Card title | 16px | 18px | `text-base md:text-lg` |
| Body | 14px | 16px | `text-sm md:text-base` |
| Caption/Label | 12px | 14px | `text-xs md:text-sm` |
| Rate/Price display | 28px | 36px | `text-3xl md:text-4xl font-mono` |

---

## Component Design Language

### Foundation

- **Border Radius:** `rounded-lg` (8px) cards/modals, `rounded-md` (6px) buttons/inputs, `rounded-full` avatars/badges
- **Shadows:** `shadow-sm` for cards, `shadow-lg` for elevated elements (modals, dropdowns)
- **Spacing:** 4px grid. Cards `p-4 md:p-6`, sections `py-8 md:py-12`, elements `space-y-4`

### Buttons

| Type | Tailwind Classes | Usage |
|---|---|---|
| Primary | `bg-emerald-600 text-white hover:bg-emerald-700 rounded-md px-4 py-2 font-medium` | CTAs: Post Load, Accept, Confirm |
| Secondary | `border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md px-4 py-2 font-medium` | Cancel, Filter, Back |
| Danger | `bg-red-500 text-white hover:bg-red-600 rounded-md px-4 py-2 font-medium` | Delete, Reject, Report |
| Ghost | `text-emerald-600 hover:bg-emerald-50 rounded-md px-4 py-2 font-medium` | Links, inline actions |

### Cards

```
bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6
hover:shadow-md hover:border-emerald-200 transition-all  (interactive cards)
```

### Inputs

```
border border-slate-300 rounded-md px-3 py-2 text-sm
focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
placeholder:text-slate-400
```

### Status Badges

| Status | Tailwind Classes |
|---|---|
| Open | `bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| Confirmed | `bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| In Transit | `bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| Delivered | `bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-medium` |
| Cancelled | `bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| Truck Ban | `bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full text-xs font-medium` |

### Navigation

- **Mobile:** Bottom tab bar (5 tabs max). Active: `text-emerald-600 border-b-2 border-emerald-600`
- **Desktop:** Left sidebar. Active: `bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600`

---

## Tailwind Config Customizations

```typescript
// tailwind.config.ts
{
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
}
```

No custom color definitions needed — all colors use Tailwind's built-in emerald, slate, red, amber, and blue palettes.

---

## Headless UI Components

Use Headless UI for accessible, unstyled interactive components:

| Component | Headless UI | Usage |
|---|---|---|
| Dropdowns | `Menu` | Truck type selector, sort options |
| Modals | `Dialog` | Booking confirmation, load details |
| Tabs | `TabGroup` | Dashboard sections, available/backhaul loads |
| Combobox | `Combobox` | Location search (with Google Places) |
| Disclosure | `Disclosure` | Rate breakdown accordion, FAQ |
| Transitions | `Transition` | Modal/dropdown animations |
| Radio Groups | `RadioGroup` | Role selection, truck type picker |
| Switches | `Switch` | Availability toggle for truckers |

---

## Impeccable Design Review Checkpoints

Apply after building each user story's UI:

| Phase | Commands | Purpose |
|---|---|---|
| After component build | `/audit`, `/normalize` | Consistency check |
| Before user story completion | `/polish`, `/clarify` | UX refinement |
| Before launch | `/optimize`, `/harden` | Performance + edge cases |
| Onboarding flows | `/onboard` | First-time user experience |
