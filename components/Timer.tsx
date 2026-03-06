'use client';

import { memo, useEffect, useState, useRef } from 'react';

interface TimerProps {
  startTime: number | null;
  endTime: number | null;
  running: boolean;
}

export default memo(function Timer({ startTime, endTime, running }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!startTime || !running) {
      if (startTime && endTime) {
        setElapsed(endTime - startTime);
      }
      return;
    }

    const tick = () => {
      setElapsed(performance.now() - startTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [startTime, endTime, running]);

  const seconds = elapsed / 1000;
  const display = seconds.toFixed(3);

  return (
    <span className={`font-mono tabular-nums ${running ? 'text-neon timer-glow animate-glow' : startTime ? 'text-neon' : 'text-dim'}`}>
      {startTime ? display : '0.000'}s
    </span>
  );
});
