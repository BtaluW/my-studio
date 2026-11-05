export const GENRES = [
  "Afro beats",
  "Hip-hop",
  "House",
  "Lo-Fi",
  "Pop",
  "R&B",
  "Trap",
  "Other",
] as const;

/**
 * The genre filters to show: only genres that at least one beat has, in
 * alphabetical order with "Other" last. A genre with no beats gets no filter.
 */
export function genreFilters(genres: Iterable<string | undefined>): string[] {
  const present = new Set<string>();
  for (const g of genres) if (g?.trim()) present.add(g.trim());
  return [...present].sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b, "en", { sensitivity: "base" });
  });
}
