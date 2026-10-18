# Design System: TruckConnect PH

**Source**: [Full branding doc](../../docs/plans/2026-03-13-branding-design.md)
**Status**: Approved (2026-03-13)

## Quick Reference

**Personality**: Clean & Modern Tech — light, airy, professional
**Tagline**: "Move smarter. Earn more."
**Mode**: Light only
**UI Libraries**: Tailwind CSS + Headless UI

## Fonts

- **Body/Headings**: Inter (Google Fonts)
- **Monospace** (rates, IDs, waybills): JetBrains Mono (Google Fonts)

## Colors

| Role | Token | Hex |
|---|---|---|
| Primary | `emerald-600` | `#059669` |
| Primary Hover | `emerald-700` | `#047857` |
| Primary Light | `emerald-50` | `#ECFDF5` |
| Text Primary | `slate-900` | `#0F172A` |
| Text Secondary | `slate-600` | `#475569` |
| Text Muted | `slate-400` | `#94A3B8` |
| Border | `slate-200` | `#E2E8F0` |
| Background | `slate-50` | `#F8FAFC` |
| Surface | `white` | `#FFFFFF` |
| Error | `red-500` | `#EF4444` |
| Warning | `amber-500` | `#F59E0B` |
| Info | `blue-500` | `#3B82F6` |
| Success | `emerald-500` | `#10B981` |

## Component Patterns

| Component | Key Classes |
|---|---|
| Button Primary | `bg-emerald-600 text-white hover:bg-emerald-700 rounded-md px-4 py-2 font-medium` |
| Button Secondary | `border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md px-4 py-2 font-medium` |
| Card | `bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-6` |
| Card Interactive | above + `hover:shadow-md hover:border-emerald-200 transition-all` |
| Input | `border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500` |
| Badge (Open) | `bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| Badge (Confirmed) | `bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| Badge (In Transit) | `bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| Badge (Delivered) | `bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-medium` |
| Badge (Cancelled) | `bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium` |
| Badge (Truck Ban) | `bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full text-xs font-medium` |
| Nav Active (Mobile) | `text-emerald-600 border-b-2 border-emerald-600` |
| Nav Active (Desktop) | `bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600` |

## Headless UI Usage

| Component | Headless UI | Usage |
|---|---|---|
| Dropdowns | `Menu` | Truck type selector, sort options |
| Modals | `Dialog` | Booking confirmation, load details |
| Tabs | `TabGroup` | Dashboard sections |
| Combobox | `Combobox` | Location search |
| Disclosure | `Disclosure` | Rate breakdown, FAQ |
| Radio Groups | `RadioGroup` | Role selection, truck type |
| Switches | `Switch` | Trucker availability toggle |
| Transitions | `Transition` | Animations |

## Spacing & Layout

- **Grid**: 4px base
- **Cards**: `p-4 md:p-6`
- **Sections**: `py-8 md:py-12`
- **Gaps**: `space-y-4`
- **Border Radius**: Cards `rounded-lg`, Buttons/Inputs `rounded-md`, Avatars/Badges `rounded-full`
- **Shadows**: Cards `shadow-sm`, Modals `shadow-lg`
