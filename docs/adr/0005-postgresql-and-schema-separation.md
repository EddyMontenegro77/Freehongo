# ADR-0005 — PostgreSQL and schema separation

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

FreeHonGo needs reliable relational integrity for users, lists, quizzes and statistics, while Japanese source data also contains semi-structured stroke geometry.

## Decision

Use PostgreSQL as the relational database. Keep application/account data in the `app` schema and Japanese reference data in the `japanese` schema. Use JSONB for immutable stroke collections while keeping relational entities normalized to third normal form where practical. Keep kana and kanji source tables separate, but expose their shared identity through `japanese.characters` so application foreign keys can target one unified character relation.

## Rationale

PostgreSQL provides transactions, constraints and dependable relational behavior, while JSONB is appropriate for a stroke collection that is consumed as one immutable character representation rather than queried as independent relational facts.

## Consequences

- Foreign keys and checks protect the application domain.
- The two schemas make ownership/security concerns distinct from public reference data.
- `app` requires RLS and authentication-aware access policies; `japanese` is read-oriented.
- JSONB stroke data is less convenient for querying individual points, but avoids unnecessary normalization of immutable geometry.
- Kana and kanji search paths remain separate because their source tables and metadata differ, while shared application references use the unified character table.

