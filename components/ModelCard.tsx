'use client';

import { memo, useState } from 'react';
import type { ModelInfo } from '@/lib/types';

interface ModelCardProps {
  model: ModelInfo;
  isSelected: boolean;
  hasKey: boolean;
  isPinned?: boolean;
  onToggle: () => void;
  onSaveKey: (key: string) => void;
  onRemoveKey: () => void;
}

export default memo(function ModelCard({
  model,
  isSelected,
  hasKey,
  isPinned,
  onToggle,
  onSaveKey,
  onRemoveKey,
}: ModelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const handleClick = () => {
    if (isPinned) return;
    if (hasKey) {
      onToggle();
    } else {
      setExpanded(true);
    }
  };

  const handleSave = () => {
    if (keyInput.trim()) {
      onSaveKey(keyInput.trim());
      setKeyInput('');
      setExpanded(false);
    }
  };

  const handleCancel = () => {
    setKeyInput('');
    setExpanded(false);
  };

  const handleRemove = () => {
    onRemoveKey();
    setKeyInput('');
    setExpanded(false);
  };

  let borderClass = 'border-surface-light';
  let extraClass = '';

  if (isPinned) {
    borderClass = 'border-neon winner-glow';
  } else if (isSelected && hasKey) {
    borderClass = 'border-neon';
  }

  if (!hasKey && !isPinned) {
    extraClass = 'opacity-60 border-dashed';
  }

  return (
    <div
      className={`border ${borderClass} ${extraClass} p-4 font-mono transition-all ${isPinned ? '' : 'cursor-pointer hover:border-neon/50'}`}
      onClick={!expanded ? handleClick : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-arena-white truncate">{model.displayName}</div>
          <div className="text-xs text-dim">{model.subtitle}</div>
        </div>
        <div className="text-xs whitespace-nowrap flex-shrink-0">
          {isPinned && (
            <span className="text-neon font-bold">ACTIVE</span>
          )}
          {!isPinned && hasKey && isSelected && (
            <span className="text-neon">&#10003; selected</span>
          )}
          {!isPinned && hasKey && !isSelected && (
            <span className="text-dim">configured</span>
          )}
          {!isPinned && !hasKey && (
            <span className="text-dim">+ ADD KEY</span>
          )}
        </div>
      </div>

      {isPinned && (
        <div className="text-xs text-dim mt-2">built-in &middot; no key needed</div>
      )}

      {/* Expandable key input */}
      {expanded && (
        <div className="mt-3 space-y-2 animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Paste your API key..."
            className="w-full bg-surface border border-surface-light px-3 py-2 text-xs text-arena-white placeholder-dim focus:outline-none focus:border-neon"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!keyInput.trim()}
              className="px-3 py-1 text-xs font-bold bg-neon text-arena-bg disabled:opacity-30"
            >
              SAVE
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs text-dim hover:text-arena-white"
            >
              Cancel
            </button>
            {hasKey && (
              <button
                onClick={handleRemove}
                className="px-3 py-1 text-xs text-arena-red hover:text-arena-red/80 ml-auto"
              >
                Remove
              </button>
            )}
          </div>
          {model.docsUrl && (
            <div className="text-xs text-dim">
              Get key from{' '}
              <a
                href={model.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon hover:underline"
              >
                {model.provider}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Edit key link for configured cards */}
      {hasKey && !isPinned && !expanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="text-xs text-dim hover:text-arena-white mt-2 block"
        >
          edit key
        </button>
      )}
    </div>
  );
});
