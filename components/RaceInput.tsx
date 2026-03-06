'use client';

import { memo, useState, type FormEvent } from 'react';

interface RaceInputProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default memo(function RaceInput({ onSubmit, disabled, compact }: RaceInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !disabled) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${compact ? '' : 'max-w-3xl mx-auto'}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            disabled={disabled}
            className={`
              w-full bg-surface border border-surface-light font-mono
              text-arena-white placeholder-dim
              focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/30
              transition-colors
              ${compact ? 'px-4 py-2 text-sm' : 'px-6 py-4 text-base'}
              ${disabled ? 'opacity-50' : ''}
            `}
            autoFocus
          />
          {!compact && !prompt && (
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-neon font-mono animate-blink">
              |
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !prompt.trim()}
          className={`
            font-mono font-bold uppercase tracking-wider
            bg-neon text-black
            hover:bg-neon-dim
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all
            ${compact ? 'px-6 py-2 text-sm' : 'px-8 py-4 text-base'}
          `}
        >
          {disabled ? 'RACING...' : 'RACE'}
        </button>
      </div>
    </form>
  );
});
