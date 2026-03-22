import { describe, it, expect } from "vitest";
import {
  stripUrl,
  normalizeHost,
  normalizeAddr,
  formatTunnelName,
  capitalize,
} from "@/utils/tunnel";

// ---------------------------------------------------------------------------
// stripUrl
// ---------------------------------------------------------------------------
describe("stripUrl", () => {
  it("removes https scheme", () => {
    expect(stripUrl("https://example.com")).toBe("example.com");
  });

  it("removes http scheme", () => {
    expect(stripUrl("http://example.com")).toBe("example.com");
  });

  it("removes scheme case-insensitively", () => {
    expect(stripUrl("HTTPS://example.com")).toBe("example.com");
  });

  it("strips path after domain", () => {
    expect(stripUrl("https://example.com/some/path")).toBe("example.com");
  });

  it("leaves bare hostname unchanged", () => {
    expect(stripUrl("example.com")).toBe("example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(stripUrl("  https://example.com  ")).toBe("example.com");
  });

  it("handles ngrok subdomain URLs", () => {
    expect(stripUrl("https://abc123.ngrok.io")).toBe("abc123.ngrok.io");
  });
});

// ---------------------------------------------------------------------------
// capitalize
// ---------------------------------------------------------------------------
describe("capitalize", () => {
  it("capitalizes the first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("leaves already-capitalized strings unchanged", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("handles single character", () => {
    expect(capitalize("a")).toBe("A");
  });
});

// ---------------------------------------------------------------------------
// normalizeHost
// ---------------------------------------------------------------------------
describe("normalizeHost", () => {
  it("lowercases the input", () => {
    expect(normalizeHost("Example.COM")).toBe("example.com");
  });

  it("strips https scheme", () => {
    expect(normalizeHost("https://example.com")).toBe("example.com");
  });

  it("strips http scheme", () => {
    expect(normalizeHost("http://example.com")).toBe("example.com");
  });

  it("strips port number", () => {
    expect(normalizeHost("example.com:8080")).toBe("example.com");
  });

  it("strips path", () => {
    expect(normalizeHost("example.com/path/to/resource")).toBe("example.com");
  });

  it("strips scheme, port and path together", () => {
    expect(normalizeHost("https://example.com:443/path")).toBe("example.com");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeHost("  example.com  ")).toBe("example.com");
  });

  it("handles bare localhost", () => {
    expect(normalizeHost("localhost")).toBe("localhost");
  });

  it("handles localhost with port", () => {
    expect(normalizeHost("localhost:3000")).toBe("localhost");
  });
});

// ---------------------------------------------------------------------------
// normalizeAddr
// ---------------------------------------------------------------------------
describe("normalizeAddr", () => {
  it("returns bare hostname unchanged", () => {
    expect(normalizeAddr("localhost")).toBe("localhost");
  });

  it("strips port from host:port", () => {
    expect(normalizeAddr("localhost:3000")).toBe("localhost");
  });

  it("strips scheme", () => {
    expect(normalizeAddr("http://localhost")).toBe("localhost");
  });

  it("strips scheme and port", () => {
    expect(normalizeAddr("http://localhost:3000")).toBe("localhost");
  });

  it("strips path", () => {
    expect(normalizeAddr("localhost:3000/api")).toBe("localhost");
  });

  it("lowercases the result", () => {
    expect(normalizeAddr("LocalHost:3000")).toBe("localhost");
  });

  it("trims whitespace", () => {
    expect(normalizeAddr("  localhost:3000  ")).toBe("localhost");
  });

  it("handles numeric-only port address (port-only addr)", () => {
    // Some ngrok configs use just a port number as the addr
    expect(normalizeAddr("8080")).toBe("8080");
  });
});

// ---------------------------------------------------------------------------
// formatTunnelName
// ---------------------------------------------------------------------------
describe("formatTunnelName", () => {
  it("converts a hyphenated ngrok subdomain to title case words", () => {
    expect(formatTunnelName("https://my-api.ngrok.io")).toBe("My Api");
  });

  it("removes trailing -app suffix", () => {
    expect(formatTunnelName("https://my-app.ngrok.io")).toBe("My");
  });

  it("handles single-word subdomain", () => {
    expect(formatTunnelName("https://api.ngrok.io")).toBe("Api");
  });

  it("handles multiple hyphens", () => {
    expect(formatTunnelName("https://my-cool-service.ngrok.io")).toBe(
      "My Cool Service",
    );
  });

  it("filters empty segments from double hyphens", () => {
    expect(formatTunnelName("https://my--service.ngrok.io")).toBe("My Service");
  });

  it("handles uppercase in public URL", () => {
    // Each hyphen segment is lowercased before title-casing
    expect(formatTunnelName("https://MyTunnel.ngrok.io")).toBe("Mytunnel");
  });
});
