import { describe, it, expect } from "vitest";

describe("EmailStore", () => {
  it("exports required functions", async () => {
    const mod = await import("./email-store");
    expect(typeof mod.saveEmails).toBe("function");
    expect(typeof mod.getEmails).toBe("function");
    expect(typeof mod.getLastScanDate).toBe("function");
    expect(typeof mod.setLastScanDate).toBe("function");
  });
});
