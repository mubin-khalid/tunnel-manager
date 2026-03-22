import { describe, it, expect } from "vitest";
import { toErrorString } from "@/utils/error";

describe("toErrorString", () => {
  it("returns message from an Error instance", () => {
    expect(toErrorString(new Error("something went wrong"))).toBe(
      "something went wrong",
    );
  });

  it("returns the string directly when given a string", () => {
    expect(toErrorString("tauri command failed")).toBe("tauri command failed");
  });

  it("returns empty string for empty string input", () => {
    expect(toErrorString("")).toBe("");
  });

  it("converts a number to string", () => {
    expect(toErrorString(42)).toBe("42");
  });

  it("converts null to string", () => {
    expect(toErrorString(null)).toBe("null");
  });

  it("converts undefined to string", () => {
    expect(toErrorString(undefined)).toBe("undefined");
  });

  it("converts a plain object to string", () => {
    expect(toErrorString({ code: 404 })).toBe("[object Object]");
  });

  it("uses Error.message not the full Error serialization", () => {
    const err = new Error("msg");
    // toString() would give "Error: msg", message gives just "msg"
    expect(toErrorString(err)).toBe("msg");
    expect(toErrorString(err)).not.toContain("Error:");
  });

  it("handles a subclass of Error", () => {
    class CustomError extends Error {
      constructor(msg: string) {
        super(msg);
        this.name = "CustomError";
      }
    }
    expect(toErrorString(new CustomError("custom"))).toBe("custom");
  });

  it("handles a Tauri-style string error (most common runtime case)", () => {
    // Tauri commands reject with a plain string, not an Error object
    const tauriError: unknown = "ngrok exited after start (status: 1)";
    expect(toErrorString(tauriError)).toBe(
      "ngrok exited after start (status: 1)",
    );
  });
});
