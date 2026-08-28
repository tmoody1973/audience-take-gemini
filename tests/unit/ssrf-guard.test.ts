import { describe, it, expect } from "vitest";
import { normalizeProjectUrl, validateSafeUrl } from "@/services/ssrf-guard";

describe("SSRF & URL Guard Service", () => {
  it("normalizes standard URLs and strips tracking parameters", () => {
    const raw = "https://www.kickstarter.com/projects/creator/indie-film/?utm_source=twitter&utm_medium=social#overview";
    const normalized = normalizeProjectUrl(raw);
    expect(normalized).toBe("https://www.kickstarter.com/projects/creator/indie-film#overview");
  });

  it("removes trailing slashes from pathnames", () => {
    const raw = "https://myfilmpage.org/film-doc/";
    const normalized = normalizeProjectUrl(raw);
    expect(normalized).toBe("https://myfilmpage.org/film-doc");
  });

  it("rejects non-HTTP protocols", () => {
    expect(() => normalizeProjectUrl("file:///etc/passwd")).toThrow("Only HTTP and HTTPS");
    expect(() => normalizeProjectUrl("ftp://server/resource")).toThrow("Only HTTP and HTTPS");
    expect(() => normalizeProjectUrl("javascript:alert(1)")).toThrow("Only HTTP and HTTPS");
  });

  it("blocks localhost and loopback addresses", async () => {
    const res1 = await validateSafeUrl("http://localhost:8080/secret");
    expect(res1.valid).toBe(false);

    const res2 = await validateSafeUrl("http://127.0.0.1/api");
    expect(res2.valid).toBe(false);

    const res3 = await validateSafeUrl("http://[::1]/api");
    expect(res3.valid).toBe(false);
  });

  it("blocks cloud metadata service IP", async () => {
    const res = await validateSafeUrl("http://169.254.169.254/computeMetadata/v1/");
    expect(res.valid).toBe(false);
  });

  it("blocks private RFC 1918 IPv4 ranges", async () => {
    const res10 = await validateSafeUrl("http://10.0.1.5/admin");
    expect(res10.valid).toBe(false);

    const res172 = await validateSafeUrl("http://172.20.0.1/internal");
    expect(res172.valid).toBe(false);

    const res192 = await validateSafeUrl("http://192.168.1.100/router");
    expect(res192.valid).toBe(false);
  });

  it("allows safe public URLs", async () => {
    const res = await validateSafeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res.valid).toBe(true);
    expect(res.normalizedUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
});
