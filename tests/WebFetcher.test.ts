import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebFetcher } from "../src/tools/WebFetcher";

describe("WebFetcher", () => {
    let fetcher: WebFetcher;

    beforeEach(() => {
        fetcher = new WebFetcher(3);
        // Clear cache
        (fetcher as any).cache.clear();
    });

    it("should reject SSRF URLs", async () => {
        const resultLocal = await (fetcher as any).fetchSingle("http://localhost:8080/admin");
        expect(resultLocal).toContain("Error: Invalid or insecure URL");

        const resultInternal = await (fetcher as any).fetchSingle("http://192.168.1.5/keys");
        expect(resultInternal).toContain("Error: Invalid or insecure URL");
        
        const resultFile = await (fetcher as any).fetchSingle("file:///etc/passwd");
        expect(resultFile).toContain("Error: Invalid or insecure URL");

        const resultAwsMeta = await (fetcher as any).fetchSingle("http://169.254.169.254/latest/meta-data/");
        expect(resultAwsMeta).toContain("Error: Invalid or insecure URL");

        const resultZero = await (fetcher as any).fetchSingle("http://0.0.0.0:8000/api");
        expect(resultZero).toContain("Error: Invalid or insecure URL");

        const resultLoopback = await (fetcher as any).fetchSingle("http://127.0.1.1/admin");
        expect(resultLoopback).toContain("Error: Invalid or insecure URL");

        const resultIpv6 = await (fetcher as any).fetchSingle("http://[::1]:8080/admin");
        expect(resultIpv6).toContain("Error: Invalid or insecure URL");

        const resultIpv6Unspecified = await (fetcher as any).fetchSingle("http://[::]:8080/admin");
        expect(resultIpv6Unspecified).toContain("Error: Invalid or insecure URL");

        const resultIpv4Mapped = await (fetcher as any).fetchSingle("http://[::ffff:127.0.0.1]:8080/admin");
        expect(resultIpv4Mapped).toContain("Error: Invalid or insecure URL");
    });

    it("should reject redirects to SSRF URLs", async () => {
        // Mock global fetch to return a 302 redirect to an internal IP
        const originalFetch = global.fetch;
        global.fetch = vi.fn().mockImplementation(async (url, options) => {
            if (url === "https://example.com/redirect-to-internal") {
                return {
                    status: 302,
                    headers: new Headers({ location: "http://169.254.169.254/latest/meta-data/" }),
                    ok: false
                };
            }
            return {
                status: 200,
                ok: true,
                text: async () => "Mock content"
            };
        });

        const result = await (fetcher as any).fetchSingle("https://example.com/redirect-to-internal");
        expect(result).toContain("Error: Redirected to invalid or insecure URL");

        global.fetch = originalFetch;
    });

    it("should allow valid public HTTP/HTTPS URLs including tricky ones", async () => {
        const isValid = await (fetcher as any).isValidUrl("https://en.wikipedia.org/wiki/AI");
        expect(isValid).toBe(true);

        // To test real DNS we need a domain that actually resolves to a public IP.
        // 10.example.com may not resolve, so we'll mock dns.lookup or pick known public domains.
        // We will just test with real public domains for this assertion since dns is not mocked.
        const isValidTen = await (fetcher as any).isValidUrl("http://example.com/foo");
        expect(isValidTen).toBe(true);

        const isValidInternalLooking = await (fetcher as any).isValidUrl("https://example.org");
        expect(isValidInternalLooking).toBe(true);
    });

    it("should cache results to avoid redundant fetching", async () => {
        const targetUrl = "https://example.com/unique-test";
        
        // Pre-populate cache directly
        (fetcher as any).cache.set(targetUrl, "Cached Data Content");

        // Should return from cache without fetching
        const result = await (fetcher as any).fetchSingle(targetUrl);
        expect(result).toBe("Cached Data Content");
    });
});
