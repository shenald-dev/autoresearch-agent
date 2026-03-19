import { describe, it, expect, beforeEach } from "vitest";
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
    });

    it("should allow valid public HTTP/HTTPS URLs", async () => {
        const isValid = (fetcher as any).isValidUrl("https://en.wikipedia.org/wiki/AI");
        expect(isValid).toBe(true);
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
