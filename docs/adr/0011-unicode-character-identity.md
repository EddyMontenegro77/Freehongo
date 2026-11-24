# ADR-0011 — Unicode as character identity

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Japanese characters can have ambiguous readings, meanings and visual similarities. The application needs an unambiguous key for API requests, lists, quiz answers and database relations.

## Decision

Use the normalized Unicode code point string as the character identity. Keep kana and kanji search operations separate where their metadata differs, then unify both through `japanese.characters` for application foreign keys. Use character-detail pages to expose additional readings, meanings, stroke information and metadata when needed.

## Consequences

- Character references are stable across lists, local storage and APIs.
- Searches by Unicode identify exactly one character.
- Human-facing search still needs literal, reading and meaning filters for convenience.
- A character detail view can provide context without changing the identity model.

