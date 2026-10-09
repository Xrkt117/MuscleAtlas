import { MUSCLE_BY_ID } from "../muscle-map";
import { formatCitation, getFacts, getSource } from "./index";
import type { Cite } from "./types";

export interface PanelCite { short: string; full: string; licence: string }
export interface PanelAction extends PanelCite { text: string; quote: string }
export interface PanelEvidence extends PanelCite { text: string; badges: ("Abstract only" | "Single study")[] }
export interface PanelModel { id: string; title: string; actions: PanelAction[]; specific: PanelEvidence[]; general: PanelEvidence[] }

function panelCite(cite: Cite): PanelCite {
  const s = getSource(cite.sourceId);
  const page = cite.locator.match(/\(p\. ([^)]+)\)|\bpp?\. \d+(?:[-–]\d+)?/);
  const where = page ? `p${page[1] === undefined ? page[0].slice(1) : `. ${page[1]}`}` : /abstract/i.test(cite.locator) ? "abstract" : "";
  return { short: where ? `${s.short}, ${where}` : s.short, full: formatCitation(cite), licence: s.licence };
}

export function buildPanelModel(id: string): PanelModel {
  const f = getFacts(id);
  const evidence = (general: boolean): PanelEvidence[] =>
    f.evidence
      .filter((e) => !!e.general === general)
      .map((e) => ({
        text: e.text,
        ...panelCite(e.cite),
        badges: e.caveat === "abstract-only" ? ["Abstract only"] : e.caveat === "single-study" ? ["Single study"] : [],
      }));
  return {
    id,
    title: MUSCLE_BY_ID[id].label,
    actions: f.actions.map((a) => ({ text: a.text, quote: a.cite.quote, ...panelCite(a.cite) })),
    specific: evidence(false),
    general: evidence(true),
  };
}
