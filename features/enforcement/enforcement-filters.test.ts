import { describe, expect, it } from "vitest";

import { ENFORCEMENT_FILTER_CODECS } from "./enforcement-filters";

describe("enforcement filter codecs (ADM-097)", () => {
  it("accepts only known type and severity values and serializes repeated backend keys", () => {
    expect(ENFORCEMENT_FILTER_CODECS.type.parse(["WARNING,BAN", "UNKNOWN"])).toEqual([
      "WARNING",
      "BAN",
    ]);
    expect(ENFORCEMENT_FILTER_CODECS.type.serialize(["BAN", "WARNING", "BAN"])).toEqual([
      "BAN",
      "WARNING",
    ]);
    expect(ENFORCEMENT_FILTER_CODECS.severity.parse(["HIGH"])).toEqual(["HIGH"]);
  });

  it("rejects impossible calendar dates before they reach the API", () => {
    expect(ENFORCEMENT_FILTER_CODECS.from.parse(["2026-02-29"])).toBeUndefined();
    expect(ENFORCEMENT_FILTER_CODECS.from.parse(["2026-02-28"])).toBe("2026-02-28");
  });
});
