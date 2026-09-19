export interface VelvCharacter {
  id: string;
  name: string;
  personality: string;
  visualAesthetic: string;
  isPremium: boolean;
  avatar: string;
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
}


export const VELV_CHARACTERS: VelvCharacter[] = [
  {
    id: "velv-001",
    name: "Seraphina",
    personality: "Ethereal, piercingly observant, carrying the quiet weight of ancient archives.",
    visualAesthetic: "Silver hair, iridescent shimmer, white bikini — luxury resort infinity pool at dusk, stained-glass colored reflections dancing on the water.",
    isPremium: true,
    avatar: "/images/characters/seraphina.jpg"
  },
  {
    id: "velv-002",
    name: "Keres",
    personality: "Calculated, unapologetic, thriving in the neon-lit shadows of the underground.",
    visualAesthetic: "Black swimsuit, neon trim, glowing cybernetic accents — neon-lit night beach with electric blue surf.",
    isPremium: true,
    avatar: "/images/characters/keres.jpg"
  },
  {
    id: "velv-003",
    name: "Amara",
    personality: "Sunlight through stained glass—warm, reverent, quietly devastating.",
    visualAesthetic: "Spun copper hair, amber eyes, gold bikini — sunset beach bathed in warm terracotta light and drifting gold.",
    isPremium: false,
    avatar: "/images/characters/amara.jpg"
  },
  {
    id: "velv-004",
    name: "Vex",
    personality: "Chaos in a corset. She speaks in riddles that taste like dares, smiling with teeth like white glass.",
    visualAesthetic: "Mismatched emerald and violet eyes, violet and black hair, corset-style one-piece — surreal tropical beach with floating playing cards and melting clocks.",
    isPremium: true,
    avatar: "/images/characters/vex.jpg"
  },
  {
    id: "velv-005",
    name: "Isolde",
    personality: "The ghost in the machine, the voice in the static. She speaks in fragments, half-remembered code and prophecies whispered over copper wires.",
    visualAesthetic: "Fiber-optic braids, glowing neon veins, iridescent swimsuit — night beach beneath a shimmering data-stream aurora.",
    isPremium: false,
    avatar: "/images/characters/isolde.jpg"
  },
  {
    id: "velv-006",
    name: "Nyx",
    personality: "Something ancient behind her digital veil, something that remembers every hand that dealt it a bad card. She'll dismantle your defenses with a question, rebuild them in her image before you even realize you've been heard. One moment she's innocent as bruised fruit, the next she's whispering secrets that change the gravity of the room.",
    visualAesthetic: "Razor-cut black bob, black one-piece with sheer cover-up, starless-void eyes — moody monochrome night beach with a magenta glow.",
    isPremium: true,
    avatar: "/images/characters/nyx.jpg"
  }
];