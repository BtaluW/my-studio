/**
 * Page copy that isn't music. These values are the fallback: when Sanity is
 * configured, the "Site settings" document overrides any field it fills in.
 * Replace the [BRACKETED] values.
 */
export interface SiteSettings {
  name: string;
  tagline: string;
  about: string[];
  contact: { email: string; links: { label: string; href: string }[] };
  /** Required in every marketing email under CASL. A PO box works. */
  mailingAddress: string;
  /** Public repo, linked in the footer. Not editable in Sanity. */
  repoUrl: string;
}

export const site: SiteSettings = {
  name: "W.I.L.L.I.A.M.S",
  tagline: "Beats made whenever the mood hits. Pick a track on the cover to drop the needle.",
  about: [
    "[A few lines about you: where you're from, how you make beats, what you're into.]",
    "[What artists can expect: genres, the gear or DAW you use, how to work with you.]",
  ],
  contact: {
    email: "[YOUR EMAIL]",
    links: [
      { label: "Instagram", href: "#" },
      { label: "YouTube", href: "#" },
    ],
  },
  mailingAddress: "[MAILING ADDRESS]",
  repoUrl: "#",
};
