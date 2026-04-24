import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const messageMock = vi.fn();
const startMock = vi.fn();
const stopMock = vi.fn();

vi.mock("@clack/prompts", () => ({
	intro: vi.fn(),
	outro: vi.fn(),
	text: vi.fn(),
	password: vi.fn(),
	select: vi.fn(),
	isCancel: vi.fn().mockReturnValue(false),
	spinner: vi.fn().mockReturnValue({
		start: startMock,
		stop: stopMock,
		message: messageMock,
	}),
	log: {
		step: vi.fn(),
		message: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock("../src/core/engine", () => {
    return {
        ResearchEngine: class {
            constructor() {}
            async run(topic: string, onProgress?: (msg: string) => void) {
                if (onProgress) {
                    onProgress("Test progress message");
                }
                return "Mock report";
            }
        }
    };
});

describe("CLI WebFetcher index", () => {
    let originalArgv;
    let originalExit;

    beforeEach(() => {
        vi.resetModules();
        originalArgv = process.argv;
        originalExit = process.exit;
        process.exit = vi.fn();
    });

    afterEach(() => {
        process.argv = originalArgv;
        process.exit = originalExit;
    });

	it("should pass progress callback to engine.run that calls spinner.message", async () => {
        process.argv = ['node', 'index.js', 'research', '-t', 'test-topic', '-d', '1'];
        await import("../src/index.ts");

        // Let event loop clear for async commander commands
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(messageMock).toHaveBeenCalledWith("Test progress message");
	});
});
