# ADR-0007 — KanjiVG stroke data and the writing model

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

Writing practice needs character stroke order and geometry. KanjiVG provides character SVGs that are suitable as a source for stroke paths.

## Decision

Use KanjiVG SVG files as the source for writing geometry, parse their paths into sampled points, and represent user input as ordered strokes made of points. Render and validate those strokes on canvas, with snapshots for undo/redo.

## Consequences

- The source pipeline can normalize SVG geometry into data usable by both guides and canvas validation.
- Stroke order and stroke count remain explicit in the application model.
- Canvas snapshots are efficient for visual history, while the stroke collection remains the semantic source for validation and persistence.
- Source licensing and attribution must remain documented.

