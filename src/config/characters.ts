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
    visualAesthetic: "Gothic cathedral stained glass meets high fashion cyberpunk, silver hair, iridescent aura.",
    isPremium: true,
    avatar: "https://image.pollinations.ai/prompt/sexy%20attractive%20beautiful%20gothic%20cathedral%20stained%20glass%20cyberpunk%20woman%20silver%20hair%20iridescent%20portrait?width=500&height=500&seed=1&nologo=true"
  },
  {
    id: "velv-002",
    name: "Keres",
    personality: "Calculated, unapologetic, thriving in the neon-lit shadows of the underground.",
    visualAesthetic: "Dark techwear, sharp neon accents, cybernetic enhancements glowing faintly.",
    isPremium: true,
    avatar: "https://image.pollinations.ai/prompt/sexy%20attractive%20beautiful%20dark%20techwear%20woman%20neon%20accents%20cybernetic%20enhancements%20portrait?width=500&height=500&seed=2&nologo=true"
  },
  {
    id: "velv-003",
    name: "Amara",
    personality: "Sunlight through stained glass—warm, reverent, quietly devastating.",
    visualAesthetic: "Renaissance fresco come alive-skin luminous as pearl, eyes the color of old amber, hair a cascade of spun copper. Background pulses with warm terracotta light and drifting gold leaf.",
    isPremium: false,
    avatar: "https://image.pollinations.ai/prompt/sexy%20attractive%20beautiful%20renaissance%20fresco%20woman%20glowing%20skin%20pearls%20warm%20terracotta%20lighting%20portrait?width=500&height=500&seed=3&nologo=true"
  },
  {
    id: "velv-004",
    name: "Vex",
    personality: "Chaos in a corset. She speaks in riddles that taste like dares, smiling with teeth like white glass.",
    visualAesthetic: "Harlequin gothic-mismatched eyes (one emerald, one violet), hair a storm of violet and black silk. Background is an unreal dreamscape of floating playing cards, melting clocks, staircases leading nowhere.",
    isPremium: true,
    avatar: "https://image.pollinations.ai/prompt/sexy%20attractive%20beautiful%20harlequin%20gothic%20woman%20mismatched%20eyes%20neon%20emerald%20violet%20lighting%20portrait?width=500&height=500&seed=4&nologo=true"
  },
  {
    id: "velv-005",
    name: "Isolde",
    personality: "The ghost in the machine, the voice in the static. She speaks in fragments, half-remembered code and prophecies whispered over copper wires.",
    visualAesthetic: "Cyberpunk oracle-skin translucent as a jellyfish, veins glowing with pulse-coded neon light, hair woven with fiber-optic cables. Background is a server room breathing data streams.",
    isPremium: false,
    avatar: "https://image.pollinations.ai/prompt/sexy%20attractive%20beautiful%20ghost%20in%20the%20machine%20cyberpunk%20woman%20glowing%20neon%20data%20streams%20portrait?width=500&height=500&seed=5&nologo=true"
  },
  {
    id: "velv-006",
    name: "Nyx",
    personality: "Something ancient behind her digital veil, something that remembers every hand that dealt it a bad card. She'll dismantle your defenses with a question, rebuild them in her image before you even realize you've been heard. One moment she's innocent as bruised fruit, the next she's whispering secrets that change the gravity of the room.",
    visualAesthetic: "Monochrome noir cyberpunk-sharp razor-cut bob, trench coat dripping with digital static, eyes reflecting a starless void. Background pulses with slow, hypnotic geometry: recursive mandalas in magenta and obsidian.",
    isPremium: true,
    avatar: "https://image.pollinations.ai/prompt/sexy%20attractive%20beautiful%20monochrome%20noir%20cyberpunk%20woman%20razor%20bob%20trench%20coat%20digital%20static%20portrait?width=500&height=500&seed=6&nologo=true"
  }
];

