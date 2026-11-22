# Mobile navigation

## Shared controls and behaviour

The public and portal navigation toggles use menu-toggle: a 44px square touch target, 24px icon, 6px corner radius and subtle border. Its transparent fill shows the navbar’s own colour. The icon switches between Menu and X; accessible labels and aria-expanded describe its state.

The public menu activates at 1050px and below. It slides upward into a fixed panel beneath the sticky navbar and fills the remaining viewport. Its background is the same paper token as the public navbar. It uses the same links and account/care actions as the desktop navigation.

Portal menus activate at 800px and below. The sidebar becomes a fixed panel beneath the portal header, using the same white background. Its explicit dynamic viewport height keeps both short admin menus and long patient menus within the screen. A long menu scrolls independently. Larger viewports keep the normal desktop navigation/sidebar.

On mobile, the logo sits at the left and the hamburger/close control sits at the right. Sign out appears inside the expanded menu, below the navigation links. Desktop keeps its header Sign out button. Hidden duplicate actions are excluded from keyboard navigation and assistive technology.

The navbar stays visible so the logo and close button remain available. Header height and the border determine the panel’s top edge. The portal header height is declared once using --portal-header-height.

## Lifecycle and accessibility

src/shared/hooks/useMobileMenu.ts owns the behaviour for both menus:

- Route-key state closes on navigation, including browser history, and cannot reopen when returning to a previous route.
- Selecting a link closes the menu, including a link to the current page.
- Escape closes it and returns focus to the toggle.
- Opening moves focus to the first navigation link. Tab and Shift+Tab cycle through the available menu/header controls.
- Background content is inert while the menu is open; the previous inert state is preserved on cleanup.
- Body scrolling is locked while open and the previous overflow value is restored on close or unmount. The root element’s overflow is left alone so the sticky header keeps its viewport position.
- Switching to a desktop viewport closes the menu and releases the scroll lock.
- Closed public mobile links are inert and hidden from assistive technology. Desktop links remain accessible.

The public animation is disabled for reduced-motion preferences. Menu backgrounds stay opaque and safe-area bottom padding keeps actions clear of phone controls.

## Verification

test/unit/mobile-navigation.test.tsx covers closed-state access, link parity, focus entry and cycling, Escape, body/inert restoration, same-page links, history, viewport changes, unmount cleanup and portal navigation.

Browser checks verify transparent square toggles, matching navbar/menu backgrounds, viewport bounds at 320px, 390px and tablet widths, opening after scrolling, route changes, scroll preservation and desktop resize cleanup.
