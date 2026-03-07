'use client';

import { memo, useMemo, useEffect, useRef } from 'react';
import { type ModelId, type ModelState, MODELS } from '@/lib/types';
import Timer from './Timer';
import TokenCounter from './TokenCounter';

interface RaceColumnProps {
  modelId: ModelId;
  state: ModelState;
  isWinner: boolean;
  speedMultiplier: number | null;
}

const providerColors: Record<ModelId, string> = {
  taalas: 'text-neon',
  openai: 'text-arena-white',
  anthropic: 'text-arena-purple',
  google: 'text-arena-blue',
  zhipu: 'text-arena-yellow',
};

// Pre-compute model lookup for O(1) access instead of .find() every render
const MODEL_MAP = new Map(MODELS.map((m) => [m.id, m]));

function RaceColumn({ modelId, state, isWinner, speedMultiplier }: RaceColumnProps) {
  const model = MODEL_MAP.get(modelId)!;
  const isStreaming = state.status === 'streaming';
  const isDone = state.status === 'done';
  const isError = state.status === 'error';
  const isTaalas = modelId === 'taalas';

  const totalTimeMs = state.endTime && state.startTime ? state.endTime - state.startTime : 0;
  const tokPerSec = totalTimeMs > 0 ? (state.tokens / totalTimeMs) * 1000 : 0;
  const ttft = state.firstTokenTime && state.startTime ? state.firstTokenTime - state.startTime : 0;

  // Memoize container class to avoid string concatenation on every token render
  const containerClass = useMemo(() =>
    `border flex flex-col h-full will-change-transform ${isWinner ? 'border-neon winner-glow' : 'border-surface-light'} ${isTaalas && isDone ? 'animate-flash' : ''}`,
    [isWinner, isTaalas, isDone]
  );

  // Auto-scroll response area to bottom while streaming
  const responseRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isStreaming && responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [state.text, isStreaming]);

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="p-4 border-b border-surface-light">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-mono font-bold text-sm ${providerColors[modelId]}`}>
              {model.displayName}
            </h3>
            <p className="text-xs text-dim font-mono">{model.subtitle}</p>
          </div>
          {isWinner && (
            <div className="bg-neon text-arena-bg px-2 py-1 font-mono text-xs font-bold animate-slide-up">
              WINNER
              {speedMultiplier && speedMultiplier > 1 && (
                <span className="ml-1">{speedMultiplier.toFixed(0)}x</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-surface-light flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-dim text-xs font-mono">TIME</span>
          <Timer
            startTime={state.startTime}
            endTime={state.endTime}
            running={isStreaming}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-dim text-xs font-mono">TOK</span>
          <TokenCounter tokens={state.tokens} active={isStreaming} />
        </div>
      </div>

      {/* Response — auto-scroll during streaming */}
      <div ref={responseRef} className="flex-1 p-4 overflow-y-auto min-h-[200px] max-h-[400px] race-response-area">
        {state.status === 'idle' && (
          <p className="text-dim font-mono text-sm">Waiting...</p>
        )}
        {isError && (
          <p className="text-arena-red font-mono text-sm">{state.error}</p>
        )}
        {(isStreaming || isDone) && (
          <div className={`font-mono text-sm leading-relaxed whitespace-pre-wrap break-words ${isDone && isTaalas ? 'text-neon' : 'text-arena-white'}`}>
            {state.text}
            {isStreaming && (
              <span className="text-neon animate-blink">|</span>
            )}
          </div>
        )}
      </div>

      {/* Final stats */}
      {isDone && totalTimeMs > 0 && (
        <div className="p-3 border-t border-surface-light bg-surface font-mono text-xs animate-slide-up">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-dim">TTFT</div>
              <div className="text-arena-white">{(ttft / 1000).toFixed(3)}s</div>
            </div>
            <div>
              <div className="text-dim">TOTAL</div>
              <div className="text-neon">{(totalTimeMs / 1000).toFixed(3)}s</div>
            </div>
            <div>
              <div className="text-dim">TOK/S</div>
              <div className="text-neon">{tokPerSec.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RaceColumn);
