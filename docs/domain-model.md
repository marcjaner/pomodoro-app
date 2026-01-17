# Domain Model - Pomodoro App

## Core Entities

### Pomodoro
A single focus + break cycle. The fundamental unit of work in the app.

- Contains a Focus Period followed by a Break Period
- Has duration (configurable, with presets)
- Can have a Reflection (review)

### Session
A collection of Pomodoros that work toward common goals.

- Contains 1 or more Pomodoros
- Represents a focused work session (e.g., "Morning coding session")

### Task
An item to complete or track during a Pomodoro.

- Belongs to a Pomodoro (current implementation)
- Text description
- Can be marked complete/incomplete
- **Future**: May belong to a Session or Project

### Reflection
Assessment of productivity and outcomes.

- Optional rating (1-5 scale)
- Short description (one-sentence note)
- Attached to a Pomodoro (after it completes)
- **Future**: May also exist at Session level

### Timer Preset
Saved duration configuration.

- Focus duration (e.g., 25 min)
- Break duration (e.g., 5 min)
- User can create custom presets
- Examples: 25/5, 50/10, 90/15

### Focus Period
The work portion of a Pomodoro.

- Configurable duration
- Active state when timer is running

### Break Period
The rest portion of a Pomodoro.

- Configurable duration
- Active after Focus Period completes

## Relationships

```
Session (1) ─────── (*) Pomodoro
   │                        │
   │                        │
   │                        │
   │                        │
   │                     Tasks (*)
   │                        │
   │                     complete? (boolean)
   │
Pomodoro (1) ─────── (?) Reflection
```

- **1 Session → Many Pomodoros**
- **1 Pomodoro → Many Tasks**
- **1 Pomodoro → 0 or 1 Reflection**

## Future Concepts (Not Yet Implemented)

### Project
- Collection of Sessions
- Higher-level organization
- Tasks may belong to Projects in the future

### Session-Level Reflection
- Assessment of entire Session outcome
- Aggregates Pomodoro reflections

## Notes

- Tasks currently belong to Pomodoros only
- Reflections currently attach to Pomodoros only
- All duration configurations support both presets and custom values
- Review flow: Reflection prompted immediately after Pomodoro completes
  - Future: Allow deferring reflection up to 24 hours after completion
