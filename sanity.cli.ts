import { defineCliConfig } from "sanity/cli";

/** Used by `npx sanity …` commands (schema extract, typegen, dataset tools). */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  },
  typegen: {
    schema: "sanity.schema.json",
    path: ["./src/**/*.{ts,tsx}"],
    generates: "./src/sanity/sanity.types.ts",
  },
});
