import { motion, AnimatePresence } from 'framer-motion';
import { VELV_CHARACTERS, VelvCharacter } from '@/config/characters';
import { Crown, Sparkles, ChevronRight, Lock } from 'lucide-react';
import { clsx } from 'clsx';

interface HeroScreenProps {
  onCharacterSelect: (character: VelvCharacter) => void;
}

export function HeroScreen({ onCharacterSelect }: HeroScreenProps) {
  const premiumCharacters = VELV_CHARACTERS.filter(c => c.isPremium).slice(0, 4);
  const freeCharacters = VELV_CHARACTERS.filter(c => !c.isPremium).slice(0, 4);
  const displayCharacters = [...premiumCharacters, ...freeCharacters].slice(0, 4);

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-radial-gold rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-radial-blush rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-gold/5 via-transparent to-blush/5 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="fixed inset-0 -z-10 opacity-20" aria-hidden="true">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 min-h-screen flex flex-col"
      >
        {/* Header */}
        <header className="px-6 py-6 md:px-10 md:py-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-gradient-gold font-display font-bold text-xl md:text-2xl tracking-tight">
                Velvet
              </span>
              <span className="text-gradient-blush font-display font-bold text-xl md:text-2xl tracking-tight ml-1">
                Crush
              </span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="hidden md:flex items-center gap-2 px-4 py-2 glass rounded-full border-gold/30">
                <Crown className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">Premium</span>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Hero Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 md:px-10 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-3xl mb-16"
          >
            <h1 className="font-display font-light text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-6">
              Choose your
              <br />
              <span className="font-medium text-gradient-gold">companion</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed text-balance">
              Each presence is unique. Select one to begin your private session.
            </p>
          </motion.div>

          {/* Character Grid - 3-4 cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-5xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {displayCharacters.map((character, index) => (
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
            className="mt-12 text-center text-zinc-600 text-sm"
          >
            Private • Encrypted • No logs stored
          </motion.p>
        </main>
      </motion.div>
    </div>
  );
}

interface CharacterCardProps {
  character: VelvCharacter;
  index: number;
  onSelect: (character: VelvCharacter) => void;
}

function CharacterCard({ character, index, onSelect }: CharacterCardProps) {
  const isPremium = character.isPremium;

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'relative group cursor-pointer card-premium overflow-hidden aspect-[3/4]',
        isPremium && 'ring-1 ring-gold/20'
      )}
      onClick={() => onSelect(character)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(character); }}
      role="button"
      tabIndex={0}
    >
      {/* Image with hover reveal effect */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110 group-hover:grayscale-0 grayscale-20"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-transparent to-transparent" />
        
        {/* Premium shimmer on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col p-5 md:p-6">
        <div className="flex-1 flex flex-col justify-end">
          {/* Premium badge */}
          <AnimatePresence>
            {isPremium && (
              <motion.div
                key="premium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass border-gold/30 mb-3 w-fit"
              >
                <Crown className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-semibold text-gold tracking-wide">PREMIUM</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name & aesthetic */}
          <div className="space-y-1.5">
            <h2 className="font-display font-medium text-xl md:text-2xl text-white">
              {character.name}
            </h2>
            <p className="text-zinc-400 text-sm md:text-base line-clamp-2 leading-relaxed">
              {character.visualAesthetic}
            </p>
          </div>

          {/* Personality preview */}
          <p className="mt-4 text-zinc-500 text-sm leading-relaxed line-clamp-3">
            {character.personality}
          </p>
        </div>

        {/* Select button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => { e.stopPropagation(); onSelect(character); }}
          className={clsx(
            'mt-6 w-full py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2',
            isPremium
              ? 'btn-premium'
              : 'bg-glass-medium text-white border border-glass-border hover:border-gold/30 hover:bg-glass-strong'
          )}
        >
          <span>{isPremium ? 'Enter Private Session' : 'Start Free Chat'}</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </motion.button>

        {/* Lock indicator for premium */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 glass border-gold/30 rounded-full"
          >
            <Lock className="w-3.5 h-3.5 text-gold/70" />
            <span className="text-xs text-gold/70">Exclusive</span>
          </motion.div>
        )}
      </div>

      {/* Subtle border glow on hover */}
      <motion.div
        className="absolute inset-0 border-2 border-gold/0 rounded-2xl pointer-events-none"
        whileHover={{ borderOpacity: 0.4 }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  );
}

export default HeroScreen;