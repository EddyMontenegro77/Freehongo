# ADR-0012 — Rate limiting at the API boundary

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Uncontrolled requests could overload database-backed endpoints or abuse email flows such as verification and password recovery.

## Decision

Apply rate-limiting middleware at the API boundary, with stricter policies for authentication and email-related operations. Allow a small margin for legitimate multi-step password-reset and verification flows.

## Consequences

- Database and email-provider traffic is protected from accidental or malicious bursts.
- The frontend must handle `rate_limit_exceeded` clearly.
- Limits need to balance abuse prevention with legitimate retries and multi-request flows.

