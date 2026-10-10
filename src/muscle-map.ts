import type { View } from "./camera";

// Mapped Z-Anatomy muscle groups. `nodes` are base names; each exists as "<name>.l" and "<name>.r".
export interface Muscle {
  id: string;
  label: string;
  nodes: readonly string[];
  /** Side of the body the muscle is seen from; drives the camera azimuth on focus. */
  view: View;
}

export const MUSCLES: readonly Muscle[] = [
  {
    id: "pectoralis_major",
    label: "Pectoralis major",
    nodes: [
      "Clavicular head of pectoralis major muscle",
      "Sternocostal head of pectoralis major muscle",
      "(Abdominal part of pectoralis major muscle)",
    ],
    view: "front",
  },
  {
    id: "deltoid",
    label: "Deltoid",
    nodes: [
      "Clavicular part of deltoid muscle",
      "Acromial part of deltoid muscle",
      "Scapular spinal part of deltoid muscle",
    ],
    view: "front",
  },
  {
    id: "latissimus_dorsi",
    label: "Latissimus dorsi",
    nodes: ["Latissimus dorsi muscle"],
    view: "back",
  },
  {
    id: "teres_major",
    label: "Teres major",
    nodes: ["Teres major muscle"],
    view: "back",
  },
  {
    id: "trapezius",
    label: "Trapezius",
    nodes: [
      "Descending part of trapezius muscle",
      "Transverse part of trapezius muscle",
      "Ascending part of trapezius muscle",
    ],
    view: "back",
  },
  {
    id: "rhomboids",
    label: "Rhomboids",
    nodes: [
      "Rhomboid major muscle",
      "Rhomboid minor muscle",
    ],
    view: "back",
  },
  {
    id: "spinal_erectors",
    label: "Spinal erectors",
    nodes: [
      "Iliocostalis lumborum muscle",
      "Iliocostalis thoracis muscle",
      "Longissimus thoracis muscle",
      "Spinalis thoracis muscle",
    ],
    view: "back",
  },
  {
    id: "sternocleidomastoid",
    label: "Sternocleidomastoid (neck)",
    nodes: ["Sternocleidomastoid muscle"],
    view: "front",
  },
  {
    id: "serratus_anterior",
    label: "Serratus anterior",
    nodes: ["Serratus anterior muscle"],
    view: "front",
  },
  {
    id: "biceps_brachii",
    label: "Biceps brachii",
    nodes: [
      "Long head of biceps brachii",
      "Short head of biceps brachii",
    ],
    view: "front",
  },
  {
    id: "brachialis",
    label: "Brachialis",
    nodes: ["Brachialis muscle"],
    view: "front",
  },
  {
    id: "triceps_brachii",
    label: "Triceps brachii",
    nodes: [
      "Long head of triceps brachii",
      "Lateral head of triceps brachii",
      "Medial head of triceps brachii",
    ],
    view: "back",
  },
  {
    id: "forearm_muscles",
    label: "Forearms",
    nodes: [
      "Brachioradialis muscle",
      "Anconeus muscle",
      "Superficial head of pronator teres",
      "Deep head of pronator teres",
      "Pronator quadratus",
      "Supinator",
      "Flexor carpi radialis",
      "Palmaris longus muscle",
      "Humeral head of flexor carpi ulnaris",
      "Ulnar head of flexor carpi ulnaris",
      "Humero-ulnar head of flexor digitorum superficialis",
      "Radial head of flexor digitorum superficialis",
      "Flexor digitorum profundus",
      "Flexor pollicis longus",
      "Extensor carpi radialis longus",
      "Extensor carpi radialis brevis",
      "Humeral head of extensor carpi ulnaris",
      "Ulnar head of extensor carpi ulnaris",
      "Extensor digitorum",
      "Extensor digiti minimi",
      "Abductor pollicis longus",
      "Extensor pollicis brevis",
      "Extensor pollicis longus",
      "Extensor indicis",
    ],
    view: "front",
  },
  {
    id: "rectus_abdominis",
    label: "Abdominals",
    nodes: [
      "Rectus abdominis muscle",
      "External abdominal oblique muscle",
      "Internal abdominal oblique muscle",
      "Transversus abdominis muscle",
      "Pyramidalis muscle",
    ],
    view: "front",
  },
  {
    id: "gluteus_maximus",
    label: "Gluteus maximus",
    nodes: ["Gluteus maximus muscle"],
    view: "back",
  },
  {
    id: "gluteus_medius_minimus",
    label: "Gluteus medius and minimus",
    nodes: [
      "Gluteus medius muscle",
      "Gluteus minimus muscle",
    ],
    view: "back",
  },
  {
    id: "quadriceps_femoris",
    label: "Quadriceps femoris",
    nodes: [
      "Rectus femoris muscle",
      "Vastus lateralis muscle",
      "Vastus medialis muscle",
      "Vastus intermedius muscle",
    ],
    view: "front",
  },
  {
    id: "hip_adductors",
    label: "Hip adductors (inner thigh)",
    nodes: [
      "Adductor longus",
      "Adductor brevis",
      "Adductor magnus",
      "(Adductor minimus)",
      "Gracilis muscle",
      "Pectineus muscle",
    ],
    view: "front",
  },
  {
    id: "biceps_femoris",
    label: "Biceps femoris",
    nodes: [
      "Long head of biceps femoris",
      "Short head of biceps femoris",
    ],
    view: "back",
  },
  {
    id: "semitendinosus",
    label: "Semitendinosus",
    nodes: ["Semitendinosus muscle"],
    view: "back",
  },
  {
    id: "semimembranosus",
    label: "Semimembranosus",
    nodes: ["Semimembranosus muscle"],
    view: "back",
  },
  {
    id: "gastrocnemius",
    label: "Gastrocnemius",
    nodes: [
      "Medial head of gastrocnemius",
      "Lateral head of gastrocnemius",
    ],
    view: "back",
  },
  {
    id: "soleus",
    label: "Soleus",
    nodes: ["Soleus muscle"],
    view: "back",
  },
];

export const MUSCLE_BY_ID: Readonly<Record<string, Muscle>> =
  Object.fromEntries(MUSCLES.map((muscle) => [muscle.id, muscle]));
