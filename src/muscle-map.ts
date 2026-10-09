// Seed muscles from spike/FINDINGS.md. `nodes` are base names; each exists as "<name>.l" and "<name>.r".
export interface Muscle {
  id: string;
  label: string;
  nodes: readonly string[];
}

export const MUSCLES: readonly Muscle[] = [
  { id: "pectoralis_major", label: "Pectoralis major", nodes: ["Clavicular head of pectoralis major muscle", "Sternocostal head of pectoralis major muscle", "(Abdominal part of pectoralis major muscle)"] },
  { id: "deltoid", label: "Deltoid", nodes: ["Clavicular part of deltoid muscle", "Acromial part of deltoid muscle", "Scapular spinal part of deltoid muscle"] },
  { id: "latissimus_dorsi", label: "Latissimus dorsi", nodes: ["Latissimus dorsi muscle"] },
  { id: "trapezius", label: "Trapezius", nodes: ["Descending part of trapezius muscle", "Transverse part of trapezius muscle", "Ascending part of trapezius muscle"] },
  { id: "serratus_anterior", label: "Serratus anterior", nodes: ["Serratus anterior muscle"] },
  { id: "biceps_brachii", label: "Biceps brachii", nodes: ["Long head of biceps brachii", "Short head of biceps brachii"] },
  { id: "triceps_brachii", label: "Triceps brachii", nodes: ["Long head of triceps brachii", "Lateral head of triceps brachii", "Medial head of triceps brachii"] },
  { id: "rectus_abdominis", label: "Rectus abdominis", nodes: ["Rectus abdominis muscle"] },
  { id: "gluteus_maximus", label: "Gluteus maximus", nodes: ["Gluteus maximus muscle"] },
  { id: "quadriceps_femoris", label: "Quadriceps femoris", nodes: ["Rectus femoris muscle", "Vastus lateralis muscle", "Vastus medialis muscle", "Vastus intermedius muscle"] },
  { id: "biceps_femoris", label: "Biceps femoris", nodes: ["Long head of biceps femoris", "Short head of biceps femoris"] },
  { id: "semitendinosus", label: "Semitendinosus", nodes: ["Semitendinosus muscle"] },
  { id: "semimembranosus", label: "Semimembranosus", nodes: ["Semimembranosus muscle"] },
  { id: "gastrocnemius", label: "Gastrocnemius", nodes: ["Medial head of gastrocnemius", "Lateral head of gastrocnemius"] },
  { id: "soleus", label: "Soleus", nodes: ["Soleus muscle"] },
];

export const MUSCLE_BY_ID: Readonly<Record<string, Muscle>> = Object.fromEntries(MUSCLES.map((m) => [m.id, m]));
