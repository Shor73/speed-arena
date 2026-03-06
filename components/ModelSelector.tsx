'use client';

import { memo } from 'react';
import { MODELS, type ModelId } from '@/lib/types';

interface ModelSelectorProps {
  selected: ModelId[];
  onChange: (models: ModelId[]) => void;
  disabled?: boolean;
}

export default memo(function ModelSelector({ selected, onChange, disabled }: ModelSelectorProps) {
  const toggle = (id: ModelId) => {
    if (selected.includes(id)) {
      if (selected.length > 1) {
        onChange(selected.filter((m) => m !== id));
      }
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {MODELS.map((model) => {
        const isSelected = selected.includes(model.id);
        return (
          <button
            key={model.id}
            onClick={() => toggle(model.id)}
            disabled={disabled}
            className={`
              px-4 py-2 font-mono text-sm border transition-all
              ${isSelected
                ? 'border-neon text-neon bg-neon/5'
                : 'border-surface-light text-dim hover:border-dim hover:text-dim-light'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="font-bold">{model.displayName}</span>
            <span className="text-xs text-dim ml-2">({model.subtitle})</span>
          </button>
        );
      })}
    </div>
  );
});
