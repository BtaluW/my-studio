"use client";

/**
 * Sanity Studio, embedded at /studio (see docs/adr/0003-embedded-studio.md).
 */
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { schemaTypes, SINGLETON_TYPES } from "./src/sanity/schemaTypes";

export default defineConfig({
  name: "default",
  title: "W.I.L.L.I.A.M.S Beats",
  basePath: "/studio",
  // An empty ID would crash Studio; the /studio page shows setup help instead.
  projectId: projectId || "not-configured",
  dataset,
  schema: {
    types: schemaTypes,
    // Hide singletons from the "new document" menu.
    templates: (templates) => templates.filter((t) => !SINGLETON_TYPES.has(t.schemaType)),
  },
  document: {
    // No duplicate/delete on singletons.
    actions: (actions, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? actions.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : actions,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.documentTypeListItem("beat").title("Beats"),
            S.documentTypeListItem("playlist").title("Playlists"),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
