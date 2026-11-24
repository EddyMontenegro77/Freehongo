# ADR-0003 — Source-aware list loading

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Private lists exist because the application is local-first. Public lists allow users to share useful character sets. Official lists provide a curated starting path for learners and reduce the effort required to begin practicing.

## Decision

Carry the list source through quiz navigation and resolve the list through the matching local or public-list facade before building quiz questions. Keep one list model while distinguishing the source and permissions.

## Consequences

- A quiz route needs both a list ID and, for non-private lists, a source.
- Public-list loading does not assume the list is present in Dexie.

## Evidence

- `CharacterQuizConfig` contains `source`.
- Quiz pages read the `source` query parameter.
- Quiz facades choose between local and public-list services.

