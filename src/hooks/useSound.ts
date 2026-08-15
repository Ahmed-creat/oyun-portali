import { useCallback, useRef } from 'react';

const audioCtxRef = { current: null as AudioContext | null };

function getCtx(): AudioContext {
  if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  return audioCtxRef.current;
}

export function useSound() {
  const lastRef = useRef(0);

  const playTone = useCallback((freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.08) => {
    if (Date.now() - lastRef.current < 30) return;
    lastRef.current = Date.now();
    try {
      const ctx = getCtx(), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  }, []);

  return {
    playScore: useCallback(() => playTone(880, 0.12, 'sine', 0.07), [playTone]),
    playHit: useCallback(() => playTone(220, 0.08, 'triangle', 0.05), [playTone]),
    playClick: useCallback(() => playTone(660, 0.04, 'sine', 0.04), [playTone]),
    playWin: useCallback(() => {
      playTone(523, 0.12); setTimeout(() => playTone(659, 0.12), 80);
      setTimeout(() => playTone(784, 0.12), 160); setTimeout(() => playTone(1047, 0.2), 240);
    }, [playTone]),
    playGameOver: useCallback(() => {
      playTone(440, 0.2, 'triangle'); setTimeout(() => playTone(330, 0.2, 'triangle'), 120);
      setTimeout(() => playTone(220, 0.3, 'triangle'), 240);
    }, [playTone]),
    playTone,
  };
}
