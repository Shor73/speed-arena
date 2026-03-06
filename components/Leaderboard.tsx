'use client';

import { useEffect, useState } from 'react';
import { MODELS, type RaceResult } from '@/lib/types';

const STORAGE_KEY = 'speed-arena-results';

export function saveRaceResult(result: RaceResult) {
  const existing = getRaceResults();
  existing.push(result);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
}

export function getRaceResults(): RaceResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

interface AggregateStats {
  modelId: string;
  displayName: string;
  avgTokPerSec: number;
  avgTTFT: number;
  avgTotalTime: number;
  races: number;
}

export default function LeaderboardTable() {
  const [stats, setStats] = useState<AggregateStats[]>([]);
  const [totalRaces, setTotalRaces] = useState(0);

  useEffect(() => {
    const results = getRaceResults();
    setTotalRaces(results.length);

    const modelStats: Record<string, { tokPerSec: number[]; ttft: number[]; totalTime: number[] }> = {};

    for (const race of results) {
      for (const r of race.results) {
        if (!modelStats[r.modelId]) {
          modelStats[r.modelId] = { tokPerSec: [], ttft: [], totalTime: [] };
        }
        modelStats[r.modelId].tokPerSec.push(r.tokPerSec);
        modelStats[r.modelId].ttft.push(r.ttft);
        modelStats[r.modelId].totalTime.push(r.totalTime);
      }
    }

    const aggregated: AggregateStats[] = Object.entries(modelStats)
      .map(([modelId, data]) => {
        const model = MODELS.find((m) => m.id === modelId);
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        return {
          modelId,
          displayName: model?.displayName || modelId,
          avgTokPerSec: avg(data.tokPerSec),
          avgTTFT: avg(data.ttft),
          avgTotalTime: avg(data.totalTime),
          races: data.tokPerSec.length,
        };
      })
      .sort((a, b) => b.avgTokPerSec - a.avgTokPerSec);

    setStats(aggregated);
  }, []);

  if (stats.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-mono text-dim text-lg">No races yet.</p>
        <p className="font-mono text-dim-light text-sm mt-2">
          Go run some races to see the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 font-mono text-sm text-dim">
        Total races: <span className="text-neon">{totalRaces}</span>
      </div>
      <div className="border border-surface-light">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-surface-light font-mono text-xs text-dim uppercase tracking-wider">
          <div>Model</div>
          <div className="text-right">Avg tok/s</div>
          <div className="text-right">Avg TTFT</div>
          <div className="text-right">Avg Total</div>
          <div className="text-right">Races</div>
        </div>
        {stats.map((stat, index) => (
          <div
            key={stat.modelId}
            className={`grid grid-cols-5 gap-4 p-4 font-mono text-sm ${
              index === 0 ? 'text-neon' : 'text-arena-white'
            } ${index < stats.length - 1 ? 'border-b border-surface-light' : ''}`}
          >
            <div className="font-bold">{stat.displayName}</div>
            <div className="text-right tabular-nums">
              {stat.avgTokPerSec.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-right tabular-nums">
              {(stat.avgTTFT / 1000).toFixed(3)}s
            </div>
            <div className="text-right tabular-nums">
              {(stat.avgTotalTime / 1000).toFixed(3)}s
            </div>
            <div className="text-right tabular-nums">{stat.races}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
