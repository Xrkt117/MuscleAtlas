import { MUSCLE_BY_ID, MUSCLES } from "./muscle-map";
import { createViewer, type AtlasApi } from "./viewer";

declare global {
  interface Window { atlas: AtlasApi }
}

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing from index.html`);
  return el as T;
};
const list = $<HTMLUListElement>("list");
const selectedEl = $("selected");
const buttons = new Map<string, HTMLButtonElement>();

try {
  const atlas = await createViewer($("stage"));
  window.atlas = atlas;

  const select = (id: string | null) => {
    if (id === null) {
      atlas.clear();
    } else {
      atlas.highlight([id]);
      atlas.focus(id);
    }
    selectedEl.textContent = id === null ? "" : `Selected: ${MUSCLE_BY_ID[id].label}`;
    buttons.forEach((b, bid) => b.setAttribute("aria-pressed", String(bid === id)));
  };

  for (const m of MUSCLES) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = m.label;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => select(m.id));
    li.appendChild(b);
    list.appendChild(li);
    buttons.set(m.id, b);
  }
  $("clear").addEventListener("click", () => select(null));
  // Click on empty space or an unmapped muscle leaves the current selection alone.
  atlas.onSelect((id) => { if (id !== null) select(id); });
} catch (err) {
  console.error("MuscleAtlas failed to load", err);
  const banner = $("error");
  banner.textContent = `Could not load the 3D model: ${err instanceof Error ? err.message : String(err)}`;
  banner.style.display = "block";
}
