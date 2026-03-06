'use client';

import { memo } from 'react';
import { type ModelId, type ModelState, MODELS } from '@/lib/types';

interface ShareButtonProps {
  models: Record<string, ModelState>;
  selectedModels: ModelId[];
}

export default memo(function ShareButton({ models, selectedModels }: ShareButtonProps) {
  const results = selectedModels
    .filter((id) => models[id]?.status === 'done' && models[id]?.endTime && models[id]?.startTime)
    .map((id) => {
      const state = models[id];
      const totalTime = state.endTime! - state.startTime!;
      const tokPerSec = totalTime > 0 ? (state.tokens / totalTime) * 1000 : 0;
      return { id, totalTime, tokPerSec, tokens: state.tokens };
    })
    .sort((a, b) => a.totalTime - b.totalTime);

  if (results.length < 2) return null;

  const fastest = results[0];
  const slowest = results[results.length - 1];
  const multiplier = slowest.totalTime / fastest.totalTime;

  const otherModels = results
    .slice(1)
    .map((r) => {
      const m = MODELS.find((m) => m.id === r.id)!;
      return `${m.displayName}: ${r.tokPerSec.toFixed(0)} tok/s in ${(r.totalTime / 1000).toFixed(1)}s`;
    })
    .join('\n');

  const fastestModel = MODELS.find((m) => m.id === fastest.id)!;

  const tweet = `I just raced ${results.map((r) => MODELS.find((m) => m.id === r.id)!.displayName).join(' vs ')} on Speed Arena.

${fastestModel.displayName} (${fastestModel.subtitle}): ${fastest.tokPerSec.toLocaleString('en-US', { maximumFractionDigits: 0 })} tok/s in ${(fastest.totalTime / 1000).toFixed(3)}s
${otherModels}

${fastestModel.displayName} was ${multiplier.toFixed(0)}x faster.

Built by @Geekissimo | Powered by @taalas_inc`;

  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-6 py-3 border border-surface-light font-mono text-sm text-arena-white hover:border-neon hover:text-neon transition-colors"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </a>
  );
});
