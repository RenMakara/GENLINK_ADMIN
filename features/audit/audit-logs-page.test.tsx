// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PageResponse } from "@/lib/api/types";

import type { AuditLogDetail, AuditLogSummary } from "./audit-types";
import { AuditLogsPage } from "./audit-logs-page";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));
const permissionState = vi.hoisted(() => ({ canRead: true }));
const authState = vi.hoisted(() => ({ roleCode: "SUPER_ADMIN" }));
const service = vi.hoisted(() => ({
  useAuditLogList: vi.fn(),
  useAuditLogDetail: vi.fn(),
  exportAuditLogsCsv: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/audit-logs",
  useRouter: () => ({
    replace: (href: string, options: unknown) => {
      navigation.replace(href, options);
      navigation.search = new URL(href, "https://admin.test").search.slice(1);
    },
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    ready: true,
    has: (permission: string) => permission === "audit:read" && permissionState.canRead,
  }),
}));

vi.mock("@/hooks/use-current-admin", () => ({
  useCurrentAdmin: () => ({ roleCode: authState.roleCode }),
}));

vi.mock("@/services/audit-logs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/audit-logs")>();
  return {
    ...actual,
    useAuditLogList: service.useAuditLogList,
    useAuditLogDetail: service.useAuditLogDetail,
    exportAuditLogsCsv: service.exportAuditLogsCsv,
  };
});

function makeLog(overrides: Partial<AuditLogSummary> = {}): AuditLogSummary {
  return {
    auditLogId: "audit-1",
    createdAt: "2026-09-25T05:00:00Z",
    adminUserId: "admin-1",
    adminName: "Sok Dara",
    adminEmail: "admin@genlink.kh",
    action: "USER_BAN",
    targetType: "USER",
    targetId: "user-1",
    status: "SUCCESS",
    errorCode: null,
    reason: "Repeated abuse review",
    requestId: "request-1",
    batchId: null,
    ...overrides,
  };
}

const detail: AuditLogDetail = {
  ...makeLog(),
  beforeJson: { status: "ACTIVE" },
  afterJson: { status: "SUSPENDED" },
  ipAddress: "127.0.0.1",
  userAgent: "admin-test",
};

function listQuery(content: AuditLogSummary[] = [makeLog()]): PageResponse<AuditLogSummary> {
  return { content, page: 0, size: 25, totalElements: content.length, totalPages: content.length ? 1 : 0, hasNext: false };
}

function renderPage() {
  service.useAuditLogList.mockReturnValue({
    data: listQuery(), isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn(),
  });
  service.useAuditLogDetail.mockReturnValue({ data: detail, isLoading: false, isError: false, error: null, refetch: vi.fn() });
  return render(<AuditLogsPage />);
}

beforeEach(() => {
  service.useAuditLogDetail.mockReturnValue({ data: detail, isLoading: false, isError: false, error: null, refetch: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  navigation.search = "";
  permissionState.canRead = true;
  authState.roleCode = "SUPER_ADMIN";
});

describe("AuditLogsPage (ADM-120)", () => {
  it("renders successful and failed rows, links user targets, and exposes export only to Super Admin", () => {
    service.useAuditLogList.mockReturnValue({
      data: listQuery([makeLog(), makeLog({ auditLogId: "audit-2", status: "FAILURE", errorCode: "FORBIDDEN", targetId: null })]),
      isLoading: false, isFetching: false, isError: false, error: null, refetch: vi.fn(),
    });

    render(<AuditLogsPage />);

    expect(screen.getByRole("heading", { name: "Audit logs" })).toBeDefined();
    expect(screen.getByRole("table", { name: "Audit logs" })).toBeDefined();
    expect(screen.getAllByText("Success").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Failure").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "USER · user-1" }).getAttribute("href")).toBe("/users/user-1");
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("syncs composed filters to the URL and requests the same values", () => {
    const view = renderPage();

    fireEvent.change(screen.getByLabelText("Audit action"), { target: { value: "USER_BAN" } });
    expect(navigation.replace).toHaveBeenCalledWith("/audit-logs?action=USER_BAN", { scroll: false });

    view.rerender(<AuditLogsPage />);
    fireEvent.change(screen.getByLabelText("Audit status"), { target: { value: "FAILURE" } });
    expect(navigation.replace).toHaveBeenLastCalledWith("/audit-logs?action=USER_BAN&status=FAILURE", { scroll: false });
    view.rerender(<AuditLogsPage />);
    expect(service.useAuditLogList).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0, size: 25, action: "USER_BAN", status: "FAILURE" }),
      true,
    );
  });

  it("opens a read-only detail drawer with field-level changes", () => {
    renderPage();
    fireEvent.click(screen.getByRole("row", { name: /Open audit detail/ }));

    expect(screen.getByText("Audit log detail")).toBeDefined();
    expect(screen.getByText("Before / after changes")).toBeDefined();
    expect(screen.getByText("$.status")).toBeDefined();
    expect(screen.getByText("Changed")).toBeDefined();
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("hides the page and export when audit:read is absent", () => {
    permissionState.canRead = false;
    renderPage();
    expect(screen.getByText("You do not have permission to view the audit trail.")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
    expect(service.useAuditLogList).toHaveBeenCalledWith(expect.anything(), false);
  });
});
