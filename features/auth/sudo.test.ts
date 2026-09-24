import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({ api }));

import { endpoints } from "@/lib/api/endpoints";

import {
  clearSudoWindow,
  getSudoWindowState,
  openSudoWindow,
} from "./sudo";

function response(seconds = 300) {
  return {
    expiresInSeconds: seconds,
    expiresAt: new Date(Date.now() + seconds * 1000).toISOString(),
  };
}

describe("sudo window service (ADM-089)", () => {
  beforeEach(() => {
    clearSudoWindow();
    api.post.mockReset();
    vi.useRealTimers();
  });

  it("opens the backend window and tracks only its safe expiry metadata", async () => {
    api.post.mockResolvedValue(response());

    const opened = await openSudoWindow({ code: "123456" });

    expect(api.post).toHaveBeenCalledWith(endpoints.auth.sudo, { code: "123456" });
    expect(opened.expiresInSeconds).toBe(300);
    expect(getSudoWindowState().isOpen).toBe(true);
    expect(getSudoWindowState().secondsRemaining).toBeGreaterThan(0);
  });

  it("does not prompt or call the API again while the five-minute window is open", async () => {
    api.post.mockResolvedValue(response());

    await openSudoWindow({ code: "123456" });
    await openSudoWindow({ password: "correct horse battery staple" });

    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("single-flights concurrent re-authentication requests", async () => {
    let resolveRequest!: (value: ReturnType<typeof response>) => void;
    api.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = openSudoWindow({ code: "123456" });
    const second = openSudoWindow({ code: "123456" });
    expect(api.post).toHaveBeenCalledTimes(1);

    resolveRequest(response());
    await Promise.all([first, second]);
  });

  it("expires locally at the server-provided deadline", async () => {
    vi.useFakeTimers();
    const start = new Date("2026-09-24T00:00:00.000Z");
    vi.setSystemTime(start);
    api.post.mockResolvedValue(response(5));

    await openSudoWindow({ code: "123456" });
    expect(getSudoWindowState().secondsRemaining).toBe(5);

    vi.advanceTimersByTime(5_001);
    expect(getSudoWindowState().isOpen).toBe(false);
  });

  it("does not let a late response from a cleared session arm the next session", async () => {
    let resolveRequest!: (value: ReturnType<typeof response>) => void;
    api.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = openSudoWindow({ code: "123456" });
    clearSudoWindow();
    resolveRequest(response());
    await first;

    expect(getSudoWindowState().isOpen).toBe(false);
  });
});
