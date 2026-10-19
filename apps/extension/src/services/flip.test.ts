import { describe, expect, it } from "vitest";
import { flipOffset } from "@/services/flip";

describe("flipOffset", () => {
  it("returns the inverted delta from the new position back to the old one", () => {
    expect(flipOffset({ left: 120, top: 40 }, { left: 20, top: 300 })).toEqual({ dx: 100, dy: -260 });
  });

  it("ignores sub-pixel movement", () => {
    expect(flipOffset({ left: 10.4, top: 5 }, { left: 10, top: 5.6 })).toBeNull();
  });
});
