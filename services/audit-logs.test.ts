import { describe, expect, it } from "vitest";

import {
  buildAuditLogExportRequest,
  buildAuditLogListQuery,
} from "./audit-logs";

describe("audit log service contract (ADM-120)", () => {
  it("maps URL-owned filters to the paginated newest-first list contract", () => {
    expect(
      buildAuditLogListQuery({
        pageIndex: 2,
        pageSize: 50,
        filters: {
          adminId: "admin-1",
          action: "USER_BAN",
          targetType: "USER",
          from: "2026-09-01",
          to: "2026-09-10",
          status: "FAILURE",
        },
      }),
    ).toEqual({
      page: 2,
      size: 50,
      adminId: "admin-1",
      action: "USER_BAN",
      targetType: "USER",
      from: "2026-09-01",
      to: "2026-09-10",
      status: "FAILURE",
    });
  });

  it("omits empty filters from the Super Admin export request", () => {
    expect(
      buildAuditLogExportRequest(
        {
          adminId: "",
          action: "",
          targetType: "USER",
          from: "",
          to: "2026-09-10",
          status: "SUCCESS",
        },
        "Quarterly compliance review",
      ),
    ).toEqual({
      targetType: "USER",
      to: "2026-09-10",
      status: "SUCCESS",
      reason: "Quarterly compliance review",
    });
  });
});

