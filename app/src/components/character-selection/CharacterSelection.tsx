import { motion, AnimatePresence } from 'framer-motion';
import { VELV_CHARACTERS, VelvCharacter } from '@/config/characters';
import { ChevronRight, Lock, Sparkles, Star, Crown, Eye, Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface CharacterCardProps {
  character: VelvCharacter;
  onSelect: (character: VelvCharacter) => void;
  isSelected?: boolean;
  index: number;
}

const tierStyles = {
  free: 'border-secondary-700 hover:border-primary-500/50',
  premium: 'border-primary-500/30 hover:border-primary-400 shadow-lg shadow-primary-500/10',
} as const;

const tierBadges = {
  free: (
    <span className="px-2 py-0.5 text-xs font-medium text-secondary-400 bg-secondary-800/50 border border-secondary-700 rounded-full">
      FREE
    </span>
  ),
  premium: (
    <span className="px-2 py-0.5 text-xs font-medium text-primary-300 bg-primary-900/30 border border-primary-500/30 rounded-full flex items-center gap-1">
      <Crown className="w-3 h-3" />
      PREMIUM
    </span>
  ),
} as const;

export function CharacterCard({ character, onSelect, isSelected, index }: CharacterCardProps) {
  const isPremium = character.isPremium;
  const tierKey = isPremium ? 'premium' : 'free';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'relative group cursor-pointer card-hover overflow-hidden',
        tierStyles[tierKey],
        isSelected && 'ring-2 ring-primary-400 shadow-xl shadow-primary-500/20'
      )}
      onClick={() => onSelect(character)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(character); }}
    >
      {/* Background gradient aura */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isPremium
            ? 'linear-gradient(135deg, rgba(217, 70, 239, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(51, 65, 85, 0.15) 100%)',
        }}
      />

      {/* Particle shimmer overlay */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
      </motion.div>

      {/* Character avatar area */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary-900/50 to-secondary-950" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key="avatar"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 + index * 0.04, ease: 'easeOut' }}
            whileHover={{ scale: 1.05 }}
            className="w-full h-full flex items-center justify-center p-6"
          >
            <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* Tier badge */}
        <div className="absolute top-3 left-3 z-10">
          {tierBadges[tierKey]}
        </div>

        {/* Premium lock indicator */}
        {isPremium && (
          <motion.div
            key="lock"
            className="absolute top-3 right-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-1 px-3 py-1.5 bg-secondary-900/80 backdrop-blur-sm border border-primary-500/30 rounded-full">
              <Lock className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-medium text-primary-300">EXCLUSIVE</span>
            </div>
          </motion.div>
        )}

        {/* New/Popular/Featured indicators */}
        <AnimatePresence mode="popLayout">
          {character.isNew && (
            <motion.span
              key="new"
              className="absolute bottom-3 left-3"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <span className="px-2 py-1 text-xs font-bold text-accent-500 bg-accent-900/30 border border-accent-500/30 rounded-full flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                NEW
              </span>
            </motion.span>
          )}
          {character.isPopular && !character.isNew && (
            <motion.span
              key="popular"
              className="absolute bottom-3 left-3"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <span className="px-2 py-1 text-xs font-bold text-warning-500 bg-warning-900/30 border border-warning-500/30 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                POPULAR
              </span>
            </motion.span>
          )}
          {character.isFeatured && !character.isNew && !character.isPopular && (
            <motion.span
              key="featured"
              className="absolute bottom-3 left-3"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <span className="px-2 py-1 text-xs font-bold text-primary-400 bg-primary-900/30 border border-primary-500/30 rounded-full flex items-center gap-1">
                <Heart className="w-3 h-3" />
                FEATURED
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Character info */}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-medium text-white truncate">
              {character.name}
            </h3>
            <p className="text-sm text-secondary-400 mt-0.5 truncate">
              {character.personality.slice(0, 80)}...
            </p>
          </div>
          <motion.div
            className="flex-shrink-0 p-2 bg-secondary-800/50 rounded-xl text-secondary-400 group-hover:text-primary-400 group-hover:bg-primary-500/20 transition-all duration-300"
            whileHover={{ x: 4 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Visual aesthetic tags */}
        <div className="flex flex-wrap gap-1.5">
          {character?.visualAesthetic?.split('—')[0]?.split(',').slice(0, 3).map((tag, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="px-2 py-0.5 text-xs text-secondary-300 bg-secondary-800/50 border border-secondary-700 rounded-md"
            >
              {tag.trim()}
            </motion.span>
          ))}
        </div>

        {/* Stats preview */}
        <div className="flex items-center gap-4 pt-2 border-t border-secondary-800">
          <div className="flex items-center gap-1.5 text-secondary-500">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium text-secondary-400">
              {Array.from(character.id).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5000 + 1000}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary-500">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium text-secondary-400">
              {Array.from(character.id).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 500 + 100}
            </span>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-secondary-500 font-mono">
            ID: {character.id}
          </span>
        </div>
      </div>

      {/* Selection ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 border-2 border-primary-400 rounded-2xl pointer-events-none"
          >
            <motion.div
              className="absolute inset-0 border-2 border-primary-400/30 rounded-2xl"
              animate={{ scale: [1, 1.02, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface CharacterSelectionProps {
  onCharacterSelect: (character: VelvCharacter) => void;
  characters: VelvCharacter[];
  selectedCharacterId?: string;
  filterTier?: 'all' | 'free' | 'premium';
  searchQuery?: string;
}

export function CharacterSelection({
  characters,
  onCharacterSelect,
  selectedCharacterId,
  filterTier = 'all',
  searchQuery = '',
}: CharacterSelectionProps) {
  const filteredCharacters = characters.filter((char: VelvCharacter) => {
    const matchesTier = filterTier === 'all' || (filterTier === 'premium' ? char.isPremium : !char.isPremium);
    const matchesSearch = char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.personality.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const freeCount = VELV_CHARACTERS.filter((c) => !c.isPremium).length;
  const premiumCount = VELV_CHARACTERS.filter((c) => c.isPremium).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light gradient-text mb-4 tracking-tight">
            Velvet<span className="font-medium">Crush</span>
          </h1>
          <p className="text-lg text-secondary-400 max-w-2xl mx-auto text-balance">
            Choose your obsession. Each character is a world waiting to unravel you.
          </p>
        </div>

        {/* Tier filters */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {(['all', 'free', 'premium'] as const).map((tier) => (
            <motion.button
              key={tier}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'px-5 py-2.5 rounded-xl font-medium transition-all duration-200',
                filterTier === tier
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-secondary-800/50 text-secondary-300 hover:bg-secondary-800 hover:text-white border border-secondary-700'
              )}
              onClick={() => {}}
            >
              {tier === 'all'
                ? `All (${freeCount + premiumCount})`
                : tier === 'free'
                ? `Free (${freeCount})`
                : `Premium (${premiumCount})`}
            </motion.button>
          ))}
        </div>
      </motion.header>

      {/* Character Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${filterTier}-${searchQuery}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredCharacters.map((character, index) => (
            <CharacterCard
              key={character.id}
              character={character}
              onSelect={onCharacterSelect}
              isSelected={selectedCharacterId === character.id}
              index={index}
            />
          ))}

          {filteredCharacters.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-secondary-800/50 border border-secondary-700 flex items-center justify-center mb-6">
                <Eye className="w-10 h-10 text-secondary-500" />
              </div>
              <h3 className="font-display text-2xl text-white mb-2">No characters found</h3>
              <p className="text-secondary-400">Adjust your filters or search to discover more personas.</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 pt-8 border-t border-secondary-800"
      >
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-secondary-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-primary-500" />
            <span>Premium characters require credits</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary-400" />
            <span>Exclusive content & abilities</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-400" />
            <span>New arrivals weekly</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CharacterSelection;