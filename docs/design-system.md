# Design system

## Brand assets and typography

The Open Door identity uses the Fortified Elite Care wordmark and icon assets under `public/brand/`. Use the shared `Brand` component for the public header, portal and authentication layouts. The brand link has an accessible name and the wordmark image is decorative within that named link.

The standard logo combines the FHDS green open-door mark, teal wordmark and amber accent. The light logo uses white lettering and mark with the amber accent for dark backgrounds. The standalone mark and favicon use the same palette and support the browser's dark colour scheme.

DM Sans is the interface typeface. Fraunces supplies expressive headings. The web fonts are self-hosted through `@font-face` in `src/app/styles.css`. Preserve the fallbacks when changing the font declarations.

| Token              | Value and purpose                                          |
| ------------------ | ---------------------------------------------------------- |
| `--ink`            | `#16302e`, FHDS primary content text                       |
| `--brand`          | `#2e8b57`, FHDS green                                      |
| `--brand-strong`   | `#246e45`, green for small text and filled controls        |
| `--dark`           | `#0b5563`, FHDS teal for primary actions and dark surfaces |
| `--muted`          | `#5d6b68`, FHDS supporting copy                            |
| `--accent`         | `#f2a93b`, FHDS amber                                      |
| `--accent-tint`    | `#fff0d7`, pale amber surface                              |
| `--tint`           | `#e7f2eb`, pale green surface                              |
| `--border`         | `#dde8e3`, FHDS card borders                               |
| `--control-border` | `#728d80`, stronger control boundaries                     |
| `--on-dark`        | `#e4f0ee`, supporting text on dark surfaces                |
| `--paper`          | `#f7faf7`, FHDS background                                 |
| `--radius`         | `22px`, shared card and panel radius                       |

## Layout and state

The palette follows the parent company's src/app/globals.css in the sibling fortifiedhds-web repository. FEC's existing logo assets and typefaces form its product identity. Teal backgrounds and the stronger green shade keep control labels and small text legible. Amber buttons use the shared button.accent class. Semantic status colours and Google's sign-in branding keep their respective roles.

Public copy includes older adults, executives, corporate workers, people in high-stress jobs and adults seeking ongoing routine monitoring. Home, authentication and the care journey use the existing home-visit photograph. The doctor and family portraits complete the image set featuring Black patients and care providers.

`src/app/styles.css` contains the token declarations, shared primitives, feature rules, responsive layout and motion. It is loaded once in `src/main.tsx`. Public navigation and portal navigation collapse into controlled menus at smaller widths. Cards and form layout also adapt at their respective breakpoints. When changing spacing, verify the home hero, mobile menus, forms, portal side navigation and focus order at narrow and wide widths.

Use the existing button and feedback classes to maintain matching focus and disabled states. Make headings, fieldsets and labels describe the content. Use a status region for loading or confirmation and an alert for errors. The root skip link lands at `#main-content`.

Page entrances and interactive transitions use CSS. The stylesheet contains a `prefers-reduced-motion` rule to minimize animations and transitions. Keep form progress and confirmation available when animation is reduced.

The visual handoff is in the parent workspace at `design/fec-redesign`. Source and browser behavior are the implementation reference for the current routes.

See [mobile navigation](mobile-navigation.md) for the rectangular transparent toggle, matching full-screen menu surfaces, responsive breakpoints and keyboard/scroll behaviour.
