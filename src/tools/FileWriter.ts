import * as fs from "fs/promises";
import * as path from "path";

/**
 * File writer tool — saves research outputs to markdown and JSON files.
 */
export class FileWriter {
    private mdDir: string;
    private jsonDir: string;

    constructor() {
        this.mdDir = process.env.OUTPUT_MD_DIR || "outputs/markdown";
        this.jsonDir = process.env.OUTPUT_JSON_DIR || "outputs/json";
    }

    async writeMarkdown(filename: string, content: string): Promise<string> {
        await fs.mkdir(this.mdDir, { recursive: true });
        const filepath = path.join(this.mdDir, `${filename}.md`);
        await fs.writeFile(filepath, content, "utf-8");
        return filepath;
    }

    async writeJSON(filename: string, data: unknown): Promise<string> {
        await fs.mkdir(this.jsonDir, { recursive: true });
        const filepath = path.join(this.jsonDir, `${filename}.json`);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
        return filepath;
    }

    async writeAll(
        topic: string,
        content: { markdown: string; data: unknown }
    ): Promise<{ mdPath: string; jsonPath: string }> {
        const slug = topic
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `${slug}_${timestamp}`;

        const mdPath = await this.writeMarkdown(filename, content.markdown);
        const jsonPath = await this.writeJSON(filename, content.data);

        return { mdPath, jsonPath };
    }
}
