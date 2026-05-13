import { describe, it, expect } from "vitest";
import { validateUsername, validateEmail, validatePassword, validateLength, validateTagName } from "@/lib/validation";

describe("validateUsername", () => {
  it("accepts valid usernames", () => {
    expect(validateUsername("test_user")).toBe("");
    expect(validateUsername("user-123")).toBe("");
    expect(validateUsername("abc")).toBe("");
  });

  it("rejects short usernames", () => {
    expect(validateUsername("ab")).toContain("3-30");
  });

  it("rejects reserved usernames", () => {
    expect(validateUsername("admin")).toContain("保留字");
    expect(validateUsername("api")).toContain("保留字");
    expect(validateUsername("login")).toContain("保留字");
  });

  it("rejects uppercase letters", () => {
    expect(validateUsername("TestUser")).toContain("小写字母");
  });
});

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("test@example.com")).toBe("");
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("not-an-email")).toContain("格式不正确");
  });
});

describe("validatePassword", () => {
  it("accepts valid passwords", () => {
    expect(validatePassword("abcdef")).toBe("");
  });

  it("rejects short passwords", () => {
    expect(validatePassword("12345")).toContain("6-128");
  });
});

describe("validateLength", () => {
  it("validates min and max bounds", () => {
    expect(validateLength("", "bio", 0, 50)).toBe("");
    expect(validateLength("short", "bio", 10, 50)).toContain("不能少于");
    expect(validateLength("a".repeat(51), "bio", 0, 50)).toContain("不能超过");
  });
});

describe("validateTagName", () => {
  it("accepts valid tag names", () => {
    expect(validateTagName("JavaScript")).toBe("");
    expect(validateTagName("前端开发")).toBe("");
  });

  it("rejects invalid tag names", () => {
    expect(validateTagName("")).toContain("1-30");
    expect(validateTagName("<tag>")).toContain("无效字符");
  });
});
