# EthioTech design system (frontend)

## Tokens

Source of truth: [`src/styles/tokens.css`](src/styles/tokens.css), bridged to Tailwind via [`src/index.css`](src/index.css) `@theme`.

## Layout utilities

| Class | Use |
|-------|-----|
| `.page-shell` | Max-width page container |
| `.section-eyebrow` | Primary uppercase label |
| `.section-title` | Page/section heading |
| `.section-copy` | Supporting paragraph |
| `.stat-label` | Small uppercase metric label |
| `.surface-panel` / `.hero-shell` | Elevated cards |

## Controls

- **Height:** `h-11` (44px touch target)
- **Radius:** `rounded-xl` for inputs/buttons; `rounded-2xl` for cards
- **Forms:** use `FormField` + `fieldAriaProps` from [`src/components/ui/form-field.tsx`](src/components/ui/form-field.tsx)

## Dialogs

Use native `<dialog>` via [`ConfirmDialog`](src/components/composites/ConfirmDialog.tsx) (also exported as `Dialog` from `ui/dialog`).

## Motion

Respect `prefers-reduced-motion` (global rules in `index.css`).
