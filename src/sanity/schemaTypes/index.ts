import { beat } from "./beat";
import { playlist } from "./playlist";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [beat, playlist, siteSettings];

/** Singleton types: one fixed document each, no "create new" or delete. */
export const SINGLETON_TYPES = new Set(["siteSettings"]);
