import type { View } from "./camera";

// Seed muscles from spike/FINDINGS.md. `nodes` are base names; each exists as "<name>.l" and "<name>.r".
export interface Muscle {
  id: string;
  label: string;
  nodes: readonly string[];
  /** Side of the body the muscle is seen from; drives the camera azimuth on focus. */
  view: View;
}

export const MUSCLES: readonly Muscle[] = [
  { id: "pectoralis_major", label: "Pectoralis major", nodes: ["Clavicular head of pectoralis major muscle", "Sternocostal head of pectoralis major muscle", "(Abdominal part of pectoralis major muscle)"], view: "front" },
  { id: "deltoid", label: "Deltoid", nodes: ["Clavicular part of deltoid muscle", "Acromial part of deltoid muscle", "Scapular spinal part of deltoid muscle"], view: "front" },
  { id: "latissimus_dorsi", label: "Latissimus dorsi", nodes: ["Latissimus dorsi muscle"], view: "back" },
  { id: "trapezius", label: "Trapezius", nodes: ["Descending part of trapezius muscle", "Transverse part of trapezius muscle", "Ascending part of trapezius muscle"], view: "back" },
  { id: "serratus_anterior", label: "Serratus anterior", nodes: ["Serratus anterior muscle"], view: "front" },
  { id: "biceps_brachii", label: "Biceps brachii", nodes: ["Long head of biceps brachii", "Short head of biceps brachii"], view: "front" },
  { id: "triceps_brachii", label: "Triceps brachii", nodes: ["Long head of triceps brachii", "Lateral head of triceps brachii", "Medial head of triceps brachii"], view: "back" },
  { id: "rectus_abdominis", label: "Rectus abdominis", nodes: ["Rectus abdominis muscle"], view: "front" },
  { id: "gluteus_maximus", label: "Gluteus maximus", nodes: ["Gluteus maximus muscle"], view: "back" },
  { id: "quadriceps_femoris", label: "Quadriceps femoris", nodes: ["Rectus femoris muscle", "Vastus lateralis muscle", "Vastus medialis muscle", "Vastus intermedius muscle"], view: "front" },
  { id: "biceps_femoris", label: "Biceps femoris", nodes: ["Long head of biceps femoris", "Short head of biceps femoris"], view: "back" },
  { id: "semitendinosus", label: "Semitendinosus", nodes: ["Semitendinosus muscle"], view: "back" },
  { id: "semimembranosus", label: "Semimembranosus", nodes: ["Semimembranosus muscle"], view: "back" },
  { id: "gastrocnemius", label: "Gastrocnemius", nodes: ["Medial head of gastrocnemius", "Lateral head of gastrocnemius"], view: "back" },
  { id: "soleus", label: "Soleus", nodes: ["Soleus muscle"], view: "back" },
];

export const MUSCLE_BY_ID: Readonly<Record<string, Muscle>> = Object.fromEntries(MUSCLES.map((m) => [m.id, m]));
