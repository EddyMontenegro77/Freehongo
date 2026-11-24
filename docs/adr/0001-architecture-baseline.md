# ADR-0001 — Angular frontend with Go API

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

The project needed a maintainable browser application with a clear component architecture and an API with good performance and low latency. Angular was already familiar to the author and naturally encourages component-based organization, standardization and maintainability. Go was selected instead of a Node/Express-style backend for its concurrency model, performance, low latency and relative simplicity after the initial learning curve.

## Decision

Keep the frontend and backend as separate deployable applications communicating through HTTP APIs. Organize the backend through layered responsibilities and dependency composition so the request flow remains easy to follow as the system grows.

## Consequences

- Frontend and backend can be deployed independently.
- CORS, cookies, API URLs and environment configuration must be coordinated.
- Shared contracts need to remain aligned manually.
- The separate deployment model requires coordinated CORS, cookies and environment configuration.

## Evidence

- `freehongo/` contains the Angular application.
- `backend/` contains the Go module and Gin routes.

