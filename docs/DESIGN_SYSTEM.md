# CashFlow Mate — Material 3 Expressive Design System

## 1. Design Philosophy: Material 3 Expressive for Zimbabwean Traders

CashFlow Mate is designed according to **Google's Material 3 Expressive** guidelines.
For small traders in Zimbabwe (managing EcoCash queues, market stall rushes, and tuckshop inventory), software must be:
- **Calm & Trustworthy:** Financial numbers must never feel chaotic or confusing.
- **Approachable & Non-Intimidating:** Clear labels instead of accounting jargon.
- **Tactile & Responsive:** High-contrast buttons, tactile feedback, and distinct container elevations.
- **Anti-Vibecoding:** Real SVG icons (Lucide), honest financial data, zero decorative AI watermarks, zero fake metrics.

---

## 2. Color System & Semantic Roles

The color system uses CSS Custom Properties mapping to Material 3 Expressive tonal palettes.

### 2.1 Core Semantic Roles

| Token | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| `--md-sys-color-primary` | `#155A8A` | `#82C2FF` | Main brand identity & primary actions |
| `--md-sys-color-on-primary` | `#FFFFFF` | `#003253` | Text/icons on primary |
| `--md-sys-color-primary-container` | `#D0E4FF` | `#004B76` | Selected navigation & prominent chips |
| `--md-sys-color-on-primary-container` | `#001D36` | `#D0E4FF` | Content on primary container |
| `--md-sys-color-secondary` | `#4F606E` | `#B6C8D8` | Secondary controls & filters |
| `--md-sys-color-secondary-container` | `#D2E4F5` | `#374856` | Inactive tabs & subtle chips |
| `--md-sys-color-tertiary` | `#1A6A55` | `#78D8BD` | Positive cash flow & balance metrics |
| `--md-sys-color-tertiary-container` | `#BCEEDE` | `#00513F` | Highlight badges for confirmed profits |
| `--md-sys-color-surface` | `#F9F9FC` | `#111417` | Base application canvas |
| `--md-sys-color-surface-container-lowest` | `#FFFFFF` | `#0C0F12` | Elevated cards in light mode |
| `--md-sys-color-surface-container-low` | `#F3F4F7` | `#191C20` | Section backgrounds |
| `--md-sys-color-surface-container` | `#EDEEF2` | `#1D2024` | Metric cards & table rows |
| `--md-sys-color-surface-container-high` | `#E7E8EC` | `#272A2F` | Hover states & modal surfaces |
| `--md-sys-color-surface-container-highest`| `#E1E2E6` | `#32353A` | Tooltips, popovers, active controls |
| `--md-sys-color-outline` | `#73777F` | `#8D9199` | Component borders & dividers |
| `--md-sys-color-outline-variant` | `#C3C6CF` | `#43474E` | Subtle card borders |

### 2.2 Financial Meaning Tokens

| Role | Light | Dark | Meaning |
| :--- | :--- | :--- | :--- |
| `--color-finance-inflow` | `#0F7E4A` | `#41D188` | Confirmed sales, receipts, incoming cash |
| `--color-finance-outflow` | `#B82828` | `#FF8882` | Recorded business expenses, outflows |
| `--color-finance-neutral` | `#4A5F70` | `#93A8B9` | Internal transfers between owned accounts |
| `--color-finance-review` | `#A65E00` | `#FFB74D` | Uncategorized or pending review items |
| `--color-finance-flagged` | `#BA1A1A` | `#FFB4AB` | Duplicate alert or data anomaly |

---

## 3. Typography System

The typography scale uses high-legibility sans-serif with strict **tabular numbers** (`font-variant-numeric: tabular-nums`) for currency values and financial tables.

| Role | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `57px` | `400` | `64px` | Hero landing figures |
| **Display Medium** | `45px` | `400` | `52px` | Primary marketing statements |
| **Headline Large** | `32px` | `500` | `40px` | Main page titles |
| **Headline Medium** | `28px` | `500` | `36px` | Section headers |
| **Headline Small** | `24px` | `500` | `32px` | Card headers & modal titles |
| **Title Large** | `22px` | `500` | `28px` | Key metric values |
| **Title Medium** | `16px` | `600` | `24px` | Sub-section headings |
| **Body Large** | `16px` | `400` | `24px` | Explanations & AI insights |
| **Body Medium** | `14px` | `400` | `20px` | Table content & descriptions |
| **Body Small** | `12px` | `400` | `16px` | Helper text & captions |
| **Label Large** | `14px` | `600` | `20px` | Primary button labels |
| **Label Medium** | `12px` | `600` | `16px` | Chips, tags & table headers |

---

## 4. Shape Scale (Material 3 Expressive)

- **Extra Small (`4px`)**: Checkboxes, subtle markers.
- **Small (`8px`)**: Compact chips, tooltips, inline badges.
- **Medium (`12px`)**: Form inputs, small cards, dropdown menus.
- **Large (`18px`)**: Financial metric cards, transaction list items.
- **Extra Large (`24px - 28px`)**: Floating action cards, dialogs, bottom sheets.
- **Full Pill (`9999px`)**: Primary action buttons, filter capsules, status badges.

---

## 5. Responsive Layout Architecture

- **Mobile Viewport (`< 640px`)**:
  - Pinned Bottom Navigation bar (Home, Transactions, Import, Insights, More).
  - Compact cards with vertical stacking.
  - Large touch targets (min 48px × 48px).
- **Tablet Viewport (`640px - 1024px`)**:
  - Slim Navigation Rail on left edge.
  - Two-column dashboard layout.
- **Desktop Viewport (`> 1024px`)**:
  - Full Navigation Drawer with quick business switcher.
  - Multi-column grid layout (Summary KPIs -> Cash Flow Chart + Expense Breakdown -> Actionable Insights + Recent Transactions).
