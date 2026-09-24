import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";

import { chunkUserIds, executeBulkAction } from "./bulk-actions";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bulk action client contract (ADM-098)", () => {
  it("deduplicates selections and chunks them at the server cap", () => {
    const ids = Array.from({ length: 501 }, (_, index) => `user-${index}`);
    ids.push("user-0");

    const chunks = chunkUserIds(ids);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(500);
    expect(chunks[1]).toEqual(["user-500"]);
    expect(new Set(chunks.flat()).size).toBe(501);
  });

  it("aggregates partial results across sequential chunks with distinct batch ids", async () => {
    const post = vi.spyOn(api, "post");
    post
      .mockResolvedValueOnce({
        batchId: "batch-1",
        requested: 500,
        succeeded: 499,
        failed: [{ id: "user-2", errorCode: "USER_ALREADY_BANNED" }],
      })
      .mockResolvedValueOnce({
        batchId: "batch-2",
        requested: 1,
        succeeded: 1,
        failed: [],
      });

    const ids = Array.from({ length: 501 }, (_, index) => `user-${index}`);
    const result = await executeBulkAction(
      { action: "ban", userIds: ids, reason: "Repeated abuse of the community rules" },
      { createBatchId: (() => {
        let index = 0;
        return () => `batch-${++index}`;
      })() },
    );

    expect(post).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenNthCalledWith(
      1,
      endpoints.users.bulk.ban,
      expect.objectContaining({ batchId: "batch-1", userIds: ids.slice(0, 500) }),
    );
    expect(result).toEqual({
      batchId: "batch-1",
      batchIds: ["batch-1", "batch-2"],
      requested: 501,
      succeeded: 500,
      failed: [{ id: "user-2", errorCode: "USER_ALREADY_BANNED" }],
    });
  });

  it("records every user in a failed transport chunk instead of claiming success", async () => {
    vi.spyOn(api, "post").mockRejectedValue(
      new ApiError({ status: 503, rawCode: "INTERNAL_SERVER_ERROR" }),
    );

    const result = await executeBulkAction(
      { action: "badge", userIds: ["user-1", "user-2"], badgeId: "badge-1", reason: "Reward for verified contribution" },
      { createBatchId: () => "batch-transport" },
    );

    expect(result.requested).toBe(2);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toEqual([
      { id: "user-1", errorCode: "INTERNAL_SERVER_ERROR" },
      { id: "user-2", errorCode: "INTERNAL_SERVER_ERROR" },
    ]);
  });
});
