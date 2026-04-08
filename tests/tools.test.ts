import { WebSearch } from "../src/tools/WebSearch";
import { FileWriter } from "../src/tools/FileWriter";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

describe("WebSearch", () => {
    it("should return mock results when no API key is set", async () => {
        delete process.env.SERPAPI_KEY;
        const search = new WebSearch();
        const results = await search.search("artificial intelligence");
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toHaveProperty("title");
        expect(results[0]).toHaveProperty("link");
        expect(results[0]).toHaveProperty("snippet");
    });

    it("should respect maxResults parameter", async () => {
        delete process.env.SERPAPI_KEY;
        const search = new WebSearch();
        const results = await search.search("test topic", 2);
        expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should include topic in mock results", async () => {
        delete process.env.SERPAPI_KEY;
        const search = new WebSearch();
        const results = await search.search("quantum computing");
        const hasTopicReference = results.some(
            (r) => r.title.includes("quantum computing") || r.snippet.includes("quantum computing")
        );
        expect(hasTopicReference).toBe(true);
    });
});

describe("FileWriter", () => {
    let writer: FileWriter;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "autoresearch-test-"));
        process.env.OUTPUT_MD_DIR = path.join(tempDir, "markdown");
        process.env.OUTPUT_JSON_DIR = path.join(tempDir, "json");
        writer = new FileWriter();
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
        delete process.env.OUTPUT_MD_DIR;
        delete process.env.OUTPUT_JSON_DIR;
    });

    it("should create markdown output file", async () => {
        const filepath = await writer.writeMarkdown("test-doc", "# Hello World");
        const content = await fs.readFile(filepath, "utf-8");
        expect(content).toBe("# Hello World");
    });

    it("should create JSON output file", async () => {
        const filepath = await writer.writeJSON("test-data", { topic: "AI", count: 5 });
        const content = JSON.parse(await fs.readFile(filepath, "utf-8"));
        expect(content.topic).toBe("AI");
        expect(content.count).toBe(5);
    });

    it("should create directories recursively", async () => {
        const filepath = await writer.writeMarkdown("nested-test", "content");
        const exists = await fs.stat(filepath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
    });
});
