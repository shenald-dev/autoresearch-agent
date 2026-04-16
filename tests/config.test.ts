import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfigManager } from "../src/utils/config";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

vi.mock("node:fs/promises");

describe("ConfigManager", () => {
    let configManager: ConfigManager;

    beforeEach(() => {
        vi.clearAllMocks();
        configManager = new ConfigManager();
    });

    it("should propagate directory creation error", async () => {
        const error = new Error("EACCES: permission denied, mkdir '/root/.autoresearch'");
        vi.spyOn(fs, "mkdir").mockRejectedValueOnce(error);

        await expect(configManager.setConfig({ OPENAI_API_KEY: "test" })).rejects.toThrow("EACCES: permission denied, mkdir '/root/.autoresearch'");
    });

    it("should create directory and save config successfully", async () => {
        vi.spyOn(fs, "mkdir").mockResolvedValueOnce(undefined);
        vi.spyOn(fs, "readFile").mockResolvedValueOnce(JSON.stringify({}));
        vi.spyOn(fs, "writeFile").mockResolvedValueOnce(undefined);

        await configManager.setConfig({ OPENAI_API_KEY: "test" });

        expect(fs.mkdir).toHaveBeenCalledWith(path.join(os.homedir(), ".autoresearch"), { recursive: true });
        expect(fs.writeFile).toHaveBeenCalled();
    });
});
