---
inclusion: fileMatch
fileMatchPattern: "frontend/src/**/*.tsx"
---

# Mobile Responsive

All UI must work on mobile. When editing any component or page:

- Use Tailwind responsive classes (`sm:`, `md:`, `lg:`).
- Default styles should target mobile first, then scale up.
- No fixed widths that break on small screens — use `w-full`, `max-w-*`, etc.
- Flex/grid layouts should stack on mobile (`flex-col` on small, `flex-row` on `md:` and up).
- Test that text, buttons, and inputs are tap-friendly (min 44px touch targets).
- Sidebars/navs should collapse or become a hamburger menu on mobile.
