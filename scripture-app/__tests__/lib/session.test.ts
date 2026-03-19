import { describe, it, expect, beforeEach } from "vitest";
import { createSession, validateSession, clearSession } from "@/lib/session";

describe("session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a session token in localStorage", () => {
    createSession();
    expect(localStorage.getItem("session_token")).toBeTruthy();
    expect(localStorage.getItem("session_expiry")).toBeTruthy();
  });

  it("validates a fresh session", () => {
    createSession();
    expect(validateSession()).toBe(true);
  });

  it("rejects expired session", () => {
    createSession();
    const pastExpiry = Date.now() - 1000;
    localStorage.setItem("session_expiry", pastExpiry.toString());
    expect(validateSession()).toBe(false);
  });

  it("rejects missing session", () => {
    expect(validateSession()).toBe(false);
  });

  it("clears session", () => {
    createSession();
    clearSession();
    expect(localStorage.getItem("session_token")).toBeNull();
  });
});
