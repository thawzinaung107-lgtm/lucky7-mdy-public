import { describe, expect, it } from "vitest";
import { cleanName } from "@/lib/admin.functions";

describe("catalog name rules", () => {
  it("rejects an empty name", () => expect(() => cleanName("   ", "name_my")).toThrow());
  it("trims names", () => expect(cleanName("  Dresses ", "name_en")).toBe("Dresses"));
  it("rejects names over 200 characters", () => expect(() => cleanName("a".repeat(201), "name_en")).toThrow());
  it("allows empty summaries", () => expect(cleanName("", "summary_my", true)).toBe(""));
});
