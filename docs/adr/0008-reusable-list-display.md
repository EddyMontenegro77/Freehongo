# ADR-0008 — Reusable list display

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Lists are displayed in several flows: management, character selection and quiz selection. Duplicating list cards and filters would make behavior and visual consistency harder to maintain.

## Decision

Use one `ListsDisplay` component with modes that change available actions and emitted events. Reuse the same list presentation for managing lists, selecting characters and starting quizzes.

## Consequences

- Shared rendering and filtering behavior stays consistent.
- The component needs explicit modes and careful boundaries so management actions do not leak into selection flows.
- Tests must cover each supported mode.

