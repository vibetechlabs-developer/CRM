import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDashboardStats } from "../useDashboardStats";

describe("useDashboardStats", () => {
  it("should handle null or undefined data safely", () => {
    const { result } = renderHook(() => useDashboardStats(undefined));
    expect(result.current.stats).toHaveLength(4);
    expect(result.current.totalTickets).toBe(0);
    expect(result.current.activeTickets).toBe(0);
    // Keep aligned with pipeline stage definitions used by the hook.
    expect(result.current.pipelineData).toHaveLength(6);
  });

  it("should calculate pipeline stats correctly under edge cases", () => {
    // Empty lists
    const data = {
      pipeline: [],
      priority: [],
      types: [],
      monthly_trend: [],
      recent: [],
      completion_rate: 0
    };
    const { result } = renderHook(() => useDashboardStats(data));
    expect(result.current.pipelineData.every(p => p.count === 0)).toBe(true);
  });

  it("should calculate monthly trends correctly", () => {
    const data = {
      monthlyTrend: [
        { month: "Jan", tickets: 10, completed: 5 },
        { month: "Feb", tickets: 0, completed: 0 },
      ],
      statusCounts: [],
      priorityCounts: [],
      typeCounts: [],
      recentTickets: [],
      completionRate: 0,
    };
    const { result } = renderHook(() => useDashboardStats(data));

    expect(result.current.monthlyTrend).toEqual([
      { month: "Jan", tickets: 10, completed: 5 },
      { month: "Feb", tickets: 0, completed: 0 },
    ]);
  });
});
