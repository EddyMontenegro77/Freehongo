# ADR-0009 — Infinite scroll for paginated collections

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Character and list collections can contain many records. Traditional pagination interrupts exploration and adds unnecessary interaction for browsing.

## Decision

Use an intersection-observer sentinel to request the next page as the user approaches the end of a collection. Keep backend pagination and guard against duplicate requests while loading.

## Consequences

- Browsing feels more continuous and reduces pagination controls.
- Loading, exhaustion and retry states must be visible and accessible.
- Stable ordering is required when requesting subsequent pages.
- Components must preserve current items while the next page loads.

