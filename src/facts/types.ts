export interface Source {
  id: string;
  kind: "textbook" | "paper" | "dataset";
  title: string;
  authors: string;
  year: number;
  url: string;
  doi?: string;
  /** As stated on the source page. */
  licence: string;
  /** ISO date the page was read. */
  readOn: string;
}
export interface Cite { sourceId: string; locator: string; quote: string }
export interface ActionClaim { text: string; cite: Cite }
export interface ExerciseLink {
  datasetId: string;
  name: string;
  datasetPrimary: string[];
  datasetSecondary: string[];
  role: "primary" | "secondary";
  cite: Cite;
}
export interface EvidenceClaim { text: string; appliesTo: string[] | "all"; cite: Cite }

export type MusclesFile = Record<string, { actions: ActionClaim[] }>;
export type ExercisesFile = Record<string, ExerciseLink[]>;
export type EvidenceFile = EvidenceClaim[];
export type SourcesFile = Source[];
