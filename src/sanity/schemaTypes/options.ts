export { GENRES } from "../../lib/genres";

const ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
/** "C maj", "C min", "C# maj", … — the same format the UI prints. */
export const MUSICAL_KEYS = ROOTS.flatMap((r) => [`${r} maj`, `${r} min`]);
