# Architecture

This document describes the architecture currently observable in the codebase. Historical motivations that are not recorded in the repository are listed as reconstructed in the ADRs.

## System context

```mermaid
flowchart TB
    User[User] --> Web[Angular web application]
    Web <--> Local[(IndexedDB via Dexie)]
    Web --> API[FreeHonGo Go API]
    API --> DB[(PostgreSQL / Supabase)]
    API --> Storage[Supabase Storage]
    API --> Google[Google OAuth]
    API --> Resend[Resend email service]
```

## Frontend layers

```mermaid
flowchart TD
    Pages[Route pages] --> Components[Reusable components]
    Pages --> Facades[Feature facades]
    Components --> Services[Core and shared services]
    Facades --> Services
    Services --> Dexie[DatabaseService / Dexie]
    Services --> Http[HttpClient + credentials interceptor]
    Http --> API[Backend API]
```

- `features/`: feature-specific pages, components, facades and services.
- `shared/components/`: reusable UI primitives.
- `shared/services/`: authentication, theme, Japanese data and cross-feature behavior.
- `core/db/`: Dexie database and local persistence.
- `core/sync/`: list, quiz-session and statistics synchronization.
- `core/http/`: shared HTTP concerns.

Secondary routes are lazy-loaded. Chart.js and GSAP-heavy behavior are loaded only where needed.

## Offline-first practice flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Angular UI
    participant Store as Dexie
    participant Sync as Sync services
    participant API as Go API
    participant DB as PostgreSQL

    User->>UI: Complete evaluation
    UI->>Store: Save session, answers and stats
    Store-->>UI: Update dashboard immediately
    UI->>Sync: Schedule synchronization
    Sync->>Store: Read pending records
    Sync->>API: Submit session
    API->>DB: Validate and persist
    API-->>Sync: Success
    Sync->>Store: Mark record as synced
```

Practice-mode sessions are not stored as evaluation sessions. Evaluation sessions are saved locally first and synchronized when triggered by specific events, including user login or logout, the addition of new lists or sessions while authenticated, or manually by pressing the sync button.

## Public and official lists

Quiz routes carry a list source: `private`, `public` or `official`. Private lists are resolved through local/user-list storage. Public and official lists are resolved through their backend endpoints. The list name is kept as a small local session snapshot so quiz history still works offline when the list is not in Dexie.

## Backend layers

```mermaid
flowchart LR
    Routes[Gin routes] --> Middleware[Auth / CORS / rate limits]
    Middleware --> Handlers[HTTP handlers]
    Handlers --> Services[Domain services]
    Services --> Repositories[Repositories]
    Repositories --> DB[(PostgreSQL)]
    Services --> Storage[Supabase Storage]
```

The backend exposes Japanese data, authentication, lists, quizzes, statistics and health/readiness endpoints.

## Health checks

- `/health`: process-level liveness response.
- `/health/ready`: readiness response that checks the database connection.
