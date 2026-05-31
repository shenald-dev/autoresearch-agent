import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebFetcher } from "../src/tools/WebFetcher";

describe("WebFetcher", () => {
	let fetcher: WebFetcher;

	beforeEach(() => {
		fetcher = new WebFetcher(3);
		// Clear cache
		(fetcher as any).cache.clear();
	});

	it("should reject domains that resolve to empty address arrays", async () => {
		const dnsPromises = require("node:dns/promises");
		const originalLookup = dnsPromises.lookup;
		dnsPromises.lookup = vi.fn().mockResolvedValue([]);

		const result = await (fetcher as any).fetchSingle(
			"http://empty-dns.example.com",
		);
		expect(result).toContain("Error: Invalid or insecure URL");

		dnsPromises.lookup = originalLookup;
	});

	it("should reject SSRF URLs", async () => {
		const resultLocal = await (fetcher as any).fetchSingle(
			"http://localhost:8080/admin",
		);
		expect(resultLocal).toContain("Error: Invalid or insecure URL");

		const resultInternal = await (fetcher as any).fetchSingle(
			"http://192.168.1.5/keys",
		);
		expect(resultInternal).toContain("Error: Invalid or insecure URL");

		const resultFile = await (fetcher as any).fetchSingle("file:///etc/passwd");
		expect(resultFile).toContain("Error: Invalid or insecure URL");

		const resultAwsMeta = await (fetcher as any).fetchSingle(
			"http://169.254.169.254/latest/meta-data/",
		);
		expect(resultAwsMeta).toContain("Error: Invalid or insecure URL");

		const resultZero = await (fetcher as any).fetchSingle(
			"http://0.0.0.0:8000/api",
		);
		expect(resultZero).toContain("Error: Invalid or insecure URL");

		const resultLoopback = await (fetcher as any).fetchSingle(
			"http://127.0.1.1/admin",
		);
		expect(resultLoopback).toContain("Error: Invalid or insecure URL");

		const resultIpv6 = await (fetcher as any).fetchSingle(
			"http://[::1]:8080/admin",
		);
		expect(resultIpv6).toContain("Error: Invalid or insecure URL");

		const resultIpv6Unspecified = await (fetcher as any).fetchSingle(
			"http://[::]:8080/admin",
		);
		expect(resultIpv6Unspecified).toContain("Error: Invalid or insecure URL");

		const resultIpv4Mapped = await (fetcher as any).fetchSingle(
			"http://[::ffff:127.0.0.1]:8080/admin",
		);
		expect(resultIpv4Mapped).toContain("Error: Invalid or insecure URL");
	});

	it("should reject redirects to SSRF URLs", async () => {
		// Mock global fetch to return a 302 redirect to an internal IP
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async (url, options) => {
			if (url === "https://example.com/redirect-to-internal") {
				return {
					status: 302,
					headers: new Headers({
						location: "http://169.254.169.254/latest/meta-data/",
					}),
					ok: false,
				};
			}
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html" }),
				ok: true,
				text: async () => "Mock content",
			};
		});

		const result = await (fetcher as any).fetchSingle(
			"https://example.com/redirect-to-internal",
		);
		expect(result).toContain("Error: Redirected to invalid or insecure URL");

		// 3. Extra spaces in Content-Type
		global.fetch = vi.fn().mockImplementation(async () => {
			const encoder = new TextEncoder();
			const encoded = encoder.encode("Spaced Test Content");
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoded);
					controller.close();
				}
			});
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset  =  windows-1252" }),
				ok: true,
				body: stream,
			};
		});
		const resultSpaced = await (fetcher as any).fetchSingle("https://example.com/spaced-charset");
		expect(resultSpaced).toBe("Spaced Test Content");
		(fetcher as any).cache.clear();

		// 4. Missing charset
		global.fetch = vi.fn().mockImplementation(async () => {
			const encoder = new TextEncoder();
			const encoded = encoder.encode("Missing Test Content");
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoded);
					controller.close();
				}
			});
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html" }),
				ok: true,
				body: stream,
			};
		});
		const resultMissing = await (fetcher as any).fetchSingle("https://example.com/missing-charset");
		expect(resultMissing).toBe("Missing Test Content");
		global.fetch = originalFetch;
	});

	it("should cancel unconsumed response bodies during redirect loops to prevent socket leaks", async () => {
		const originalFetch = global.fetch;
		const mockCancel = vi.fn().mockResolvedValue(undefined);

		global.fetch = vi.fn().mockImplementation(async (url) => {
			// Force an invalid redirect loop to trigger the body.cancel() behavior
			return {
				status: 302,
				headers: new Headers({
					location: "http://169.254.169.254/latest/meta-data/",
				}),
				ok: false,
				body: { cancel: mockCancel },
			};
		});

		const result = await (fetcher as any).fetchSingle(
			"https://example.com/loop",
		);
		expect(result).toContain("Error: Redirected to invalid or insecure URL");
		expect(mockCancel).toHaveBeenCalled();

		global.fetch = originalFetch;
	});

	it("should reject non-text content types", async () => {
		const originalFetch = global.fetch;
		const mockCancel = vi.fn().mockResolvedValue(undefined);

		global.fetch = vi.fn().mockImplementation(async (url) => {
			return {
				ok: true,
				status: 200,
				headers: new Headers({
					"content-type": "application/zip",
				}),
				body: { cancel: mockCancel },
			};
		});

		const result = await (fetcher as any).fetchSingle(
			"https://example.com/archive.zip",
		);
		expect(result).toContain(
			"Error: Unsupported content type (application/zip)",
		);
		expect(mockCancel).toHaveBeenCalled();

		global.fetch = originalFetch;
	});

	it("should allow valid public HTTP/HTTPS URLs including tricky ones", async () => {
		const isValid = await (fetcher as any).isValidUrl(
			"https://en.wikipedia.org/wiki/AI",
		);
		expect(isValid).toBe(true);

		// To test real DNS we need a domain that actually resolves to a public IP.
		// 10.example.com may not resolve, so we'll mock dns.lookup or pick known public domains.
		// We will just test with real public domains for this assertion since dns is not mocked.
		const isValidTen = await (fetcher as any).isValidUrl(
			"http://example.com/foo",
		);
		expect(isValidTen).toBe(true);

		const isValidInternalLooking = await (fetcher as any).isValidUrl(
			"https://example.org",
		);
		expect(isValidInternalLooking).toBe(true);
	});

	it("should cache results to avoid redundant fetching", async () => {
		const targetUrl = "https://example.com/unique-test";

		// Pre-populate cache directly using normalized URL
		(fetcher as any).cache.set(
			"https://example.com/unique-test",
			"Cached Data Content",
		);

		// Should return from cache without fetching
		const result = await (fetcher as any).fetchSingle(targetUrl);
		expect(result).toBe("Cached Data Content");
	});

	it("should deduplicate batch fetches with different hash fragments", async () => {
		const originalFetch = global.fetch;
		const fetchMock = vi.fn().mockImplementation(async () => {
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html" }),
				ok: true,
				text: async () => "Mocked content",
			};
		});
		global.fetch = fetchMock;

		// Since dns.lookup cannot be easily redefined, we can just spy on fetchSingle instead,
		// but since it's private we can just use the global fetch mock.
		// Real dns.lookup for example.com works and returns a public IP, so it passes SSRF checks.

		const urls = [
			"https://example.com/docs#section1",
			"https://example.com/docs#section2",
			"https://example.com/docs",
		];

		const results = await fetcher.fetchBatch(urls);

		// Global fetch should only be called once because all three URLs map to the same resource
		expect(fetchMock).toHaveBeenCalledTimes(1);

		expect(results.get("https://example.com/docs#section1")).toBe(
			"Mocked content",
		);
		expect(results.get("https://example.com/docs#section2")).toBe(
			"Mocked content",
		);
		expect(results.get("https://example.com/docs")).toBe("Mocked content");

		global.fetch = originalFetch;
	});

	it("should decode response body correctly using charset from Content-Type", async () => {
		const fetcher = new WebFetcher(3);
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset=ISO-8859-1" }),
				ok: true,
				body: {
					getReader: () => {
						let done = false;
						return {
							read: async () => {
								if (!done) {
									done = true;
									// 0xe9 is 'é' in ISO-8859-1
									return { done: false, value: new Uint8Array([0xe9]) };
								}
								return { done: true, value: undefined };
							},
							cancel: async () => {},
						};
					},
				},
			};
		});

		const result = await (fetcher as any).fetchSingle("https://example.com/iso-test");
		expect(result).toBe("é");

		global.fetch = originalFetch;
	});

	it("should fallback to utf-8 if charset is unsupported", async () => {
		const fetcher = new WebFetcher(3);
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset=unsupported-charset" }),
				ok: true,
				body: {
					getReader: () => {
						let done = false;
						return {
							read: async () => {
								if (!done) {
									done = true;
									return { done: false, value: new Uint8Array([0x61]) }; // 'a'
								}
								return { done: true, value: undefined };
							},
							cancel: async () => {},
						};
					},
				},
			};
		});

		const result = await (fetcher as any).fetchSingle("https://example.com/fallback-test");
		expect(result).toBe("a");

		global.fetch = originalFetch;
	});

	it("should handle extra spaces in Content-Type gracefully", async () => {
		const fetcher = new WebFetcher(3);
		const originalFetch = global.fetch;

		global.fetch = vi.fn().mockImplementation(async () => {
			const encoder = new TextEncoder();
			const encoded = encoder.encode("Spaced Test Content");
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoded);
					controller.close();
				}
			});
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset  =  windows-1252" }),
				ok: true,
				body: stream,
			};
		});
		const resultSpaced = await (fetcher as any).fetchSingle("https://example.com/spaced-charset");
		expect(resultSpaced).toBe("Spaced Test Content");

		global.fetch = originalFetch;
	});

	it("should handle missing charset in Content-Type gracefully", async () => {
		const fetcher = new WebFetcher(3);
		const originalFetch = global.fetch;

		global.fetch = vi.fn().mockImplementation(async () => {
			const encoder = new TextEncoder();
			const encoded = encoder.encode("Missing Test Content");
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoded);
					controller.close();
				}
			});
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html" }),
				ok: true,
				body: stream,
			};
		});
		const resultMissing = await (fetcher as any).fetchSingle("https://example.com/missing-charset");
		expect(resultMissing).toBe("Missing Test Content");

		global.fetch = originalFetch;
	});

	it("should gracefully handle malformed or non-UTF-8 charsets in Content-Type header", async () => {
		const originalFetch = global.fetch;

		// 1. Valid non-utf-8 charset
		global.fetch = vi.fn().mockImplementation(async () => {
			const encoder = new TextEncoder();
			const encoded = encoder.encode("Valid Test Content");
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoded);
					controller.close();
				}
			});
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset=windows-1252" }),
				ok: true,
				body: stream,
			};
		});
		let result = await (fetcher as any).fetchSingle("https://example.com/windows-1252");
		expect(result).toBe("Valid Test Content");
		(fetcher as any).cache.clear();

		// 2. Malformed/Unsupported charset fallback to utf-8
		global.fetch = vi.fn().mockImplementation(async () => {
			const encoder = new TextEncoder();
			const encoded = encoder.encode("Malformed Test Content");
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(encoded);
					controller.close();
				}
			});
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset=invalid-charset" }),
				ok: true,
				body: stream,
			};
		});
		result = await (fetcher as any).fetchSingle("https://example.com/malformed-charset");
		expect(result).toBe("Malformed Test Content");

		global.fetch = originalFetch;
	});

	it("should evict normalizedUrl from cache on fetch error", async () => {
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {
			return {
				status: 500,
				headers: new Headers({ "content-type": "text/html" }),
				ok: false,
				body: { cancel: vi.fn().mockResolvedValue(undefined) },
			};
		});

		const targetUrl = "https://example.com/error-test#section";
		const normalizedUrl = "https://example.com/error-test";
		await fetcher["fetchSingle"](targetUrl);

		expect((fetcher as any).cache.has(normalizedUrl)).toBe(false);

		global.fetch = originalFetch;
	});

	it("should remove both targetUrl and normalizedUrl from cache on failure", async () => {
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {
			return {
				status: 404,
				headers: new Headers({ "content-type": "text/html" }),
				ok: false,
				body: { cancel: vi.fn().mockResolvedValue(undefined) },
			};
		});

		const targetUrl = "https://example.com/not-found#section";
		const normalizedUrl = "https://example.com/not-found";

		const result = await (fetcher as any).fetchSingle(targetUrl);
		expect(result).toContain(
			"Error: HTTP 404 from https://example.com/not-found#section",
		);

		// Cache should not contain either URL

		expect((fetcher as any).cache.has(normalizedUrl)).toBe(false);

		global.fetch = originalFetch;
	});

	it("should preserve input URL order in the results map regardless of fetch completion time", async () => {
		const originalFetch = global.fetch;

		global.fetch = vi.fn().mockImplementation(async (url) => {
			if (url.includes("slow")) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html" }),
				ok: true,
				text: async () => `Mock ${url}`,
			};
		});

		const urls = [
			"https://example.com/slow",
			"https://example.com/fast",
		];

		const results = await fetcher.fetchBatch(urls);
		expect(Array.from(results.keys())).toEqual(urls);

		global.fetch = originalFetch;
	});

	it("should strip boilerplate HTML tags to save context", async () => {
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html" }),
				ok: true,
				text: async () => "<nav>Navigation</nav><footer>Footer</footer><noscript>No JS</noscript><iframe>Ads</iframe><p>Main content</p>"
			};
		});

		const result = await (fetcher as any).fetchSingle("https://example.com/test-strip");
		expect(result).toBe("Main content");

		global.fetch = originalFetch;
	});



	it("should decode response body correctly using charset from Content-Type", async () => {
		const fetcher = new WebFetcher(3);
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset=ISO-8859-1" }),
				ok: true,
				body: {
					getReader: () => {
						let done = false;
						return {
							read: async () => {
								if (!done) {
									done = true;
									// 0xe9 is 'é' in ISO-8859-1
									return { done: false, value: new Uint8Array([0xe9]) };
								}
								return { done: true, value: undefined };
							},
							cancel: async () => {},
						};
					},
				},
			};
		});

		const result = await (fetcher as any).fetchSingle("https://example.com/iso-test");
		expect(result).toBe("é");

		global.fetch = originalFetch;
	});

=======
	it("should fallback to utf-8 if charset is missing", async () => {
		const fetcher = new WebFetcher(3);
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html" }), // no charset
				ok: true,
				body: {
					getReader: () => {
						let done = false;
						return {
							read: async () => {
								if (!done) {
									done = true;
									return { done: false, value: new Uint8Array([0x61]) }; // 'a'
								}
								return { done: true, value: undefined };
							},
							cancel: async () => {},
						};
					},
				},
			};
		});

		const result = await (fetcher as any).fetchSingle("https://example.com/no-charset-test");
		expect(result).toBe("a");

		global.fetch = originalFetch;
	});
>>>>>>> origin/master
	it("should fallback to utf-8 if charset is unsupported", async () => {
		const fetcher = new WebFetcher(3);
		const originalFetch = global.fetch;
		global.fetch = vi.fn().mockImplementation(async () => {
			return {
				status: 200,
				headers: new Headers({ "content-type": "text/html; charset=unsupported-charset" }),
				ok: true,
				body: {
					getReader: () => {
						let done = false;
						return {
							read: async () => {
								if (!done) {
									done = true;
									return { done: false, value: new Uint8Array([0x61]) }; // 'a'
								}
								return { done: true, value: undefined };
							},
							cancel: async () => {},
						};
					},
				},
			};
		});

		const result = await (fetcher as any).fetchSingle("https://example.com/fallback-test");
		expect(result).toBe("a");

		global.fetch = originalFetch;
	});
<<<<<<< HEAD

		global.fetch = originalFetch;
	});
});
=======
>>>>>>> origin/master
