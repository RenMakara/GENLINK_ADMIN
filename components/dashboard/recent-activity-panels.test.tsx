// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  RecentActivityPanels,
  RecentAdminActionsPanel,
  RecentRegistrationsPanel,
} from "./recent-activity-panels";

afterEach(() => {
  cleanup();
});

describe("RecentActivityPanels (ADM-053)", () => {
  const sampleActions = [
    {
      id: "act-1",
      actorEmail: "sok.dara@genlink.kh",
      action: "USER_SUSPEND",
      target: "chan.vibol@gmail.com",
      timestamp: "2026-08-10T08:15:00.000Z",
    },
  ];

  const sampleRegistrations = [
    {
      id: "reg-1",
      fullName: "Morm Rotana",
      email: "morm.rotana@rupp.edu.kh",
      universityName: "Royal University of Phnom Penh",
      status: "PENDING" as const,
      joinedAt: "2026-08-10T08:30:00.000Z",
    },
  ];

  it("renders admin action who, what, target, and timestamp (AC#1)", () => {
    render(<RecentAdminActionsPanel actions={sampleActions} />);

    expect(screen.getByText("sok.dara@genlink.kh")).toBeDefined();
    expect(screen.getByText("USER_SUSPEND")).toBeDefined();
    expect(screen.getByText("chan.vibol@gmail.com")).toBeDefined();
  });

  it("renders user registration details with doorway link (AC#2)", () => {
    render(<RecentRegistrationsPanel registrations={sampleRegistrations} />);

    const link = screen.getByRole("link", { name: "Morm Rotana" });
    expect(link.getAttribute("href")).toBe("/users?id=reg-1");
    expect(screen.getByText("morm.rotana@rupp.edu.kh • Royal University of Phnom Penh")).toBeDefined();
    expect(screen.getByText("Pending")).toBeDefined();
  });

  it("renders empty state when lists are empty (AC#3)", () => {
    render(<RecentActivityPanels data={{ adminActions: [], registrations: [] }} />);

    expect(screen.getByText("No recent admin actions")).toBeDefined();
    expect(screen.getByText("No recent registrations")).toBeDefined();
  });
});
