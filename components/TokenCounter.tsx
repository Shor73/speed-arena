'use client';

import { memo } from 'react';

interface TokenCounterProps {
  tokens: number;
  active: boolean;
}

export default memo(function TokenCounter({ tokens, active }: TokenCounterProps) {
  return (
    <span className={`font-mono tabular-nums ${active ? 'text-neon' : tokens > 0 ? 'text-arena-white' : 'text-dim'}`}>
      {tokens.toLocaleString('en-US')} <span className="text-dim text-xs">tokens</span>
    </span>
  );
});
