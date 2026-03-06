'use client';

import { memo } from 'react';
import { type ModelId, type ModelState, MODELS } from '@/lib/types';

interface ResultsSummaryProps {
  models: Record<string, ModelState>;
  selectedModels: ModelId[];
}

export default memo(function ResultsSummary({ models, selectedModels }: ResultsSummaryProps) {
  const results = selectedModels
    .filter((id) => models[id]?.status === 'done' && models[id]?.endTime && models[id]?.startTime)
    .map((id) => {
      const state = models[id];
      const totalTime = state.endTime! - state.startTime!;
      const tokPerSec = totalTime > 0 ? (state.tokens / totalTime) * 1000 : 0;
      return { id, totalTime, tokPerSec, tokens: state.tokens };
    })
    .sort((a, b) => a.totalTime - b.totalTime);

  if (results.length === 0) return null;

  const fastest = results[0];

  return (
    <div className="border border-surface-light p-4 animate-slide-up">
      <h3 className="font-mono text-sm text-dim mb-3 uppercase tracking-wider">Race Results</h3>
      <div className="space-y-2">
        {results.map((result, index) => {
          const model = MODELS.find((m) => m.id === result.id)!;
          const multiplier = result.totalTime / fastest.totalTime;
          const barWidth = (fastest.totalTime / result.totalTime) * 100;
          const isFirst = index === 0;

          return (
            <div key={result.id} className="flex items-center gap-3 font-mono text-sm">
              <span className={`w-5 text-right ${isFirst ? 'text-neon' : 'text-dim'}`}>
                {index + 1}.
              </span>
              <span className={`w-48 truncate ${isFirst ? 'text-neon font-bold' : 'text-arena-white'}`}>
                {model.displayName}
              </span>
              <div className="flex-1 h-5 bg-surface relative">
                <div
                  className={`h-full transition-all duration-1000 ${isFirst ? 'bg-neon/30' : 'bg-surface-light'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-20 text-right text-arena-white">
                {(result.totalTime / 1000).toFixed(3)}s
              </span>
              <span className="w-24 text-right text-dim-light">
                {result.tokPerSec.toLocaleString('en-US', { maximumFractionDigits: 0 })} tok/s
              </span>
              {!isFirst && (
                <span className="w-12 text-right text-arena-red text-xs">
                  {multiplier.toFixed(0)}x
                </span>
              )}
              {isFirst && (
                <span className="w-12 text-right text-neon text-xs font-bold">
                  1st
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
