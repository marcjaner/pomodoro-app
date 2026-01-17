# Architecture - Pomodoro App

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Vite | UI framework |
| **Styling** | Tailwind CSS + shadcn/ui | Component library |
| **Routing** | TanStack Router | Typesafe routing, file-based |
| **State Management** | Convex React Hooks + React State | Server state (Convex) + local state |
| **Backend** | Convex | Database + Backend functions |
| **Authentication** | Convex Auth | Built-in auth (beta) |

## Project Structure

```
pomodoro-app/
├── src/
│   ├── main.tsx                 # App entry point
│   ├── routes/                  # TanStack Router file-based routes
│   │   ├── __root.tsx          # Root layout with providers
│   │   ├── index.tsx            # Dashboard (active pomodoro)
│   │   ├── sessions/
│   │   │   ├── index.tsx       # Sessions list/history
│   │   │   ├── $id.tsx         # Session detail view
│   │   │   └── new.tsx         # Create new session
│   │   └── settings/
│   │       └── index.tsx       # Settings (presets, profile)
│   ├── components/             # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── pomodoro/         # Pomodoro-related components
│   │   ├── session/          # Session-related components
│   │   └── timer/            # Timer components
│   ├── lib/
│   │   ├── convex.ts         # Convex client setup
│   │   └── router.ts         # TanStack Router setup
│   └── hooks/                 # Custom hooks
│       ├── usePomodoro.ts    # Pomodoro hooks
│       ├── useTimer.ts       # Timer hooks (local state)
│       └── useSession.ts     # Session hooks
├── convex/
│   ├── schema.ts             # Database schema definitions
│   ├── pomodoros.ts         # Pomodoro queries/mutations
│   ├── sessions.ts          # Session queries/mutations
│   ├── tasks.ts             # Task queries/mutations
│   ├── reflections.ts       # Reflection queries/mutations
│   ├── presets.ts           # Timer preset queries/mutations
│   └── auth.ts              # Convex Auth configuration
└── docs/
    ├── domain-model.md       # Domain model documentation
    └── architecture.md      # This file
```

## Architecture Patterns

### Frontend Architecture

#### TanStack Router Integration
- File-based routing with Vite plugin
- Route loaders fetch initial data from Convex
- Search params for filterable lists (e.g., `/sessions?filter=completed`)
- Inherited route context for auth state
- Typesafe navigation throughout

#### State Management Strategy
- **Convex React Hooks**: Server state from Convex (pomodoros, sessions, tasks, etc.)
- **Local React State**: Timer state, form inputs, ephemeral UI state
- **URL State**: Filters, pagination, shared state via search params
- **No additional state library**: Convex sync engine handles all server state needs

### Backend Architecture (Convex)

#### Database Schema
Convex document-relational database with optional schema enforcement.

**Tables** (mapped from domain model):
- `pomodoros` - Individual pomodoro records
- `sessions` - Session records
- `tasks` - Task records
- `reflections` - Reflection records
- `presets` - Timer presets (user-defined)
- `users` - User records (managed by Convex Auth)

#### Function Types
- **Queries**: Read-only operations (`ctx.db.query()`, `ctx.db.get()`)
- **Mutations**: Write operations (transactions) (`ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.delete()`)
- **Actions**: External API calls, complex operations

#### Authentication
- Convex Auth (built-in, beta)
- Supports: OAuth providers, magic links, email/password
- User identity accessible in all functions via `ctx.auth`

#### Realtime Sync
- WebSocket-based synchronization
- Automatic query re-execution when data changes
- Multi-device support (optional for future)

### Data Flow

#### Reading Data (Query Pattern)
```
React Component
    ↓ useQuery(api.sessions.list)
Convex Query Function
Convex Database
    ← Returns data
Convex Sync Engine
    → Auto-reexecutes when data changes
    → Pushes updates to all subscribers
React Component re-renders
```

#### Writing Data (Mutation Pattern)
```
React Component
    ↓ useMutation(api.sessions.create)
Convex Mutation Function
Convex Database (transaction)
    ← Commits changes
Convex Sync Engine
    → Pushes updates to all subscribers
React Components re-render
```

#### Timer State (Local + Persistence)
```
Local React State (timer/activePomodoro)
    ↓ On completion/interval
Convex Mutation (pomodoros.update)
    ← Persists to database
```

## Key Design Decisions

### 1. Single-Device First
Timer state lives in local React state for optimal UX (no network latency). Convex stores persistence and history. Multi-device sync can be added later if needed.

### 2. Hybrid Routing
- **Dashboard** (`/`): Active pomodoro with modal for session management
- **Dedicated pages** (`/sessions`, `/sessions/$id`): History and detail views
- **Settings** (`/settings`): Configuration and profile

### 3. Convex Auth Starting Point
Using built-in Convex Auth for simplicity. Can migrate to Clerk/Auth0/WorkOS if more features needed.

### 4. No Separate State Management
Convex React hooks + sync engine provides comprehensive state management. No Redux/Zustand/TanStack Query needed.

## Why Not TanStack Query with Convex?

Convex's built-in sync engine makes TanStack Query redundant for this project:

**Convex `useQuery` provides:**
- Automatic realtime subscriptions via WebSocket
- Data is never stale (updates pushed immediately)
- Built-in retries and error handling
- Consistency guarantees across all query subscriptions

**TanStack Query features that don't apply to Convex:**
- `isStale` is always false (data always up-to-date)
- Retry options are ignored (Convex handles retries)
- Refetch options ignored (no need to manually refetch)
- Cache invalidation not needed (data stays fresh)

**What we'd lose without TanStack Query:**
- DevTools (nice but not essential)
- Complex caching patterns (not needed with realtime sync)
- Advanced pagination helpers (Convex has its own)

**Conclusion:** Convex's sync engine provides all the data management we need. Using TanStack Query would add complexity without providing value.

## Convex Integration

### Setup
```typescript
// src/lib/convex.ts
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
```

### Example Query Function
```typescript
// convex/sessions.ts
import { query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return ctx.db
      .query("sessions")
      .withIndexes()
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();
  },
});
```

### Example Mutation Function
```typescript
// convex/pomodoros.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const start = mutation({
  args: {
    sessionId: v.id("sessions"),
    focusDuration: v.number(),
    breakDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const pomodoro = await ctx.db.insert("pomodoros", {
      sessionId: args.sessionId,
      userId: identity.subject,
      focusDuration: args.focusDuration,
      breakDuration: args.breakDuration,
      status: "in_focus",
      startTime: Date.now(),
    });

    return pomodoro;
  },
});
```

## TanStack Router Integration

### Setup
```typescript
// src/lib/router.ts
import { createRouter, createRootRoute } from "@tanstack/react-router";
import { ConvexProvider } from "convex/react";
import { convex } from "./convex";

const rootRoute = createRootRoute({
  component: () => (
    <ConvexProvider client={convex}>
      <Outlet />
    </ConvexProvider>
  ),
});

export const router = createRouter({ routeTree: rootRoute });
```

TanStack Router works directly with Convex hooks. Route loaders can use Convex's client directly if needed, but the simplest approach is to let Convex's `useQuery` handle data fetching in components.

### Example Route
```typescript
// src/routes/sessions/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/sessions/")({
  component: SessionsList,
});

function SessionsList() {
  const sessions = useQuery(api.sessions.list);

  if (sessions === undefined) return <div>Loading...</div>;

  return (
    <div>
      {sessions?.map((session) => (
        <div key={session._id}>{session.name}</div>
      ))}
    </div>
  );
}
```

## Security Considerations

### Authentication
- All Convex functions check `ctx.auth.getUserIdentity()`
- Unauthenticated users cannot access/mutate data
- Route loaders respect auth state

### Authorization
- Row-level security: Users can only access their own data
- Mutations validate user ownership before modifications
- No direct database access from frontend

### Data Validation
- Convex schema enforces data structure
- Runtime validation via `v` helpers in function args
- Search params validated via TanStack Router schema

## Development Workflow

### Local Development
1. `npx convex dev` - Starts Convex backend sync
2. `npm run dev` - Starts Vite dev server with TanStack Router
3. Changes in `convex/` sync automatically to Convex deployment

### Data Management
- Convex Dashboard: `https://dashboard.convex.dev`
- View/query database tables
- Monitor function logs
- Test mutations and queries

## Future Considerations

### Multi-Device Sync
- Move timer state to Convex for real-time sync
- Use Convex's scheduling for background timer
- Handle conflict resolution

### Advanced Auth
- Migrate to Clerk/Auth0 for additional features
- Social logins, MFA, SSO
- User invitations/team features

### Performance
- Convex indexes for complex queries
- Route-level code splitting
- Optimistic updates for mutations

### Testing
- Convex provides testing utilities
- Mock Convex functions in component tests
- Integration tests with real Convex deployment

## References

- [Convex Documentation](https://docs.convex.dev)
- [Convex React Client](https://docs.convex.dev/client/react)
- [TanStack Router Documentation](https://tanstack.com/router)
- [Convex Auth](https://docs.convex.dev/auth/convex-auth)
