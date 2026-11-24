# ADR-0002 — Offline-first local persistence

- Status: Accepted
- Date: 2026-11-24
- Decision type: Confirmed

## Context

The application should be useful before asking a new user to register or log in. Requiring authentication before a user can try local practice creates unnecessary friction. Practice, lists, quiz answers and statistics therefore need to work locally first.

## Decision

Use Dexie as the local persistence layer over the browser's IndexedDB API. Dexie avoids requiring application code to manage IndexedDB's verbose and cumbersome low-level API directly, while still providing a durable browser database. Offer synchronization to the backend when the user wants cloud persistence and authentication/connectivity are available.

## Consequences

- The UI can update without waiting for the network.
- Dexie provides a simpler database abstraction than using IndexedDB directly.
- Sync status and retry behavior are part of the data model.
- Local schema evolution requires Dexie migrations.
- Users can evaluate the product before committing to an account.

## Evidence

- `freehongo/src/app/core/db/` defines the local database.
- `freehongo/src/app/core/sync/` contains synchronization services.

