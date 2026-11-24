# ADR-0006 — Secure cookie authentication and RLS

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

The application stores user data and must prevent unauthorized requests from reaching protected data paths. PostgreSQL also needs a database-level ownership boundary.

## Decision

Use secure, HttpOnly, `SameSite=Lax` cookies for session authentication and enforce authorization through backend authentication middleware plus PostgreSQL row-level security. The backend sets the database user context used by RLS policies.

## Rationale

Cookies avoid exposing session credentials to application JavaScript. `Secure`, `HttpOnly` and `SameSite=Lax` provide a safer default for the web application. Middleware rejects unauthenticated requests before protected handlers, while RLS provides a second authorization boundary inside the database.

## Consequences

- CORS and cookie origin configuration must remain aligned.
- Local development and production require different secure/TLS settings.
- Backend queries must establish the current user context correctly.
- RLS policies add security and testing complexity, but reduce the impact of an accidental data-access bug.

