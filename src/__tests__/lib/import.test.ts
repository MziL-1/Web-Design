import { describe, it, expect } from "vitest";
import { validateImportFile, parseMarkdown } from "@/lib/import";

describe("validateImportFile", () => {
  it("rejects files larger than 10MB", () => {
    const file = new File(["x".repeat(11 * 1024 * 1024)], "large.md", { type: "text/markdown" });
    const result = validateImportFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10MB");
  });

  it("rejects unsupported extensions", () => {
    const file = new File(["content"], "doc.pdf", { type: "application/pdf" });
    const result = validateImportFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported");
  });

  it("accepts .md files", () => {
    const file = new File(["# Hello"], "post.md", { type: "text/markdown" });
    const result = validateImportFile(file);
    expect(result.valid).toBe(true);
  });

  it("accepts .docx files", () => {
    const file = new File([], "report.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const result = validateImportFile(file);
    expect(result.valid).toBe(true);
  });

  it("accepts .doc files", () => {
    const file = new File([], "notes.doc", { type: "application/msword" });
    const result = validateImportFile(file);
    expect(result.valid).toBe(true);
  });
});

describe("parseMarkdown", () => {
  it("extracts content from markdown file", async () => {
    const file = new File(["# Hello\n\nWorld"], "test.md", { type: "text/markdown" });
    const result = await parseMarkdown(file);
    expect(result.content).toBe("# Hello\n\nWorld");
    expect(result.wordCount).toBe(3);
    expect(result.filename).toBe("test.md");
  });

  it("returns empty content for empty file", async () => {
    const file = new File([""], "empty.md", { type: "text/markdown" });
    const result = await parseMarkdown(file);
    expect(result.content).toBe("");
    expect(result.wordCount).toBe(0);
  });
});
