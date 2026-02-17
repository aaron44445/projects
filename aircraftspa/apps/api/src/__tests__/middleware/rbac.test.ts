import { describe, it, expect } from "vitest";
import { canAccess, ROLE_HIERARCHY } from "../../middleware/rbac";

describe("RBAC", () => {
  it("owner can access everything", () => {
    expect(canAccess("owner", "technician")).toBe(true);
    expect(canAccess("owner", "manager")).toBe(true);
    expect(canAccess("owner", "admin")).toBe(true);
    expect(canAccess("owner", "owner")).toBe(true);
  });

  it("technician can only access technician level", () => {
    expect(canAccess("technician", "technician")).toBe(true);
    expect(canAccess("technician", "manager")).toBe(false);
    expect(canAccess("technician", "admin")).toBe(false);
    expect(canAccess("technician", "owner")).toBe(false);
  });

  it("manager can access manager and below", () => {
    expect(canAccess("manager", "technician")).toBe(true);
    expect(canAccess("manager", "manager")).toBe(true);
    expect(canAccess("manager", "admin")).toBe(false);
  });

  it("admin can access admin and below", () => {
    expect(canAccess("admin", "technician")).toBe(true);
    expect(canAccess("admin", "manager")).toBe(true);
    expect(canAccess("admin", "admin")).toBe(true);
    expect(canAccess("admin", "owner")).toBe(false);
  });

  it("unknown role has no access", () => {
    expect(canAccess("unknown", "technician")).toBe(false);
  });
});
