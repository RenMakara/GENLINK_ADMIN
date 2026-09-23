// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PageResponse } from "@/lib/api/types";

import {
  UserLoginHistoryTab,
  UserSessionsTab,
  UserXpTab,
} from "./user-detail-security-panels";
import type {
  AdminUserLoginHistory,
  AdminUserSession,
  AdminUserXp,
} from "./types";

const USER_ID = "397939ea-0e71-4bb5-9b4a-3d2707296630";

function page<T>(content: T[], totalElements = content.length): PageResponse<T> {
  return {
    content,
    page: 0,
    size: 25,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / 25)),
    hasNext: totalElements > 25,
  };
}

const queryState = vi.hoisted(() => ({
  sessions: {
    isLoading: false,
    isError: false,
    data: undefined as PageResponse<AdminUserSession> | undefined,
    refetch: vi.fn(),
  },
  history: {
    isLoading: false,
    isError: false,
    data: undefined as PageResponse<AdminUserLoginHistory> | undefined,
    refetch: vi.fn(),
  },
  xp: {
    isLoading: false,
    isError: false,
    data: undefined as AdminUserXp | undefined,
    refetch: vi.fn(),
  },
  sessionArgs: [] as Array<[string, number, number]>,
  historyArgs: [] as Array<[string, number, number]>,
  xpArgs: [] as Array<[string, number, number]>,
}));

vi.mock("@/services/users", () => ({
  useUserSessions: (userId: string, pageIndex: number, pageSize: number) => {
    queryState.sessionArgs.push([userId, pageIndex, pageSize]);
    return queryState.sessions;
  },
  useUserLoginHistory: (userId: string, pageIndex: number, pageSize: number) => {
    queryState.historyArgs.push([userId, pageIndex, pageSize]);
    return queryState.history;
  },
  useUserXp: (userId: string, pageIndex: number, pageSize: number) => {
    queryState.xpArgs.push([userId, pageIndex, pageSize]);
    return queryState.xp;
  },
}));

afterEach(() => {
  cleanup();
  queryState.sessions.isLoading = false;
  queryState.sessions.isError = false;
  queryState.sessions.data = undefined;
  queryState.sessions.refetch.mockClear();
  queryState.history.isLoading = false;
  queryState.history.isError = false;
  queryState.history.data = undefined;
  queryState.history.refetch.mockClear();
  queryState.xp.isLoading = false;
  queryState.xp.isError = false;
  queryState.xp.data = undefined;
  queryState.xp.refetch.mockClear();
  queryState.sessionArgs = [];
  queryState.historyArgs = [];
  queryState.xpArgs = [];
});

describe("ADM-075 user security panels", () => {
  it("renders sessions with pagination and a full user-agent title", () => {
    queryState.sessions.data = page(
      [
        {
          sessionId: "session-1",
          deviceInfo: "Chrome on Windows",
          ipAddress: "203.0.113.10",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0",
          createdAt: "2026-09-20T00:00:00Z",
          lastUsedAt: "2026-09-24T01:00:00Z",
          expiresAt: "2026-10-20T00:00:00Z",
        },
      ],
      26,
    );

    render(<UserSessionsTab userId={USER_ID} />);

    expect(screen.getByRole("table", { name: "Active user sessions" })).toBeDefined();
    expect(screen.getByText("Chrome on Windows")).toBeDefined();
    expect(screen.getByTitle("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0")).toBeDefined();
    expect(screen.getByText("Page 1 of 2")).toBeDefined();
    expect(queryState.sessionArgs.at(-1)).toEqual([USER_ID, 0, 25]);

    fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(queryState.sessionArgs.at(-1)).toEqual([USER_ID, 1, 25]);
  });

  it("renders login results with text and icons so failures are not colour-only", () => {
    queryState.history.data = page([
      {
        auditId: "audit-1",
        eventType: "LOGIN",
        success: false,
        failureReason: "Invalid credentials",
        ipAddress: "203.0.113.11",
        userAgent: "Mozilla/5.0 (Linux; Android 15)",
        timestamp: "2026-09-24T02:00:00Z",
      },
    ]);

    render(<UserLoginHistoryTab userId={USER_ID} />);

    expect(screen.getByText("Failed")).toBeDefined();
    expect(screen.getByLabelText("Login failed")).toBeDefined();
    expect(screen.getByText("Invalid credentials")).toBeDefined();
    expect(screen.getByRole("table", { name: "User login history" })).toBeDefined();
  });

  it("renders XP progress, signed source breakdown, badges and ledger pagination", () => {
    queryState.xp.data = {
      userId: USER_ID,
      totalXp: 265,
      level: 3,
      xpIntoLevel: 65,
      xpToNextLevel: 35,
      levelProgressPercent: 65,
      breakdown: [
        { sourceType: "QUIZ", xpAmount: 275, entryCount: 4 },
        { sourceType: "ADMIN_ADJUSTMENT", xpAmount: -10, entryCount: 1 },
      ],
      ledger: page(
        [
          {
            xpHistoryId: "xp-1",
            sourceType: "QUIZ",
            sourceId: "quiz-1",
            xpAmount: 275,
            timestamp: "2026-09-23T01:00:00Z",
          },
          {
            xpHistoryId: "xp-2",
            sourceType: "ADMIN_ADJUSTMENT",
            sourceId: null,
            xpAmount: -10,
            timestamp: "2026-09-22T01:00:00Z",
          },
        ],
        26,
      ),
      badges: [
        {
          badgeId: "badge-1",
          code: "FIRST_QUIZ",
          nameEn: "First quiz",
          nameKm: "សំណួរដំបូង",
          descriptionEn: "Complete a quiz",
          descriptionKm: "បញ្ចប់សំណួរ",
          requirement: "1 quiz",
          iconUrl: null,
          unlockedAt: "2026-09-21T01:00:00",
        },
      ],
    };

    render(<UserXpTab userId={USER_ID} />);

    expect(screen.getByText("Level 3")).toBeDefined();
    expect(screen.getByRole("progressbar", { name: "Level 3 progress" }).getAttribute("aria-valuenow")).toBe("65");
    expect(screen.getByText("Quiz")).toBeDefined();
    expect(screen.getByText("+275")).toBeDefined();
    expect(screen.getByText("-10")).toBeDefined();
    expect(screen.getByText("First quiz")).toBeDefined();
    expect(screen.getByRole("table", { name: "User XP ledger" })).toBeDefined();
    expect(screen.getByText("Page 1 of 2")).toBeDefined();
  });

  it("renders loading and retry states for security data", () => {
    queryState.sessions.isError = true;
    render(<UserSessionsTab userId={USER_ID} />);
    expect(screen.getByRole("alert")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(queryState.sessions.refetch).toHaveBeenCalledOnce();

    cleanup();
    queryState.xp.isError = false;
    queryState.xp.isLoading = true;
    render(<UserXpTab userId={USER_ID} />);
    expect(screen.getByRole("status", { name: "Loading XP data" })).toBeDefined();
  });
});

