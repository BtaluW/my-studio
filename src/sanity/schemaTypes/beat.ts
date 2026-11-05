import { defineField, defineType } from "sanity";
import { audioBaseUrl } from "../env";
import { GENRES, MUSICAL_KEYS } from "./options";

export const beat = defineType({
  name: "beat",
  title: "Beat",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required().max(40),
    }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Used as the track's ID. Don't change it after publishing.",
      options: { source: "title", maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "audio",
      title: "Preview audio",
      type: "object",
      description: "Filled in by `npm run upload-beat`. Tagged previews only, never masters.",
      validation: (r) => r.required(),
      fields: [
        defineField({
          name: "url",
          type: "url",
          validation: (r) =>
            r
              .required()
              .uri({ scheme: ["https"] })
              .custom((value) => {
                if (!value || !audioBaseUrl) return true;
                return value.startsWith(`${audioBaseUrl}/`) || `Must be hosted on ${audioBaseUrl}`;
              }),
        }),
        defineField({
          name: "key",
          title: "R2 object key",
          type: "string",
          readOnly: true
        }),
        defineField({
          name: "duration",
          title: "Duration (seconds)",
          type: "number",
          readOnly: true,
          validation: (r) => r.min(1),
        }),
      ],
    }),
    defineField({
      name: "genre",
      type: "string",
      options: { list: [...GENRES], layout: "dropdown" },
    }),
    defineField({
      name: "bpm",
      title: "BPM",
      type: "number",
      validation: (r) => r.integer().min(40).max(220),
    }),
    defineField({
      name: "key",
      title: "Musical key",
      type: "string",
      options: { list: MUSICAL_KEYS, layout: "dropdown" },
    }),
    defineField({
      name: "cover",
      title: "Cover art",
      type: "image",
      description: "Square, at least 1200 × 1200. Shown behind the record while this beat plays, and in the list. Optional.",
      options: { hotspot: true },
    }),
    defineField({
      name: "hue",
      title: "Label colour (hue 0–360)",
      type: "number",
      description: "0 red · 30 orange · 60 yellow · 120 green · 190 teal · 230 blue · 270 purple · 320 pink",
      initialValue: 262,
      validation: (r) => r.min(0).max(360),
    }),
    defineField({
      name: "releasedAt",
      title: "Release date",
      type: "date",
      description: "Newest first under “All beats”.",
      initialValue: () => new Date().toLocaleDateString("en-CA"),
    }),
  ],
  orderings: [{ 
    title: "Newest first", 
    name: "releasedDesc", 
    by: [{ 
      field: "releasedAt", 
      direction: "desc" 
    }] 
  }],
  preview: {
    select: { title: "title", genre: "genre", bpm: "bpm", url: "audio.url", media: "cover" },
    prepare: ({ title, genre, bpm, url, media }) => ({
      title,
      media,
      subtitle: [genre, bpm && `${bpm} BPM`, !url && "⚠ no audio"].filter(Boolean).join(" · "),
    }),
  },
});
