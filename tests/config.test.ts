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

    it("should cache configuration in memory to prevent redundant file reads", async () => {
        vi.spyOn(fs, "readFile").mockResolvedValue('{"OPENAI_API_KEY":"cached-key"}');

        const firstCall = await configManager.getConfig();
        const secondCall = await configManager.getConfig();

        expect(firstCall.OPENAI_API_KEY).toBe("cached-key");
        expect(secondCall.OPENAI_API_KEY).toBe("cached-key");
        expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it("should update cache after successful setConfig", async () => {
        vi.spyOn(fs, "readFile").mockResolvedValue('{"OPENAI_API_KEY":"old-key"}');
        vi.spyOn(fs, "mkdir").mockResolvedValue(undefined);
        vi.spyOn(fs, "writeFile").mockResolvedValue(undefined);

        const beforeSet = await configManager.getConfig();
        expect(beforeSet.OPENAI_API_KEY).toBe("old-key");
        expect(fs.readFile).toHaveBeenCalledTimes(1);

        await configManager.setConfig({ OPENAI_API_KEY: "new-key" });

        const afterSet = await configManager.getConfig();
        expect(afterSet.OPENAI_API_KEY).toBe("new-key");
        // fs.readFile should still only have been called once, the first time.
        expect(fs.readFile).toHaveBeenCalledTimes(1);
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
