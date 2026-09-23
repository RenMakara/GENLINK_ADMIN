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
    api: { status: "UP" },
    database: { status: "UP" },
    storage: { status: "UP" },
    mail: { status: "UP", enabled: true, lastOutcome: "SUCCESS" },
    scheduledJobs: [
      {
        name: "AccountAnonymizationJob",
        lastRun: "2026-08-10T02:00:00.000Z",
        lastOutcome: "SUCCESS",
      },
      {
        name: "MediaCleanupJob",
        lastRun: null,
        lastOutcome: "NEVER_RUN",
      },
      {
        name: "RecurringFinanceJob",
        lastRun: "2026-08-10T01:00:00.000Z",
        lastOutcome: "FAILURE",
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
      mail: { status: "DOWN", enabled: true, lastOutcome: "FAILURE" },
    };

    render(<SystemHealthPanel data={degradedData} />);

    expect(screen.getByText("System Alert")).toBeDefined();
    expect(
      screen.getByText(/One or more core subsystems are degraded or unresponsive/i),
    ).toBeDefined();
    expect(screen.getByText("Unhealthy")).toBeDefined();
  });

  it("renders the backend scheduledJobs contract without fixture fallback dates", () => {
    render(
      <SystemHealthPanel
        data={{
          status: "UP",
          api: { status: "UP" },
          database: { status: "UP" },
          storage: { status: "UP" },
          mail: { status: "UP", enabled: true, lastOutcome: "NEVER_RUN" },
          scheduledJobs: [
            {
              name: "MediaCleanupJob",
              lastRun: null,
              lastOutcome: "NEVER_RUN",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Media Cleanup Job")).toBeDefined();
    expect(screen.getAllByText("Never run since restart")).toHaveLength(2);
    expect(screen.queryByText("Account Anonymization Job")).toBeNull();
  });
});
