/**
 * Re-exports so `@/lib/utils` keeps resolving, which is what every shadcn/ui component
 * imports and what `components.json` points at.
 *
 * The directory layout follows SSOT §12 (`lib/utils/{cn,format,date,csv,query-params}.ts`).
 * A single `lib/utils.ts` file would have shadowed that directory: `@/lib/utils` resolves the
 * file before the folder, so the two would coexist confusingly — one name, two places.
 *
 * Kept to plain re-exports. Modules with real weight should be imported directly
 * (`@/lib/utils/date`) rather than pulled through here.
 */
export { cn } from "./cn";
