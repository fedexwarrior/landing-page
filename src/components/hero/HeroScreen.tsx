import { motion } from 'framer-motion';
import { VELV_CHARACTERS, VelvCharacter } from '@/config/characters';
import { Crown } from 'lucide-react';

interface HeroScreenProps {
  onCharacterSelect: (character: VelvCharacter) => void;
}

export function HeroScreen({ onCharacterSelect }: HeroScreenProps) {
  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-radial-velvet rounded-full blur-3xl animate-float opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-radial-velvet rounded-full blur-3xl animate-float opacity-50" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 md:px-8 md:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-gradient-velvet font-display font-bold text-2xl md:text-3xl tracking-tight">
              Velvet
            </span>
            <span className="font-display font-light text-2xl md:text-3xl tracking-tight ml-1 text-white">
              Crush
            </span>
          </motion.div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center max-w-3xl mb-12"
        >
          <h1 className="font-display font-light text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-6">
            Choose your
            <br />
            <span className="font-medium text-gradient-velvet">companion</span>
          </h1>
          <p className="text-muted text-lg md:text-xl leading-relaxed text-balance">
            Each presence is unique. Select one to begin your private session.
          </p>
        </motion.div>

        {/* Character Horizontal Swipe */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-6xl"
        >
          <div className="flex gap-4 overflow-x-auto snap-x pb-4 scrollbar-hide -mx-6 px-6">
            {VELV_CHARACTERS.map((character, index) => (
              <CharacterCard
                key={character.id}
                character={character}
                index={index}
                onSelect={onCharacterSelect}
              />
            ))}
          </div>
        </motion.div>

        {/* Bottom disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center text-muted text-sm"
        >
          Private &bull; Encrypted &bull; No logs stored
        </motion.p>
      </main>
    </div>
  );
}

interface CharacterCardProps {
  character: VelvCharacter;
  index: number;
  onSelect: (character: VelvCharacter) => void;
}

function CharacterCard({ character, index, onSelect }: CharacterCardProps) {
  const isFeatured = character.isFeatured || character.isNew || character.isPopular;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative flex-shrink-0 w-[280px] md:w-[300px] snap-center card-velvet overflow-hidden cursor-pointer"
      onClick={() => onSelect(character)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(character); }}
      role="button"
      tabIndex={0}
    >
      {/* Image fills top ~70% */}
      <div className="relative h-[70%] w-full overflow-hidden">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-all duration-700 hover:scale-105 hover:brightness-110"
        />
        
        {/* Gradient fade to black at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-midnight via-transparent to-transparent" />
        
        {/* Featured badge top-left */}
        {isFeatured && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full bg-velvet/90 text-white text-xs font-medium flex items-center gap-1"
          >
            <Crown className="w-3 h-3" />
            FEATURED
          </motion.div>
        )}
      </div>

      {/* Name + personality in bottom ~30% */}
      <div className="p-5 flex flex-col justify-end h-[30%]">
        <h2 className="font-display font-medium text-lg text-white mb-1 truncate">
          {character.name}
        </h2>
        <p className="text-muted text-sm leading-relaxed line-clamp-2">
          {character.personality}
        </p>
      </div>

      {/* Subtle border glow on hover */}
      <motion.div
        className="absolute inset-0 border-2 border-velvet/0 rounded-xl pointer-events-none"
        whileHover={{ borderOpacity: 0.5 }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  );
}

export default HeroScreen;