'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { MODELS, type ModelId } from '@/lib/types';
import { setApiKey as storeApiKey, removeApiKey as deleteApiKey, getAllConfiguredProviders } from '@/lib/key-store';
import ModelCard from './ModelCard';

interface ModelSelectorProps {
  selected: ModelId[];
  onChange: (models: ModelId[]) => void;
  disabled?: boolean;
}

const taalasModel = MODELS.find((m) => m.id === 'taalas')!;
const challengerModels = MODELS.filter((m) => m.id !== 'taalas');

export default memo(function ModelSelector({ selected, onChange, disabled }: ModelSelectorProps) {
  const [configuredKeys, setConfiguredKeys] = useState<Set<string>>(new Set());

  // Load configured keys from localStorage on mount
  useEffect(() => {
    const configured = getAllConfiguredProviders();
    setConfiguredKeys(new Set(configured));
    // Auto-select models that have saved keys
    if (configured.length > 0) {
      const newSelected = new Set<string>(selected);
      configured.forEach((id) => newSelected.add(id));
      const arr = [
        'taalas' as ModelId,
        ...(Array.from(newSelected).filter((id) => id !== 'taalas') as ModelId[]),
      ];
      onChange(arr);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    (id: ModelId) => {
      if (id === 'taalas') return;
      if (selected.includes(id)) {
        onChange(selected.filter((m) => m !== id));
      } else {
        const withoutTaalas = selected.filter((m) => m !== 'taalas');
        onChange(['taalas', ...withoutTaalas, id]);
      }
    },
    [selected, onChange],
  );

  const handleSaveKey = useCallback(
    (modelId: ModelId, key: string) => {
      storeApiKey(modelId, key);
      setConfiguredKeys((prev) => new Set([...prev, modelId]));
      // Auto-select when key is saved
      if (!selected.includes(modelId)) {
        const withoutTaalas = selected.filter((m) => m !== 'taalas');
        onChange(['taalas', ...withoutTaalas, modelId]);
      }
    },
    [selected, onChange],
  );

  const handleRemoveKey = useCallback(
    (modelId: ModelId) => {
      deleteApiKey(modelId);
      setConfiguredKeys((prev) => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });
      if (selected.includes(modelId)) {
        onChange(selected.filter((m) => m !== modelId));
      }
    },
    [selected, onChange],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Defending Champion */}
      <div>
        <div className="text-xs font-mono text-dim uppercase tracking-wider mb-3">
          Defending Champion
        </div>
        <ModelCard
          model={taalasModel}
          isSelected={true}
          hasKey={true}
          isPinned={true}
          onToggle={() => {}}
          onSaveKey={() => {}}
          onRemoveKey={() => {}}
        />
      </div>

      {/* Challengers */}
      <div>
        <div className="text-xs font-mono text-dim uppercase tracking-wider mb-3">
          Challengers &mdash; select 1+ to start
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {challengerModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selected.includes(model.id)}
              hasKey={configuredKeys.has(model.id)}
              onToggle={() => toggle(model.id)}
              onSaveKey={(key) => handleSaveKey(model.id, key)}
              onRemoveKey={() => handleRemoveKey(model.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs font-mono text-dim text-center">
        Keys are stored locally in your browser. Taalas is always in the race as the benchmark.
      </p>
    </div>
  );
});
