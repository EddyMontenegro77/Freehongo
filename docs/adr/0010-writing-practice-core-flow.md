# ADR-0010 — Writing practice as the core learning flow

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Writing practice was the original core of the project, but users should be able to try one character without first creating or selecting a list.

## Decision

Expose direct writing practice for a single character. Keep the writing canvas reusable inside stroke quizzes, while allowing the standalone route to operate independently from list creation.

## Consequences

- A user can test the product with minimal commitment.
- The same canvas, stroke service and validation logic serve standalone practice and quizzes.
- A practiced character can later be added to a list if the user wants a broader study flow.

