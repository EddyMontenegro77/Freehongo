# ADR-0015 — Lazy loading and focused frontend dependencies

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

The application initially loaded too much code at startup, causing slow initial navigation and loading screens even on simple text-oriented pages.

## Decision

Lazy-load secondary routes and defer heavy GSAP/Chart.js code to the features that need it. Use facades and services to separate responsibilities, with Angular dependency injection providing shared service instances. Use Wanakana to normalize Japanese input and answer comparisons.

## Consequences

- Initial bundles and startup work are smaller.
- Feature boundaries and lazy-loaded routes must remain valid.
- Dynamic imports introduce asynchronous failure paths.
- Japanese normalization is centralized instead of reimplemented across quiz flows.

