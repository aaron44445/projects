import { describe, it, expect } from "vitest";
import { decodeBase64Url } from "./gmail-fetcher";

describe("Gmail email parsing", () => {
  it("decodes base64url encoded body", () => {
    // "Hello World" in base64url
    const encoded = btoa("Hello World")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toBe("Hello World");
  });

  it("decodes base64url with special characters", () => {
    const original = "Hello! How are you? I'm doing great.";
    const encoded = btoa(original)
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toBe(original);
  });

  it("handles empty string", () => {
    const encoded = btoa("").replace(/\+/g, "-").replace(/\//g, "_");
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toBe("");
  });
});
