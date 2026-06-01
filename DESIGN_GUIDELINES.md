# ZKurrent — Design System: "Liquid Ledger"

> Dark cinematic minimalism. KREDZ foundation. Sui accents.
>
> One black canvas. One blue pulse. One teal profit signal.

---

## Design DNA

ZKurrent inherits its structural DNA from [KREDZ](https://kredz.xyz) and its blockchain identity from [Sui](https://sui.io). The result is a monochromatic dark system where cream provides text readability, Sui blue drives interaction, and teal signals profit.

| Source | Contribution |
|--------|-------------|
| **KREDZ** | Dark base (`#000000`), card hierarchy (`#101010`), Manrope font, rounded-3xl cards, glass navbar, cinematic orbs, text gradient pattern |
| **Sui** | Blue primary (`#4DA2FF`), teal profit (`#2DD4BF`), DeepBook purple (`#6C5CE7`), water theme |
| **Lading Logic** | Geist Mono for data, ghost borders, surface container hierarchy, animation curves |

---

## Color System

### Base Palette

| CSS Token | Tailwind Utility | Hex / RGBA | Usage |
|-----------|-----------------|------------|-------|
| `--color-bg` | `bg-bg` | `#000000` | Page background |
| `--color-card` | `bg-card` | `#101010` | Cards, panels, sidebar |
| `--color-card-hover` | `bg-card-hover` | `#151515` | Card hover state |
| `--color-card-elevated` | `bg-card-elevated` | `#1A1A1A` | Dropdowns, tooltips |
| `--color-glass` | — | `rgba(30, 30, 30, 0.8)` | Glass panels (.glass class) |
| `--color-glass-border` | — | `rgba(222, 219, 200, 0.08)` | Glass panel borders |
| `--color-input` | `bg-input` | `#0A0A0A` | Form inputs, progress tracks |

### Accent Palette

| CSS Token | Tailwind Utility | Hex | Usage |
|-----------|-----------------|-----|-------|
| `--color-sui` | `bg-sui`, `text-sui` | `#4DA2FF` | Primary CTA, active states, agent online indicator |
| `--color-sui-hover` | `bg-sui-hover` | `#0072E5` | Button hover, link hover |
| `--color-sui-glow` | — | `rgba(77, 162, 255, 0.12)` | Glow effects on CTAs |
| `--color-profit` | `text-profit` | `#2DD4BF` | Positive PnL, fees earned, APY |
| `--color-profit-dim` | `text-profit-dim` | `rgba(45, 212, 191, 0.6)` | Secondary profit indicators |
| `--color-loss` | `text-loss` | `#FF6B6B` | Negative PnL, IL warnings |
| `--color-loss-dim` | `text-loss-dim` | `rgba(255, 107, 107, 0.6)` | Secondary loss indicators |
| `--color-deepbook` | `text-deepbook` | `#6C5CE7` | DeepBook pool badge, integration indicators |
| `--color-cetus` | `text-cetus` | `#F97316` | Cetus pool badge |
| `--color-turbos` | `text-turbos` | `#8B5CF6` | Turbos pool badge |

### Text Palette

| CSS Token | Tailwind Utility | Value | Usage |
|-----------|-----------------|-------|-------|
| `--color-text` | `text-text` | `rgba(225, 224, 204, 0.9)` | Headings, primary body text |
| `--color-text-secondary` | `text-text-secondary` | `rgba(225, 224, 204, 0.6)` | Descriptions, labels |
| `--color-text-muted` | `text-text-muted` | `rgba(225, 224, 204, 0.4)` | Metadata, timestamps |
| `--color-text-dim` | `text-text-dim` | `rgba(225, 224, 204, 0.2)` | Disabled text, separators |

### Text Gradient

```css
.text-gradient {
  background: linear-gradient(135deg, #4DA2FF, #2DD4BF, #4DA2FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Used for**: Cumulative PnL total, key metrics (max 2 per page). Never body text. Never more than one per card. Only on `font-black` (800 weight).

---

## DEX Indicator Colors

Each DEX gets a distinct color for badges, pool table cells, and position cards:

| DEX | CSS Token | Color | Badge Example |
|-----|-----------|-------|---------------|
| DeepBook | `--color-deepbook` | `#6C5CE7` | `text-deepbook bg-deepbook/10 rounded-full px-2 py-0.5 text-[10px]` |
| Turbos | `--color-turbos` | `#8B5CF6` | `text-turbos bg-turbos/10 ...` |
| Cetus | `--color-cetus` | `#F97316` | `text-cetus bg-cetus/10 ...` |

### Agent Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| Online / Active | `#4DA2FF` (Sui blue) | Agent running, positions active |
| Profitable | `#2DD4BF` (Teal) | Current cycle in profit |
| Losing | `#FF6B6B` (Red) | Current cycle in loss |
| Paused | `rgba(225, 224, 204, 0.2)` (Dim cream) | Agent stopped by user |
| Error | `#FF6B6B` (Red, pulse animation) | Agent in error state |

---

## Typography

### Font Families

| CSS Token | Font Stack | Usage |
|-----------|-----------|-------|
| `--font-manrope` | `'Manrope', 'Inter', system-ui, sans-serif` | All text — headings, body, labels |
| `--font-mono` | `'Geist Mono', 'SF Mono', 'Consolas', monospace` | Pool IDs, wallet addresses, data tables, logs |

**Manrope weights loaded**: 400, 500, 600, 700, 800 (Google Fonts)

### Type Scale

| Level | Class | Size | Weight | Letter Spacing | Usage |
|-------|-------|------|--------|---------------|-------|
| Display | `text-6xl` | 3.75rem | 500 | normal | Dashboard hero metrics (rare) |
| Heading 1 | `text-4xl` | 2.25rem | **800** (`font-black`) | PnL totals, key numbers |
| Heading 2 | `text-3xl` | 1.875rem | 500 | Page titles |
| Heading 3 | `text-2xl` | 1.5rem | **600** (`font-semibold`) | Section headers, card titles |
| Heading 4 | `text-lg` | 1.125rem | 500 | Card subtitles |
| Body | `text-base` | 1rem | 400 | Paragraphs, descriptions |
| Body Small | `text-sm` | 0.875rem | 400 | Secondary descriptions |
| Caption | `text-xs` | 0.75rem | 500 | `tracking-[0.2em]` | Uppercase labels, overlines |
| Micro | `text-[10px]` | 10px | 600 | `tracking-[0.2em]` | Badges, nav links |
| Mono | `text-sm` | 0.875rem | 400 | normal | Pool IDs, addresses, APY columns |

### Typography Rules

1. **Never center body text**. Left-align all paragraphs. Center only display metrics and hero headings.
2. **Uppercase only on micro labels**: `text-[10px]` or `text-xs` with `tracking-[0.2em]`.
3. **font-black (800) reserved for key metrics only**. PnL total, position count, active pools count.
4. **Maximum two font sizes per card**. Title + body. Never a third size.
5. **Text gradient only on font-black numbers**. Never on multi-word text.
6. **Capitalize first letter of every word in card titles**. Sentence case for body text.

---

## Layout & Spacing

| Property | Desktop | Mobile |
|----------|---------|--------|
| Max content width | `max-w-6xl` (72rem) | Full width |
| Horizontal padding | `px-12` | `px-4` |
| Section vertical padding | `py-16` | `py-12` |
| Page top offset | `pt-24` | `pt-24` |
| Grid gap (cards) | `gap-6` | `gap-4` |
| Section divider | `border-t border-text/5` | Same |

---

## Border Radius

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| None | 0 | `rounded-none` | Table headers, input groups |
| Default | 0.25rem (4px) | `rounded` | Inputs, table rows |
| Medium | 0.75rem (12px) | `rounded-xl` | Small cards, tooltips |
| Card | 1.5rem (24px) | `rounded-3xl` | **All cards, panels, modals** |
| Full | 9999px | `rounded-full` | **All buttons, pills, badges** |

---

## Shadows & Glows

```css
/* Card shadow */
.card-shadow {
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2),
              0 1px 18px 0 rgba(0, 0, 0, 0.12);
}

/* Card hover — same, slightly elevated */
.card-shadow-hover {
  box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.25),
              0 2px 20px 0 rgba(0, 0, 0, 0.15);
}

/* Sui blue glow (CTA buttons) */
.glow-sui {
  box-shadow: 0 4px 60px 4px rgba(77, 162, 255, 0.08);
}
.glow-sui:hover {
  box-shadow: 0 4px 80px 8px rgba(77, 162, 255, 0.12);
}

/* Teal glow (profit PnL) */
.glow-profit {
  box-shadow: 0 0 20px rgba(45, 212, 191, 0.12);
}

/* DeepBook glow */
.glow-deepbook {
  box-shadow: 0 0 20px rgba(108, 92, 231, 0.12);
}
```

---

## Core Design Rules

### Rule 1: No-Line Rule

**Never use `border: 1px solid` anywhere.**

Instead use:
- **Surface shift**: `bg-card` → `bg-card-hover` on hover
- **Ghost border**: `outline: 1px solid rgba(225, 224, 204, 0.05)` — uses `outline`, NOT `border`
- **Background contrast**: Section dividers use `border-t border-text/5` (permitted exception for structural division)

```css
/* CORRECT — ghost border */
.card {
  outline: 1px solid rgba(225, 224, 204, 0.05);
}

/* WRONG — solid border */
.card {
  border: 1px solid #333;
}
```

### Rule 2: Surface Hierarchy

Every layer must be visually distinguished through background darkness:

```
Page background → #000000 (deepest)
  └─ Section     → #0A0A0A (slightly lighter for grouping)
       └─ Card    → #101010 (standard card)
            └─ ...  → #151515 (card on hover)
```

Never use the same background color for adjacent elements. Background shifts must be perceptible.

### Rule 3: Glass Morphism

```css
.glass {
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  outline: 1px solid rgba(222, 219, 200, 0.08);
}
```

**Used for**: Navbar only. Never on content cards. Never on modals (use `bg-card-elevated`).

### Rule 4: Gradient Restraint

Gradients are used in exactly three places:

| Element | Gradient |
|---------|----------|
| Primary CTA buttons | `linear-gradient(135deg, #4DA2FF, #0072E5)` |
| Text highlight (key metrics) | `linear-gradient(135deg, #4DA2FF, #2DD4BF, #4DA2FF)` via `.text-gradient` |
| PnL ring graph (SVG) | `#4DA2FF` → `#2DD4BF` |

Never: gradient backgrounds on cards, gradients on body text, gradients as section decorations.

### Rule 5: Data Display

| Data Type | Format | Example |
|-----------|--------|---------|
| TVL / Volume | Compact with $ | `$12.5M`, `$842K` |
| APY | Percentage, 1 decimal | `14.2%`, `8.5%` |
| PnL (positive) | `+$` prefix, teal | `+$4,250.50` |
| PnL (negative) | `-$` prefix, red | `-$1,200.75` |
| Fees earned | Compact with $ | `$320.50` |
| Position count | Raw integer | `7 active` |
| Duration | Human readable | `3d 12h`, `2h 45m` |
| Pool ID / Address | Mono, truncated | `0x4DA2...Ff8a` |

---

## Components

### Button

```tsx
// Variants
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'lg' | 'md' | 'sm';

// Primary — Sui blue fill, white text, glow on hover
<button className="
  rounded-full bg-sui hover:bg-sui-hover text-white font-medium
  transition-all duration-300
  px-6 py-3     /* lg */
  px-5 py-2.5   /* md */
  px-4 py-2     /* sm */
  disabled:opacity-50 disabled:cursor-not-allowed
  hover:shadow-[0_4px_80px_8px_rgba(77,162,255,0.12)]
">

// Secondary — dark bg, ghost border, cream text
<button className="
  rounded-full bg-[#1A1A1A] text-text-muted font-medium text-xs
  outline outline-1 outline-text/5
  hover:bg-card-hover hover:text-text
  transition-colors duration-300
  px-5 py-2
  disabled:opacity-50 disabled:cursor-not-allowed
">

// Danger — for close/exit positions
<button className="
  rounded-full bg-loss/10 text-loss font-medium
  hover:bg-loss/20
  transition-colors duration-300
  px-5 py-2
">
```

### Card

```tsx
<div className="
  bg-card hover:bg-card-hover
  rounded-3xl p-6 md:p-8
  outline outline-1 outline-text/5
  transition-colors duration-300
">
```
All cards share this base. Variations:

```tsx
// Highlighted card (selected, active, profitable)
<div className="... ring-1 ring-sui/20">

// Danger card (IL warning)
<div className="... ring-1 ring-loss/20">

// Metric card (compact, for KPI grids)
<div className="bg-card rounded-3xl p-6 outline outline-1 outline-text/5">
  <span className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
    Total Value Locked
  </span>
  <p className="text-4xl font-black text-gradient mt-2">$842K</p>
</div>
```

### Badge

```tsx
// DEX badge
<span className="
  text-deepbook bg-deepbook/10
  rounded-full px-2 py-0.5
  text-[10px] font-semibold uppercase tracking-[0.2em]
">DeepBook</span>

// Status badge
<span className="
  text-sui bg-sui/10
  rounded-full px-2 py-0.5
  text-[10px] font-semibold uppercase tracking-[0.2em]
">Active</span>

// PnL badge (positive)
<span className="
  text-profit bg-profit/10
  rounded-full px-2 py-0.5
  text-[10px] font-semibold
">+$320.50</span>
```

### Data Table

```tsx
<table className="w-full">
  <thead>
    <tr className="text-text-muted text-xs uppercase tracking-[0.2em]">
      <th className="text-left py-3 px-4 font-medium">Pool</th>
      <th className="text-right py-3 px-4 font-medium">TVL</th>
      <th className="text-right py-3 px-4 font-medium">Volume 24h</th>
      <th className="text-right py-3 px-4 font-medium">APY</th>
      <th className="text-right py-3 px-4 font-medium">Score</th>
    </tr>
  </thead>
  <tbody>
    {/* Row: bg-card, border-b border-text/5 */}
  </tbody>
</table>
```

### Pool Table Row

```tsx
<tr className="border-b border-text/5 hover:bg-card-hover transition-colors">
  <td className="py-4 px-4">
    <div className="flex items-center gap-3">
      <DexBadge dex="deepbook" />
      <span className="text-text font-medium">SUI / USDC</span>
    </div>
  </td>
  <td className="text-right py-4 px-4 text-text-secondary font-mono text-sm">$12.5M</td>
  <td className="text-right py-4 px-4 text-text-secondary font-mono text-sm">$842K</td>
  <td className="text-right py-4 px-4 text-profit font-mono text-sm">14.2%</td>
  <td className="text-right py-4 px-4">
    <span className="text-sui font-semibold">94</span>
    <span className="text-text-muted">/100</span>
  </td>
</tr>
```

### Position Card

```tsx
<div className="bg-card rounded-3xl p-6 outline outline-1 outline-text/5">
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <DexBadge dex="turbos" />
      <span className="text-text font-semibold">SUI / USDC</span>
    </div>
    <StatusBadge status="active" />
  </div>

  {/* Range */}
  <div className="mb-4">
    <span className="text-xs text-text-muted uppercase tracking-[0.2em]">Range</span>
    <p className="text-text font-mono text-sm mt-1">1.20 — 1.50</p>
  </div>

  {/* Metrics grid */}
  <div className="grid grid-cols-3 gap-4">
    <div>
      <span className="text-xs text-text-muted uppercase tracking-[0.2em]">Fees</span>
      <p className="text-profit font-mono text-sm mt-1">+$320.50</p>
    </div>
    <div>
      <span className="text-xs text-text-muted uppercase tracking-[0.2em]">IL</span>
      <p className="text-loss font-mono text-sm mt-1">-$45.20</p>
    </div>
    <div>
      <span className="text-xs text-text-muted uppercase tracking-[0.2em]">Net PnL</span>
      <p className="text-profit font-mono text-sm mt-1">+$275.30</p>
    </div>
  </div>

  {/* Action */}
  <button className="mt-4 w-full rounded-full bg-loss/10 hover:bg-loss/20 text-loss font-medium text-sm py-2 transition-colors">
    Close Position
  </button>
</div>
```

---

## Pages

### Dashboard (`/`)

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR (glass)                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Agent Status Bar                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐     │
│  │ Online  │ │ 7 Active│ │ $842K   │ │ +$4,250  │     │
│  │ ● blue  │ │ Pos.    │ │ TVL     │ │ Cum. PnL │     │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘     │
│                                                          │
│  ┌──────────────────────────┐ ┌──────────────────────┐  │
│  │     PnL Chart             │ │   Active Positions   │  │
│  │   (Recharts AreaChart)    │ │   ┌──────────────┐   │  │
│  │                           │ │   │ PositionCard  │   │  │
│  │   Cumulative PnL over     │ │   └──────────────┘   │  │
│  │   time. Teal fill,        │ │   ┌──────────────┐   │  │
│  │   gradient under line.    │ │   │ PositionCard  │   │  │
│  │                           │ │   └──────────────┘   │  │
│  └──────────────────────────┘ └──────────────────────┘  │
│                                                          │
│  Recent Activity (SSE feed)                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 12:34 — Opened Turbos SUI/USDC @ [1.20, 1.50]    │   │
│  │ 11:58 — Closed DeepBook ETH/SUI | Net: +$320.50  │   │
│  │ 11:22 — Screened 14 pools across 3 DEXes         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Pools (`/pools`)

```
┌─────────────────────────────────────────────────────────┐
│  Pool Screener                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [Filter: All DEXes ▾] [Token Pair: All ▾]       │    │
│  │ [Screen Now] ← blue CTA                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Pool          │ TVL     │ 24h Vol │ APY   │ Scr │    │
│  │───────────────│─────────│─────────│───────│─────│    │
│  │ 🟣 SUI/USDC  │ $12.5M  │ $842K   │ 14.2% │ 94  │    │
│  │ 🟣 ETH/SUI   │ $8.2M   │ $620K   │ 11.8% │ 87  │    │
│  │ 🟠 SUI/USDC  │ $5.1M   │ $310K   │ 18.5% │ 82  │    │
│  │ 🟣 BTC/SUI   │ $3.8M   │ $195K   │ 9.2%  │ 71  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Positions (`/positions`)

```
┌─────────────────────────────────────────────────────────┐
│  Active Positions (4)          Closed Positions (12)     │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ PositionCard  │ │ PositionCard  │ │ PositionCard  │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│  ┌──────────────┐                                       │
│  │ PositionCard  │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### Strategy (`/strategy`)

```
┌─────────────────────────────────────────────────────────┐
│  Agent Configuration                                     │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Agent Status: ● Active          [Pause Agent]     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Risk Tolerance                                     │    │
│  │ [━━━━━━━━━━○━━━━━━━━━━] 65 / 100                 │    │
│  │ Conservative                    Aggressive        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Target APY:    15.0%                              │    │
│  │ Max IL:        5.0%                               │    │
│  │ Rebalance:     Every 60 minutes                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┘    │
│  │ Pool Allowlist                                      │    │
│  │ ☑ DeepBook SUI/USDC                                 │    │
│  │ ☑ Turbos SUI/USDC                                   │    │
│  │ ☑ Cetus ETH/SUI                                     │    │
│  │ ☐ Turbos BTC/SUI                                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [Save Configuration] ← blue CTA                        │
└─────────────────────────────────────────────────────────┘
```

---

## Navbar

```tsx
<nav className="glass fixed top-0 w-full z-50">
  <div className="max-w-6xl mx-auto px-12 py-4 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded bg-gradient-to-br from-sui to-profit" />
      <span className="text-text font-semibold text-sm">zkurrent</span>
    </div>

    {/* Nav Links */}
    <div className="bg-black rounded-full px-3 py-1.5 flex gap-1">
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/pools">Pools</NavLink>
      <NavLink to="/positions">Positions</NavLink>
      <NavLink to="/strategy">Strategy</NavLink>
    </div>

    {/* Wallet + Status */}
    <div className="flex items-center gap-3">
      <AgentStatusDot />
      <ConnectButton />
    </div>
  </div>
</nav>
```

---

## Icons

All icons from `lucide-react`. Rules:

- Stroke only, never filled
- Color: inherit from parent text color
- Sizes: `w-4 h-4` (inline), `w-5 h-5` (button), `w-6 h-6` (feature), `w-8 h-8` (hero)
- Never emojis

| Context | Icons |
|---------|-------|
| Navigation | `LayoutDashboard`, `Waves`, `WalletCards`, `Settings2` |
| Actions | `Plus`, `X`, `ChevronRight`, `ChevronDown`, `RefreshCw` |
| Status | `Circle` (filled with status color), `AlertTriangle`, `CheckCircle2` |
| Data | `TrendingUp`, `TrendingDown`, `DollarSign`, `Percent` |
| DEX | `BookOpen` (DeepBook), `Gauge` (Turbos), `Anchor` (Cetus) |

---

## Animations

### Core Easing

```javascript
const ease = [0.16, 1, 0.3, 1]; // Primary bezier for all animations
```

### Page Transitions

```tsx
// Framer Motion — AnimatePresence wrapper
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
  exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
>
```

### Entrance Stagger

```tsx
// Cards stagger in
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
  }}
>
  {cards.map((card, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } }
      }}
    >
      {card}
    </motion.div>
  ))}
</motion.div>
```

### Micro Interactions

```css
/* Card hover */
transition-colors duration-300
hover:bg-card-hover

/* Button icon spacing */
transition-all duration-200
hover:gap-3  /* icon pushes away from text */

/* Number animation */
/* JS counter: 0 → target over 1.5s, 16ms interval */
```

### PnL Ring (Score Ring)

```tsx
// SVG 192x192, circle r=80, strokeWidth=10
<svg viewBox="0 0 192 192">
  <linearGradient id="pnlGradient" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stopColor="#4DA2FF" />
    <stop offset="100%" stopColor="#2DD4BF" />
  </linearGradient>
  <circle cx="96" cy="96" r="80" fill="none"
    stroke="rgba(225,224,204,0.08)" strokeWidth="10" />
  <motion.circle cx="96" cy="96" r="80" fill="none"
    stroke="url(#pnlGradient)" strokeWidth="10"
    strokeLinecap="round"
    strokeDasharray={2 * Math.PI * 80}
    initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
    animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - percentage / 100) }}
    transition={{ duration: 1.5, ease }} />
</svg>
```

---

## Cinematic Atmosphere (Background)

```css
/* 3 fixed orbs + gradient overlay, behind all content */
.cinematic-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: #000000;
}

.cinematic-orb-1 {
  position: fixed;
  top: -20%;
  right: -10%;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(77,162,255,0.06), transparent 70%);
  filter: blur(120px);
  pointer-events: none;
}

.cinematic-orb-2 {
  position: fixed;
  bottom: -20%;
  left: -10%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(45,212,191,0.04), transparent 70%);
  filter: blur(120px);
  pointer-events: none;
}

.cinematic-orb-3 {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at 50% 50%, rgba(77,162,255,0.03) 0%, transparent 65%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.cinematic-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 4, 31, 0.65) 0%,
    rgba(0, 4, 31, 0.4) 40%,
    rgba(0, 4, 31, 0.85) 100%
  );
  pointer-events: none;
}
```

---

## Scrollbar

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0A0A0A; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
```

---

## Complete `index.css` Template

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

@theme {
  /* Base */
  --color-bg: #000000;
  --color-card: #101010;
  --color-card-hover: #151515;
  --color-card-elevated: #1A1A1A;
  --color-input: #0A0A0A;

  /* Accent */
  --color-sui: #4DA2FF;
  --color-sui-hover: #0072E5;
  --color-profit: #2DD4BF;
  --color-loss: #FF6B6B;
  --color-deepbook: #6C5CE7;
  --color-cetus: #F97316;
  --color-turbos: #8B5CF6;

  /* Text */
  --color-text: rgba(225, 224, 204, 0.9);
  --color-text-secondary: rgba(225, 224, 204, 0.6);
  --color-text-muted: rgba(225, 224, 204, 0.4);
  --color-text-dim: rgba(225, 224, 204, 0.2);

  /* Glass */
  --color-glass: rgba(30, 30, 30, 0.8);
  --color-glass-border: rgba(222, 219, 200, 0.08);

  /* Fonts */
  --font-manrope: 'Manrope', 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'SF Mono', 'Consolas', monospace;

  /* Radius */
  --radius-card: 1.5rem;
}

/* Base */
body {
  font-family: var(--font-manrope);
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}

/* Glass utility */
.glass {
  background: var(--color-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  outline: 1px solid var(--color-glass-border);
}

/* Text gradient */
.text-gradient {
  background: linear-gradient(135deg, #4DA2FF, #2DD4BF, #4DA2FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Logo Specification

**Mark**: A stylized continuous wave formed by two rising chart arrows converging at the crest. The wave reads as both water (Sui) and a financial uptrend (DeFi). Pure gradient fill, no outlines.

```
     ╱╲
    ╱  ╲
   ╱    ╲
──╱      ╲──
```

**Construction**:
- Single continuous bezier path
- Two segments: left arrow entering the wave, right arrow exiting the wave
- Crest at 60% horizontal position
- Gradient: `#4DA2FF` (bottom left) → `#2DD4BF` (top) → `#4DA2FF` (bottom right)
- Aspect ratio: 2:1 (wider than tall)

**Wordmark**: `zkurrent` in Manrope, weight 700, all lowercase, Sui blue (`#4DA2FF`), no letter-spacing.

**Favicon**: The wave mark without the text, 32x32, pure `#4DA2FF` on transparent.

**Variants**:
- Light: White mark on transparent (for dark footer)
- Dark: Sui blue mark on transparent (for light backgrounds — rare)
- Monogram: Single `t` in Manrope 800 with text-gradient (for small spaces)

---

## Design Checklist

Before any component is considered complete:

- [ ] No `border: 1px solid` anywhere (ghost borders only)
- [ ] No hardcoded hex colors (use `@theme` tokens)
- [ ] No inline styles (`style={{}}`)
- [ ] No bare Tailwind color names (`bg-blue-500`)
- [ ] No more than 2 font sizes per card
- [ ] All buttons: `rounded-full`
- [ ] All cards: `rounded-3xl bg-card`
- [ ] Text gradient only on `font-black` (800) numbers
- [ ] Body text left-aligned, never centered
- [ ] All icons from lucide-react, stroke only, no emojis
- [ ] All numbers formatted (compact, $, %, mono font)
- [ ] Hover states on all interactive elements
- [ ] Transition durations: 200ms (micro), 300ms (cards), 400ms (pages)
