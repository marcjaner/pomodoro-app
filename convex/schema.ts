import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  pomodoros: defineTable({
    userId: v.string(),
    sessionId: v.id("sessions"),
    focusDuration: v.number(),
    breakDuration: v.number(),
    status: v.union(
      v.literal("in_focus"),
      v.literal("in_break"),
      v.literal("completed"),
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),
  sessions: defineTable({
    userId: v.string(),
    name: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["userId"],
    }),
  tasks: defineTable({
    pomodoroId: v.id("pomodoros"),
    description: v.string(),
    completed: v.boolean(),
  }).index("by_pomodoro", ["pomodoroId"]),
  reflections: defineTable({
    pomodoroId: v.id("pomodoros"),
    rating: v.optional(v.number()),
    description: v.optional(v.string()),
  }).index("by_pomodoro", ["pomodoroId"]),
  presets: defineTable({
    userId: v.string(),
    name: v.string(),
    focusDuration: v.number(),
    breakDuration: v.number(),
  })
    .index("by_user", ["userId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["userId"],
    }),
});
