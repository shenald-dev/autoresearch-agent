/**
 * Extracts the charset from a Content-Type HTTP header.
 * Falls back to "utf-8" if no charset is found or the header is empty.
 *
 * @param contentType The raw Content-Type header string
 * @returns The extracted charset string
 */
export function extractCharset(contentType: string): string {
	if (!contentType) return "utf-8";

	const charsetMatch = contentType.match(/charset\s*=\s*['"]?([\w-]+)['"]?/i);
	return charsetMatch ? charsetMatch[1] : "utf-8";
}
