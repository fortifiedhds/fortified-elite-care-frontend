# Design system

## Brand assets and typography

The Open Door identity uses the Fortified Elite Care wordmark and icon assets under `public/brand/`. Use the shared `Brand` component for the public header, portal and authentication layouts. The brand link has an accessible name and the wordmark image is decorative within that named link.

DM Sans is the interface typeface. Fraunces supplies expressive headings. The web fonts are self-hosted through `@font-face` in `src/app/styles.css`. Preserve the fallbacks when changing the font declarations.

| Token                 | Value and purpose                    |
| --------------------- | ------------------------------------ |
| `--ink`               | `#261e38`, primary content text      |
| `--brand`             | `#4b386b`, primary brand color       |
| `--dark`              | `#30234d`, deeper brand surface      |
| `--muted`             | `#5d536b`, supporting copy           |
| `--accent`, `--peach` | `#ffbc9c`, warm accent               |
| `--tint`              | `#ece3f7`, lavender surface          |
| `--border`            | `#e6ddeb`, borders                   |
| `--paper`             | `#fbf8f4`, paper surface             |
| `--cream`             | `#fff8ef`, warmer surface            |
| `--radius`            | `22px`, shared card and panel radius |

## Layout and state

`src/app/styles.css` contains the token declarations, shared primitives, feature rules, responsive layout and motion. It is loaded once in `src/main.tsx`. Public navigation and portal navigation collapse into controlled menus at smaller widths. Cards and form layout also adapt at their respective breakpoints. When changing spacing, verify the home hero, mobile menus, forms, portal side navigation and focus order at narrow and wide widths.

Use the existing button and feedback classes to maintain matching focus and disabled states. Make headings, fieldsets and labels describe the content. Use a status region for loading or confirmation and an alert for errors. The root skip link lands at `#main-content`.

Page entrances and interactive transitions use CSS. The stylesheet contains a `prefers-reduced-motion` rule to minimize animations and transitions. Keep form progress and confirmation available when animation is reduced.

The visual handoff is in the parent workspace at `design/fec-redesign`. Source and browser behavior are the implementation reference for the current routes.
