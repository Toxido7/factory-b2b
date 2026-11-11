import { describe, it, expect } from "vitest";
import { buildSearchUrl } from "./search.js";

describe("buildSearchUrl", () => {
  it("returns null for an empty or spaces-only term", () => {
    expect(buildSearchUrl("")).toBeNull();
    expect(buildSearchUrl("   ")).toBeNull();
  });

  it("trims the term", () => {
    expect(buildSearchUrl("  sac  ")).toBe("/products?q=sac");
  });

  it("cuts the term at 100 characters", () => {
    const url = buildSearchUrl("a".repeat(150));
    expect(url).toBe(`/products?q=${"a".repeat(100)}`);
  });

  it("encodes special characters", () => {
    expect(buildSearchUrl("é & test")).toBe("/products?q=%C3%A9+%26+test");
  });
});
