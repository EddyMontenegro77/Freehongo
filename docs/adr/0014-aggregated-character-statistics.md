# ADR-0014 — Aggregated character statistics

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Recomputing dashboard summaries from every quiz answer would make common dashboard queries more complex and expensive.

## Decision

Maintain `character_stats` as a derived summary updated when quiz evaluation data is inserted. Keep the raw quiz session and answer records for detail, while using the aggregate for fast dashboard metrics.

## Consequences

- Dashboard reads are simpler and faster.
- The aggregate is not a complete historical record.
- Every write path must update the aggregate consistently.
- Rebuild tooling is valuable for repairing or validating derived data.

