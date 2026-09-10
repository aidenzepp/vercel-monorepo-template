# templ8 auth-shell design QA

## Evidence

- Source visual truth:
  - `/var/folders/m2/3tmn2jkx63zby9hww7j83ks80000gn/T/codex-clipboard-25ea37b5-e6b7-48f5-bf4a-4d63d21b6fd3.png`
  - `/var/folders/m2/3tmn2jkx63zby9hww7j83ks80000gn/T/codex-clipboard-ca4c40b4-4c39-4b92-a32a-0253ecf7f593.png`
- Final implementation screenshots:
  - `/private/tmp/templ8-sign-in-v2.png`
  - `/private/tmp/templ8-shell-v3.png`
- Combined comparison inputs:
  - `/private/tmp/templ8-sign-in-comparison-v2.png`
  - `/private/tmp/templ8-shell-comparison.png`
- Browser-rendered routes: `http://localhost:3000/sign-in` and `http://localhost:3000/`

The sign-in source is 1674 × 2008 pixels and was normalized to 837 × 1004 pixels, treating it as a 2× capture. The implementation capture is 992 × 964 pixels at a 992-pixel CSS viewport and 1× density. The sidebar source is 690 × 2012 pixels and was normalized to 345 × 1006 pixels. The implementation shell is 1280 × 720 pixels; its first 345 pixels were compared against the normalized sidebar source. The sources and implementation use different viewport aspect ratios, so the comparison emphasizes the fixed-width form, sidebar width, edge offsets, vertical anchoring, and component proportions rather than asserting pixel-perfect full-frame equivalence.

## State and interactions

- Light theme.
- Signed-out sign-in page with enabled anonymous action and disabled Google action.
- Signed-in anonymous session with the expanded sidebar.
- Verified anonymous loading and success states, protected-route redirect, account-menu opening, sign-out, and post-sign-out redirect.
- Browser and server logs showed successful auth requests and no remaining application errors in the final pass.

## Fidelity review

- Fonts and typography: Outfit body text and Roboto Slab display text preserve the established template hierarchy. Heading weight, helper copy, button text, sidebar name, and metadata remain legible without wrapping or truncation.
- Spacing and layout: the 20rem sign-in form, centered composition, top-left wordmark, 16rem sidebar, header placement, and bottom-anchored profile follow the ShareFits references. The missing phone form is an intentional product change: the approved temporary anonymous action occupies the primary action position.
- Colors and tokens: the implementation retains the template's semantic default color instead of copying ShareFits red. The wordmark uses `foreground` and `background`, so it responds to the active theme rather than embedding black and white values.
- Image and asset fidelity: the supplied templ8 vector paths are used directly as the wordmark. The shared Google vector is copied from ShareFits and remains sharp at UI scale.
- Copy and content: the heading and helper copy follow the reference; temporary-account wording accurately describes the implemented Better Auth action. Google is visibly and semantically disabled until configured.
- Accessibility and responsiveness: landmarks, headings, labels, disabled state, focus styles, and named menu controls are present. The fixed-width form is capped by the viewport, and the sidebar uses the existing responsive off-canvas implementation.

Focused comparison was used for the wordmark, form controls, sidebar header, and profile footer because those details are too small to judge reliably in a full-frame view.

## Comparison history

1. Initial sign-in comparison found an oversized wordmark relative to the source. The wordmark height was reduced from 2.75rem to 2rem on sign-in and from 2.25rem to 2rem in the sidebar. The revised evidence is `/private/tmp/templ8-sign-in-comparison-v2.png`.
2. Initial shell comparison found the profile name truncated by a permanently visible sign-out button. Sign-out moved into an accessible account dropdown triggered by the complete profile row. The revised evidence is `/private/tmp/templ8-shell-comparison.png`.

## Findings

No actionable P0, P1, or P2 differences remain. The primary-color difference and anonymous action are intentional template decisions, not unapproved visual drift.

## Follow-up polish

- P3: repeat the visual comparison at a narrow mobile viewport when a browser viewport-control surface is available.

final result: passed
