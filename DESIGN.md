# Arbyter Design Language

Arbyter is a cinematic runtime-governance product, not a generic SaaS dashboard.

## Visual direction

- Luminous black-space foundation with restrained blue/white energy.
- Spatial compositions over card grids.
- 3D systems should explain architecture, policy flow, discovery, or runtime decisions.
- Glass is used as material/depth, not as a default container style.
- Typography is large, tight, editorial, and asymmetric.
- Monospace metadata reinforces infrastructure/runtime context.
- Motion must explain state, spatial relationships, or interaction. Decorative motion is rejected when it adds noise.

## Motion rules

- Use strong custom easing rather than weak browser defaults.
- UI interaction motion stays short and responsive.
- Animate transform and opacity where possible.
- Prefer interruptible transitions for frequent interactions.
- Gate pointer/hover effects to fine pointers.
- Respect prefers-reduced-motion.
- Marketing scroll motion can be longer when it teaches the product.
- Never animate simply because an element can move.

## Spatial language

Organization -> Arbyter -> Agent -> Tool/API/MCP -> Business System

Runtime decision states are first-class visual states:
ALLOW / BLOCK / APPROVAL / AUDIT

## Typography

- Display: Manrope.
- Runtime metadata: Geist Mono.
- Strong size contrast and short line lengths.
- Avoid default SaaS typography patterns and dense card-first layouts.

## Reference influences

- Emil Kowalski's animation guidance informs motion restraint, easing, interruptibility, and performance.
- taste-skill informs deliberate design-language selection, motion/density decisions, and pre-flight review.
- Impeccable informs anti-pattern avoidance, responsive/accessibility review, and design-system consistency.
- Pretext is a reference for text measurement/layout quality; it is not added as a dependency unless dynamic text measurement becomes an actual product requirement.

These references inform implementation decisions; Arbyter's visual identity remains its own.
