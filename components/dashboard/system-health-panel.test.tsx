// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SystemHealthPanel, type SystemHealthData } from "./system-health-panel";

afterEach(() => {
  cleanup();
});

describe("SystemHealthPanel (ADM-055)", () => {
  const healthyData: SystemHealthData = {
    status: "UP",
    api: { status: "UP", details: "All routes 200" },
    database: { status: "UP", details: "PG pool active" },
    storage: { status: "UP", details: "S3 ping 20ms" },
    mail: { status: "UP", details: "SMTP active" },
    jobs: [
      {
        name: "AccountAnonymizationJob",
        displayName: "Account Anonymization Job",
        lastRunAt: "2026-08-10T02:00:00.000Z",
        outcome: "SUCCESS",
      },
      {
        name: "MediaCleanupJob",
        displayName: "Media Cleanup Job",
        lastRunAt: null,
        outcome: "NEVER_RUN",
      },
      {
        name: "RecurringFinanceJob",
        displayName: "Recurring Finance Job",
        lastRunAt: "2026-08-10T01:00:00.000Z",
        outcome: "FAILURE",
      },
    ],
  };

  it("renders status text labels alongside icons so color is never used alone (AC#1)", () => {
    render(<SystemHealthPanel data={healthyData} />);

    // Subsystems
    const healthyBadges = screen.getAllByText("Healthy");
    expect(healthyBadges.length).toBeGreaterThanOrEqual(4);

    // Job Outcomes
    expect(screen.getByText("Success")).toBeDefined();
    expect(screen.getByText("Failed")).toBeDefined();
  });

  it("distinguishes Never run since restart from Failed (AC#2)", () => {
    render(<SystemHealthPanel data={healthyData} />);

    const neverRunElements = screen.getAllByText("Never run since restart");
    expect(neverRunElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Failed")).toBeDefined();
  });

  it("renders a prominent degraded visual alert banner when a subsystem fails", () => {
    const degradedData: SystemHealthData = {
      ...healthyData,
      status: "DEGRADED",
      mail: { status: "DOWN", details: "SMTP timeout" },
    };

    render(<SystemHealthPanel data={degradedData} />);

    expect(screen.getByText("System Alert")).toBeDefined();
    expect(
      screen.getByText(/One or more core subsystems are degraded or unresponsive/i),
    ).toBeDefined();
    expect(screen.getByText("Unhealthy")).toBeDefined();
  });
});
