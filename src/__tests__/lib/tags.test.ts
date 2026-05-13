import { describe, it, expect } from "vitest";
import { validateTagName, PRESET_TAGS } from "@/lib/tags";

describe("validateTagName", () => {
  it("accepts valid tag names", () => {
    expect(validateTagName("JavaScript").valid).toBe(true);
    expect(validateTagName("React").valid).toBe(true);
    expect(validateTagName("前端").valid).toBe(true);
  });

  it("rejects empty tag name", () => {
    const result = validateTagName("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("1-30");
  });

  it("rejects tag name longer than 30 chars", () => {
    const result = validateTagName("a".repeat(31));
    expect(result.valid).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(validateTagName(123).valid).toBe(false);
    expect(validateTagName(null).valid).toBe(false);
  });

  it("rejects special characters", () => {
    expect(validateTagName("<script>").valid).toBe(false);
    expect(validateTagName("tag@name").valid).toBe(false);
  });
});

describe("PRESET_TAGS", () => {
  it("contains expected presets", () => {
    expect(PRESET_TAGS.length).toBeGreaterThan(0);
    expect(PRESET_TAGS).toContain("JavaScript");
    expect(PRESET_TAGS).toContain("React");
    expect(PRESET_TAGS).toContain("Frontend");
  });
});
