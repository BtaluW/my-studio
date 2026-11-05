import { defineArrayMember, defineField, defineType } from "sanity";

export const playlist = defineType({
  name: "playlist",
  title: "Playlist",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required().max(24) }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 48 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "beats",
      type: "array",
      description: `The beats in this playlist, in order. A beat can be in multiple playlists. Empty playlists are ignored.`,
      of: [defineArrayMember({ type: "reference", to: [{ type: "beat" }] })],
      validation: (r) => r.unique(),
    }),
  ],
  preview: {
    select: { title: "name", beats: "beats" },
    prepare: ({ title, beats }) => ({ title, subtitle: `${beats?.length ?? 0} beats` }),
  },
});
