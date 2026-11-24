# ADR-0016 — Minimal visual language

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

The product needs a visual identity aligned with Japanese study while keeping the interface clean and formal.

## Decision

Use the bittersweet accent as a reference to Japanese autumn, combined with a restrained palette and minimal decoration. Rounded borders are reserved for interactive components such as buttons, inputs and controls. Static surfaces and informational sections should generally avoid rounded borders to preserve a formal, clean appearance. Reusable components own the shared visual language.

For responsive layouts, use segmented controls on larger screens and switch to select controls on small screens. Both components expose compatible option/value inputs, making the interchange straightforward while preventing filter groups from breaking or becoming visually crowded.

## Consequences

- Screens remain visually coherent across practice, quizzes, lists and documentation.
- The design communicates cleanliness, formality and elegance.
- Interactive elements are easier to distinguish from static content through shape and affordance.
- Responsive controls remain readable without forcing wide segmented groups into narrow layouts.
- New components should use the shared tokens rather than introducing isolated colors or shapes.

