# ADR-0004 — Store a quiz list-name snapshot locally

- Status: Accepted
- Date: 2026-11-24
- Decision type: Changed

## Context

Dashboard quiz history resolves list names through local Dexie lists. Public and official lists may not exist in the local list table even though their quizzes can be completed.

## Decision

Store the list name as an optional snapshot on the local quiz-session record. Use the local list name first when available and the snapshot as a fallback.

## Alternatives considered

- Fetch every list name from the backend while rendering history — adds a network dependency and weakens offline history.
- Store a complete copy of the list — unnecessary duplication; history only needs the name.

## Consequences

- Each session stores one small optional string.
- A renamed list may have different current and historical names.
- Existing sessions without the field remain valid.

