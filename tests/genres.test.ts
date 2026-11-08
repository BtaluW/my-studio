import { describe, expect, it } from "vitest";
import { genreFilters } from "@/lib/genres";

describe("genreFilters", () => {
  it("offers only genres that have beats, alphabetically, with Other last", () => {
    expect(genreFilters(["R&B", "Other", "Afro beats", "Lo-Fi", "R&B", undefined, " "])).toEqual([
      "Afro beats",
      "Lo-Fi",
      "R&B",
      "Other",
    ]);
  });

  it("offers nothing when no beat has a genre", () => {
    expect(genreFilters([undefined, ""])).toEqual([]);
  });
});
