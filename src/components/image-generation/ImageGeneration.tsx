import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Crown, Shield, Check, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

type GenerationStep = 'style' | 'eyeColor' | 'eyeShape' | 'bodyType' | 'outfit' | 'setting' | 'generate';

interface ImageGenerationProps {
  onBack: () => void;
  isSignedIn: boolean;
  credits: number;
  onRequireAuth: (reason: string, action: () => void) => void;
  onCreditsUpdate: (newCredits: number) => void;
}

interface GenerationOptions {
  style: 'realistic' | 'anime' | '';
  eyeColor: string;
  eyeShape: string;
  bodyType: string;
  outfit: string;
  setting: string;
}

const STEP_ORDER: GenerationStep[] = ['style', 'eyeColor', 'eyeShape', 'bodyType', 'outfit', 'setting', 'generate'];

const STEP_LABELS: Record<GenerationStep, string> = {
  style: 'Style',
  eyeColor: 'Eye Color',
  eyeShape: 'Eye Shape',
  bodyType: 'Body Type',
  outfit: 'Outfit',
  setting: 'Setting',
  generate: 'Generate',
};

const OPTIONS: Record<Exclude<GenerationStep, 'style' | 'generate'>, { value: string; label: string }[]> = {
  eyeColor: [
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'brown', label: 'Brown' },
    { value: 'hazel', label: 'Hazel' },
    { value: 'violet', label: 'Violet' },
    { value: 'amber', label: 'Amber' },
    { value: 'gray', label: 'Gray' },
    { value: 'heterochromia', label: 'Heterochromia' },
  ],
  eyeShape: [
    { value: 'almond', label: 'Almond' },
    { value: 'round', label: 'Round' },
    { value: 'hooded', label: 'Hooded' },
    { value: 'upturned', label: 'Upturned' },
    { value: 'downturned', label: 'Downturned' },
    { value: 'monolid', label: 'Monolid' },
  ],
  bodyType: [
    { value: 'slim', label: 'Slim' },
    { value: 'athletic', label: 'Athletic' },
    { value: 'curvy', label: 'Curvy' },
    { value: 'petite', label: 'Petite' },
    { value: 'tall', label: 'Tall' },
    { value: 'voluptuous', label: 'Voluptuous' },
  ],
  outfit: [
    { value: 'bikini', label: 'Bikini' },
    { value: 'one-piece', label: 'One-Piece' },
    { value: 'sundress', label: 'Sundress' },
    { value: 'cover-up', label: 'Cover-Up' },
    { value: 'shorts-tank', label: 'Shorts & Tank' },
    { value: 'sarong', label: 'Sarong' },
  ],
  setting: [
    { value: 'beach', label: 'Beach' },
    { value: 'poolside', label: 'Poolside' },
    { value: 'indoor', label: 'Indoor' },
    { value: 'sunset', label: 'Sunset' },
    { value: 'tropical-garden', label: 'Tropical Garden' },
    { value: 'luxury-resort', label: 'Luxury Resort' },
  ],
};

const STYLE_OPTIONS = [
  {
    value: 'realistic' as const,
    label: 'Realistic',
    description: 'Realistic CGI blend — magazine quality',
    examplePrompt: 'photorealistic woman beach sunset golden hour 8k',
  },
  {
    value: 'anime' as const,
    label: 'Anime',
    description: 'Stylized anime illustration',
    examplePrompt: 'anime illustration woman beach vibrant colors detailed',
  },
];

export default function ImageGeneration({ onBack, isSignedIn, credits, onRequireAuth, onCreditsUpdate }: ImageGenerationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [options, setOptions] = useState<GenerationOptions>({
    style: '',
    eyeColor: '',
    eyeShape: '',
    bodyType: '',
    outfit: '',
    setting: '',
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const currentStep = STEP_ORDER[currentStepIndex];
  const progress = (currentStepIndex / (STEP_ORDER.length - 1)) * 100;

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(index);
    setShowResult(false);
    setGeneratedImage(null);
  }, []);

  const goNext = useCallback(() => {
    if (currentStepIndex < STEP_ORDER.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex]);

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const selectOption = useCallback((key: keyof GenerationOptions, value: string) => {
    setOptions(prev => ({ ...prev, [key]: value }));
    // Auto-advance for non-style steps
    if (key !== 'style' && currentStepIndex < STEP_ORDER.length - 2) {
      setTimeout(() => goNext(), 150);
    } else if (key === 'style') {
      setTimeout(() => goNext(), 150);
    }
  }, [currentStepIndex, goNext]);

  const handleGenerate = useCallback(async () => {
    if (!isSignedIn) {
      onRequireAuth("Sign in to generate images — costs 30 credits.", () => handleGenerate());
      return;
    }

    if (credits < 30) {
      // Could trigger top-up modal here
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (response.status === 401) {
        onRequireAuth("Please sign in again to generate images.", () => handleGenerate());
        return;
      }

      if (response.status === 402) {
        // Out of credits
        return;
      }

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        if (typeof data.credits === 'number') onCreditsUpdate(data.credits);
        setShowResult(true);
      }
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  }, [isSignedIn, credits, options, onRequireAuth, onCreditsUpdate]);

  const handleRetry = useCallback(() => {
    setGeneratedImage(null);
    setShowResult(false);
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'style':
        return options.style !== '';
      case 'eyeColor':
        return options.eyeColor !== '';
      case 'eyeShape':
        return options.eyeShape !== '';
      case 'bodyType':
        return options.bodyType !== '';
      case 'outfit':
        return options.outfit !== '';
      case 'setting':
        return options.setting !== '';
      case 'generate':
        return true;
      default:
        return false;
    }
  }, [currentStep, options]);

  if (showResult && generatedImage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full w-full bg-midnight text-white"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-panel-border bg-midnight/50 backdrop-blur-sm sticky top-0 z-10">
          <button onClick={() => { setShowResult(false); setGeneratedImage(null); }} className="text-sm text-muted hover:text-white cursor-pointer flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="font-display font-medium text-base text-white">Your Creation</span>
          <div className="w-24" />
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-md w-full"
          >
            <img
              src={generatedImage}
              alt="Generated image"
              className="w-full aspect-[2/3] object-cover rounded-2xl border border-panel-border shadow-2xl"
            />
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              <button onClick={handleRetry} className="flex-1 btn-velvet-pill py-3">
                Generate Another
              </button>
              <button onClick={() => { setShowResult(false); setGeneratedImage(null); goToStep(0); }} className="flex-1 btn-ghost py-3">
                Start Over
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-midnight text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-panel-border bg-midnight/50 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={onBack} className="text-sm text-muted hover:text-white cursor-pointer flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="font-display font-medium text-base text-white">Create</span>
        {isSignedIn && (
          <span className="px-3 py-1 rounded-full bg-panel border border-panel-border text-xs text-velvet font-medium font-button flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" />
            {credits} credits
          </span>
        )}
      </header>

      {/* Progress Bar */}
      <div className="px-4 py-2 border-b border-panel-border bg-midnight/50 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-muted mb-1">
          <span>{STEP_LABELS[currentStep]}</span>
          <span>Step {currentStepIndex + 1} of {STEP_ORDER.length}</span>
        </div>
        <div className="h-1.5 bg-panel-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-velvet to-velvet-dark rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="max-w-xl mx-auto w-full"
          >
            {currentStep === 'style' && (
              <StyleChoiceStep options={STYLE_OPTIONS} selected={options.style} onSelect={(v) => selectOption('style', v)} />
            )}
            {currentStep === 'eyeColor' && (
              <SwipePickerStep
                title="Eye Color"
                subtitle="Choose her eye color"
                options={OPTIONS.eyeColor}
                selected={options.eyeColor}
                onSelect={(v) => selectOption('eyeColor', v)}
              />
            )}
            {currentStep === 'eyeShape' && (
              <SwipePickerStep
                title="Eye Shape"
                subtitle="Choose her eye shape"
                options={OPTIONS.eyeShape}
                selected={options.eyeShape}
                onSelect={(v) => selectOption('eyeShape', v)}
              />
            )}
            {currentStep === 'bodyType' && (
              <SwipePickerStep
                title="Body Type"
                subtitle="Choose her body type"
                options={OPTIONS.bodyType}
                selected={options.bodyType}
                onSelect={(v) => selectOption('bodyType', v)}
              />
            )}
            {currentStep === 'outfit' && (
              <SwipePickerStep
                title="Outfit"
                subtitle="Choose her outfit"
                options={OPTIONS.outfit}
                selected={options.outfit}
                onSelect={(v) => selectOption('outfit', v)}
              />
            )}
            {currentStep === 'setting' && (
              <SwipePickerStep
                title="Setting"
                subtitle="Choose the setting"
                options={OPTIONS.setting}
                selected={options.setting}
                onSelect={(v) => selectOption('setting', v)}
              />
            )}
            {currentStep === 'generate' && (
              <GenerateStep
                options={options}
                credits={credits}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onBack={goPrev}
                canGenerate={isSignedIn && credits >= 30}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="px-4 pb-4 border-t border-panel-border bg-midnight/50 backdrop-blur-sm flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          className="btn-ghost px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
          Back
        </button>
        <div className="flex items-center gap-2 text-xs text-muted">
          {STEP_ORDER.map((step, i) => (
            <motion.div
              key={step}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={clsx(
                'w-2 h-2 rounded-full transition-all',
                i === currentStepIndex ? 'bg-velvet' : 'bg-panel-border'
              )}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={currentStepIndex === STEP_ORDER.length - 1 || !canProceed()}
          className={clsx(
            'btn-velvet-pill px-4 py-2 ml-auto',
            !canProceed() && 'opacity-50 cursor-not-allowed'
          )}
        >
          {currentStepIndex === STEP_ORDER.length - 1 ? (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface StyleChoiceStepProps {
  options: typeof STYLE_OPTIONS;
  selected: string;
  onSelect: (value: string) => void;
}

function StyleChoiceStep({ options, selected, onSelect }: StyleChoiceStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="font-display font-medium text-2xl text-white mb-1">Choose Your Style</h2>
        <p className="text-muted text-sm">This sets the overall look of your generated image</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: opt.value === 'realistic' ? 0.1 : 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt.value)}
            className={clsx(
              'relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-200 flex flex-col',
              selected === opt.value
                ? 'border-velvet shadow-[0_0_30px_rgba(196,19,60,0.3)]'
                : 'border-panel-border hover:border-velvet/50'
            )}
          >
            <div className="flex-1 relative bg-panel border-b border-panel-border">
              <div className="absolute inset-0 bg-gradient-to-br from-velvet/10 to-velvet-dark/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-velvet/30" />
              </div>
            </div>
            <div className="p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-medium text-lg text-white">{opt.label}</h3>
                <p className="text-muted text-xs mt-1 line-clamp-2">{opt.description}</p>
              </div>
              {selected === opt.value && (
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-center gap-2 text-velvet font-medium text-sm mt-3"
                >
                  <Check className="w-4 h-4" />
                  Selected
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

interface SwipePickerStepProps {
  title: string;
  subtitle: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function SwipePickerStep({ title, subtitle, options, selected, onSelect }: SwipePickerStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="font-display font-medium text-2xl text-white mb-1">{title}</h2>
        <p className="text-muted text-sm">{subtitle}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x pb-4 scrollbar-hide -mx-4 px-4">
        {options.map((opt) => (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(opt.value)}
            className={clsx(
              'flex-shrink-0 w-36 h-36 md:w-40 md:h-40 snap-center rounded-xl overflow-hidden border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2',
              selected === opt.value
                ? 'border-velvet shadow-[0_0_30px_rgba(196,19,60,0.3)] bg-panel'
                : 'border-panel-border hover:border-velvet/50 bg-panel/50'
            )}
          >
            <div className="text-center">
              <span className="text-4xl md:text-5xl">{getOptionEmoji(opt.value)}</span>
              <p className="font-medium text-sm text-white mt-2 truncate">{opt.label}</p>
            </div>
            {selected === opt.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-velvet flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function getOptionEmoji(value: string): string {
  const emojiMap: Record<string, string> = {
    blue: '🔵', green: '🟢', brown: '🟤', hazel: '🟠', violet: '🟣', amber: '🟡', gray: '⚪', heterochromia: '👁️',
    almond: '👁️', round: '🔵', hooded: '👁️', upturned: '⬆️', downturned: '⬇️', monolid: '👁️',
    slim: '📏', athletic: '💪', curvy: '🌊', petite: '📐', tall: '📏', voluptuous: '🌊',
    bikini: '👙', 'one-piece': '🩱', sundress: '👗', 'cover-up': '👘', 'shorts-tank': '🩳', sarong: '👘',
    beach: '🏖️', poolside: '🏊', indoor: '🏠', sunset: '🌅', 'tropical-garden': '🌴', 'luxury-resort': '🏨',
  };
  return emojiMap[value] || '✨';
}

interface GenerateStepProps {
  options: GenerationOptions;
  credits: number;
  isGenerating: boolean;
  onGenerate: () => void;
  onBack: () => void;
  canGenerate: boolean;
}

function GenerateStep({ options, credits, isGenerating, onGenerate, onBack, canGenerate }: GenerateStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="font-display font-medium text-2xl text-white mb-1">Ready to Generate</h2>
        <p className="text-muted text-sm">Review your choices and create your image</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        {([
          { label: 'Style', value: options.style },
          { label: 'Eye Color', value: options.eyeColor },
          { label: 'Eye Shape', value: options.eyeShape },
          { label: 'Body Type', value: options.bodyType },
          { label: 'Outfit', value: options.outfit },
          { label: 'Setting', value: options.setting },
        ]).map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 glass rounded-xl border-panel-border"
          >
            <span className="text-muted text-sm">{item.label}</span>
            <span className="font-medium text-white capitalize">{item.value || 'Not selected'}</span>
          </motion.div>
        ))}
      </div>

      {/* Cost & Generate */}
      <div className="pt-4 border-t border-panel-border space-y-3">
        <div className="flex items-center justify-between p-3 glass rounded-xl border-panel-border">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-velvet" />
            <span className="text-sm text-white">Cost: <span className="text-velvet font-medium">30 credits</span></span>
          </div>
          <span className="px-3 py-1 rounded-full bg-panel border border-panel-border text-xs text-velvet font-medium font-button">
            {credits} available
          </span>
        </div>

        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className={clsx(
            'btn-velvet w-full py-4 text-base font-button',
            !canGenerate && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isGenerating ? (
            <motion.div className="flex items-center justify-center gap-2">
              <motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              Generating...
            </motion.div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Image
            </>
          )}
        </button>

        {!canGenerate && (
          <p className="text-center text-muted text-sm">
            {credits < 30 ? 'Need 30 credits to generate' : 'Sign in to generate images'}
          </p>
        )}
      </div>
    </div>
  );
}