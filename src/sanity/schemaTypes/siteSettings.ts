import { defineArrayMember, defineField, defineType } from "sanity";

/** Singleton (document ID "siteSettings"). Empty fields fall back to src/config/site.ts. */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "artistName",
      type: "string",
      description: "Logo and record labels. Dots become red diamonds in the logo.",
    }),
    defineField({ name: "tagline", type: "string", validation: (r) => r.max(140) }),
    defineField({
      name: "about",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 3 })],
      validation: (r) => r.max(4),
    }),
    defineField({ name: "contactEmail", type: "email" }),
    defineField({
      name: "links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "label", type: "string", validation: (r) => r.required() }),
            defineField({ name: "url", type: "url", validation: (r) => r.required().uri({ scheme: ["https"] }) }),
          ],
        }),
      ],
    }),
    defineField({
      name: "mailingAddress",
      type: "string",
      description: "Required in marketing emails under CASL. A PO box is fine.",
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
