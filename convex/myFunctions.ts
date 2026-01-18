import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getSession = query({
  args: {
    id: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    return session;
  },
});

export const createSession = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("sessions", {
      userId,
      name: args.name,
      startTime: Date.now(),
    });
  },
});

export const listPomodoros = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pomodoros")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

export const startPomodoro = mutation({
  args: {
    sessionId: v.id("sessions"),
    focusDuration: v.number(),
    breakDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("pomodoros", {
      userId,
      sessionId: args.sessionId,
      focusDuration: args.focusDuration,
      breakDuration: args.breakDuration,
      status: "in_focus",
      startTime: Date.now(),
    });
  },
});

export const listPresets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("presets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const createPreset = mutation({
  args: {
    name: v.string(),
    focusDuration: v.number(),
    breakDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("presets", {
      userId,
      name: args.name,
      focusDuration: args.focusDuration,
      breakDuration: args.breakDuration,
    });
  },
});
