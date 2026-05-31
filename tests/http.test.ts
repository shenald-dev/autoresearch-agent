import { describe, expect, it } from "vitest";
import { extractCharset } from "../src/utils/http";

describe("http utils", () => {
	describe("extractCharset", () => {
		it("should return utf-8 when no charset is present", () => {
			expect(extractCharset("text/html")).toBe("utf-8");
		});

		it("should return utf-8 when contentType is empty", () => {
			expect(extractCharset("")).toBe("utf-8");
		});

		it("should extract charset without quotes", () => {
			expect(extractCharset("text/html; charset=iso-8859-1")).toBe("iso-8859-1");
		});

		it("should extract charset with single quotes", () => {
			expect(extractCharset("text/html; charset='windows-1251'")).toBe("windows-1251");
		});

		it("should extract charset with double quotes", () => {
			expect(extractCharset('text/html; charset="utf-16"')).toBe("utf-16");
		});

		it("should handle extra spaces", () => {
			expect(extractCharset("text/html;   charset  =  'windows-1251'  ")).toBe("windows-1251");
		});

		it("should handle case-insensitivity", () => {
			expect(extractCharset("TEXT/HTML; CharSet=ISO-8859-1")).toBe("iso-8859-1");
		});
	});
});
