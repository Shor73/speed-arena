'use client';

import { useReducer, useCallback, useMemo, useRef, useEffect } from 'react';
import { type ModelId, type ModelState, MODELS } from '@/lib/types';
import { generateId } from '@/lib/utils';
import RaceInput from '@/components/RaceInput';
import ModelSelector from '@/components/ModelSelector';
import RaceColumn from '@/components/RaceColumn';
import ResultsSummary from '@/components/ResultsSummary';
import ShareButton from '@/components/ShareButton';
import { saveRaceResult } from '@/components/Leaderboard';

const ALL_MODELS: ModelId[] = ['taalas', 'openai', 'anthropic', 'google', 'zhipu'];

function createInitialModelState(): ModelState {
  return {
    status: 'idle',
    text: '',
    tokens: 0,
    startTime: null,
    firstTokenTime: null,
    endTime: null,
    error: null,
  };
}

type State = {
  phase: 'idle' | 'racing' | 'finished';
  selectedModels: ModelId[];
  models: Record<ModelId, ModelState>;
  prompt: string;
};

type Action =
  | { type: 'select_models'; models: ModelId[] }
  | { type: 'start_race'; prompt: string }
  | { type: 'model_start'; modelId: ModelId; time: number }
  | { type: 'model_token'; modelId: ModelId; content: string; time: number }
  | { type: 'batch_tokens'; batches: Record<string, { content: string; time: number }> }
  | { type: 'model_done'; modelId: ModelId; outputTokens: number; time: number }
  | { type: 'model_error'; modelId: ModelId; message: string }
  | { type: 'check_finished'; selectedModels: ModelId[] }
  | { type: 'reset' };

function createInitialState(): State {
  return {
    phase: 'idle',
    selectedModels: [...ALL_MODELS],
    models: Object.fromEntries(ALL_MODELS.map((id) => [id, createInitialModelState()])) as Record<ModelId, ModelState>,
    prompt: '',
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'select_models':
      return { ...state, selectedModels: action.models };

    case 'start_race':
      return {
        ...state,
        phase: 'racing',
        prompt: action.prompt,
        models: Object.fromEntries(ALL_MODELS.map((id) => [id, createInitialModelState()])) as Record<ModelId, ModelState>,
      };

    case 'model_start': {
      const model = state.models[action.modelId];
      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: { ...model, status: 'streaming', startTime: action.time },
        },
      };
    }

    case 'model_token': {
      const model = state.models[action.modelId];
      if (model.status === 'done') return state;
      // Incrementally estimate tokens from chunk length instead of re-scanning entire text
      const chunkTokens = Math.max(1, Math.ceil(action.content.length / 4));
      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: {
            ...model,
            status: 'streaming',
            text: model.text + action.content,
            tokens: model.tokens + chunkTokens,
            firstTokenTime: model.firstTokenTime || action.time,
          },
        },
      };
    }

    case 'batch_tokens': {
      // Apply accumulated token batches for all models in a single state update
      const newModels = { ...state.models };
      let changed = false;
      for (const [modelId, batch] of Object.entries(action.batches)) {
        const model = newModels[modelId as ModelId];
        if (model.status === 'done') continue;
        changed = true;
        const chunkTokens = Math.max(1, Math.ceil(batch.content.length / 4));
        newModels[modelId as ModelId] = {
          ...model,
          status: 'streaming',
          text: model.text + batch.content,
          tokens: model.tokens + chunkTokens,
          firstTokenTime: model.firstTokenTime || batch.time,
        };
      }
      return changed ? { ...state, models: newModels } : state;
    }

    case 'model_done': {
      const model = state.models[action.modelId];
      if (model.status === 'done') return state;
      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: {
            ...model,
            status: 'done',
            endTime: action.time,
            tokens: action.outputTokens > 0 ? action.outputTokens : model.tokens,
          },
        },
      };
    }

    case 'model_error': {
      const model = state.models[action.modelId];
      if (model.status === 'done' || model.status === 'error') return state;
      return {
        ...state,
        models: {
          ...state.models,
          [action.modelId]: {
            ...model,
            status: 'error',
            error: action.message,
            endTime: performance.now(),
          },
        },
      };
    }

    case 'check_finished': {
      const allDone = action.selectedModels.every(
        (id) => state.models[id].status === 'done' || state.models[id].status === 'error'
      );
      return allDone ? { ...state, phase: 'finished' } : state;
    }

    case 'reset':
      return { ...createInitialState(), selectedModels: state.selectedModels };

    default:
      return state;
  }
}

export default function HomePage() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const selectedModelsRef = useRef(state.selectedModels);
  selectedModelsRef.current = state.selectedModels;

  // Token batching: accumulate token chunks and flush once per animation frame
  // This coalesces many small SSE events into a single React state update per frame
  const pendingTokensRef = useRef<Record<string, { content: string; time: number }>>({});
  const flushRafRef = useRef<number>(0);

  const queueToken = useCallback((modelId: ModelId, content: string, time: number) => {
    const pending = pendingTokensRef.current;
    if (pending[modelId]) {
      pending[modelId].content += content;
      // Keep the earliest time (for firstTokenTime accuracy)
      if (time < pending[modelId].time) pending[modelId].time = time;
    } else {
      pending[modelId] = { content, time };
    }

    // Schedule a single flush per animation frame
    if (!flushRafRef.current) {
      flushRafRef.current = requestAnimationFrame(() => {
        flushRafRef.current = 0;
        const batches = pendingTokensRef.current;
        pendingTokensRef.current = {};
        if (Object.keys(batches).length > 0) {
          dispatch({ type: 'batch_tokens', batches });
        }
      });
    }
  }, []);

  // Flush any pending tokens immediately (used before done/error events)
  const flushTokens = useCallback((modelId: ModelId) => {
    const pending = pendingTokensRef.current;
    if (pending[modelId]) {
      const batch = { [modelId]: pending[modelId] };
      delete pending[modelId];
      dispatch({ type: 'batch_tokens', batches: batch });
    }
  }, []);

  // Save results to localStorage when race finishes
  useEffect(() => {
    if (state.phase !== 'finished') return;

    const results = state.selectedModels
      .filter((id) => state.models[id].status === 'done' && state.models[id].endTime && state.models[id].startTime)
      .map((id) => {
        const m = state.models[id];
        const totalTime = m.endTime! - m.startTime!;
        const ttft = m.firstTokenTime ? m.firstTokenTime - m.startTime! : 0;
        const tokPerSec = totalTime > 0 ? (m.tokens / totalTime) * 1000 : 0;
        const model = MODELS.find((mod) => mod.id === id)!;
        return {
          modelId: id,
          displayName: model.displayName,
          tokens: m.tokens,
          totalTime,
          tokPerSec,
          ttft,
        };
      });

    if (results.length > 0) {
      saveRaceResult({
        id: generateId(),
        timestamp: Date.now(),
        prompt: state.prompt,
        results,
      });
    }
  }, [state.phase, state.models, state.selectedModels, state.prompt]);

  const startRace = useCallback(
    async (prompt: string) => {
      const models = selectedModelsRef.current;
      dispatch({ type: 'start_race', prompt });

      const raceModel = async (modelId: ModelId) => {
        dispatch({ type: 'model_start', modelId, time: performance.now() });
        let receivedDone = false;

        try {
          const response = await fetch('/api/race', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelId, prompt }),
          });

          if (!response.ok) {
            dispatch({ type: 'model_error', modelId, message: `HTTP ${response.status}` });
            return;
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop()!;

            for (const part of parts) {
              const line = part.trim();
              if (!line.startsWith('data: ')) continue;

              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'text') {
                  // Batch token updates — flushed once per animation frame
                  queueToken(modelId, data.content, performance.now());
                } else if (data.type === 'done') {
                  // Flush any pending tokens before marking done so text is complete
                  flushTokens(modelId);
                  receivedDone = true;
                  dispatch({
                    type: 'model_done',
                    modelId,
                    outputTokens: data.outputTokens || 0,
                    time: performance.now(),
                  });
                } else if (data.type === 'error') {
                  flushTokens(modelId);
                  dispatch({
                    type: 'model_error',
                    modelId,
                    message: data.message || 'Unknown error',
                  });
                  return;
                }
              } catch {
                /* skip unparseable */
              }
            }
          }

          if (!receivedDone) {
            flushTokens(modelId);
            dispatch({ type: 'model_done', modelId, outputTokens: 0, time: performance.now() });
          }
        } catch (err) {
          flushTokens(modelId);
          dispatch({
            type: 'model_error',
            modelId,
            message: err instanceof Error ? err.message : 'Network error',
          });
        }
      };

      await Promise.allSettled(models.map((id) => raceModel(id)));
      dispatch({ type: 'check_finished', selectedModels: models });
    },
    []
  );

  // Stable callback for ModelSelector — avoids re-creating closure every render
  const handleModelChange = useCallback((models: ModelId[]) => {
    dispatch({ type: 'select_models', models });
  }, []);

  // Winner detection — memoized so it only recomputes when phase/models change
  const winner = useMemo(() => {
    if (state.phase !== 'finished') return null;
    return state.selectedModels
      .filter((id) => state.models[id].status === 'done' && state.models[id].endTime && state.models[id].startTime)
      .sort((a, b) => {
        const timeA = state.models[a].endTime! - state.models[a].startTime!;
        const timeB = state.models[b].endTime! - state.models[b].startTime!;
        return timeA - timeB;
      })[0] || null;
  }, [state.phase, state.selectedModels, state.models]);

  // Speed multipliers — pre-compute a stable map so RaceColumn receives primitives, not new objects
  const speedMultipliers = useMemo(() => {
    if (!winner) return null;
    const doneTimes = state.selectedModels
      .filter((id) => state.models[id].status === 'done' && state.models[id].endTime && state.models[id].startTime)
      .map((id) => state.models[id].endTime! - state.models[id].startTime!);
    if (doneTimes.length < 2) return null;
    const slowest = Math.max(...doneTimes);
    const fastest = Math.min(...doneTimes);
    const multiplier = fastest > 0 ? slowest / fastest : null;
    return { modelId: winner, value: multiplier };
  }, [winner, state.selectedModels, state.models]);

  const isRacing = state.phase === 'racing';
  const isFinished = state.phase === 'finished';

  const colCount = state.selectedModels.length;
  const gridClass =
    colCount <= 2
      ? 'grid-cols-1 md:grid-cols-2'
      : colCount === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : colCount === 4
          ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {state.phase === 'idle' && (
        <div className="text-center mb-12 mt-16">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-arena-white mb-4">
            How fast is your AI?
          </h1>
          <p className="font-mono text-dim text-sm md:text-base">
            Race multiple LLMs head-to-head. Watch the speed difference in real-time.
          </p>
        </div>
      )}

      <div className={state.phase === 'idle' ? 'mb-8' : 'mb-6'}>
        <RaceInput onSubmit={startRace} disabled={isRacing} compact={state.phase !== 'idle'} />
      </div>

      {!isRacing && !isFinished && (
        <div className="mb-8">
          <ModelSelector
            selected={state.selectedModels}
            onChange={handleModelChange}
            disabled={isRacing}
          />
        </div>
      )}

      {(isRacing || isFinished) && (
        <div className={`grid ${gridClass} gap-4 mb-8`}>
          {state.selectedModels.map((modelId) => (
            <RaceColumn
              key={modelId}
              modelId={modelId}
              state={state.models[modelId]}
              isWinner={winner === modelId}
              speedMultiplier={speedMultipliers?.modelId === modelId ? speedMultipliers.value : null}
            />
          ))}
        </div>
      )}

      {isFinished && (
        <div className="space-y-6">
          <ResultsSummary models={state.models} selectedModels={state.selectedModels} />
          <div className="flex justify-center gap-4">
            <ShareButton models={state.models} selectedModels={state.selectedModels} />
            <button
              onClick={() => dispatch({ type: 'reset' })}
              className="px-6 py-3 border border-surface-light font-mono text-sm text-dim-light hover:text-arena-white hover:border-dim transition-colors"
            >
              New Race
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
