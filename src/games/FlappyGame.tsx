import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

const GRAVITY = 0.3;
const JUMP = -5;
const PIPE_GAP = 160;
const PIPE_W = 50;
const PIPE_SPEED = 2;
const BIRD_SZ = 22;

interface Pipe { x: number; gapY: number; scored: boolean; }

export function FlappyGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const bird = useRef({ y: 200, vy: 0 });
  const pipes = useRef<Pipe[]>([]);
  const scoreR = useRef(0);
  const frame = useRef(0);
  const canRef = useRef<HTMLCanvasElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const { playScore, playGameOver } = useSound();
  const gsRef = useRef<GameState>('menu');
  useEffect(() => { gsRef.current = gs; }, [gs]);

  const jump = useCallback(() => { if (gsRef.current === 'playing') bird.current.vy = JUMP; }, []);

  const start = useCallback(() => {
    bird.current = { y: 200, vy: 0 }; pipes.current = []; scoreR.current = 0; setScore(0); setGs('playing');
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [jump]);

  useEffect(() => {
    if (gs !== 'playing') return;
    const can = canRef.current; if (!can) return;
    const ctx = can.getContext('2d')!;
    let id: number;

    const loop = () => {
      const con = conRef.current; if (!con) return;
      const W = con.clientWidth, H = con.clientHeight;
      can.width = W; can.height = H;
      const b = bird.current, ps = pipes.current;

      b.vy += GRAVITY; b.y += b.vy;

      if (!ps.length || ps[ps.length - 1].x < W - 220)
        ps.push({ x: W + 20, gapY: Math.random() * (H - 160 - PIPE_GAP) + 80, scored: false });

      for (let i = ps.length - 1; i >= 0; i--) { ps[i].x -= PIPE_SPEED; if (ps[i].x < -PIPE_W) ps.splice(i, 1); }

      for (const p of ps) {
        if (!p.scored && p.x + PIPE_W < W * 0.3) {
          p.scored = true; scoreR.current++; setScore(scoreR.current); playScore();
          particleEmitter.emit(W * 0.3, b.y, 5, '#eab308', `+1`);
        }
      }

      const bx = W * 0.3;
      let dead = b.y < 0 || b.y + BIRD_SZ > H;
      for (const p of ps) {
        if (bx + BIRD_SZ > p.x && bx < p.x + PIPE_W)
          if (b.y < p.gapY || b.y + BIRD_SZ > p.gapY + PIPE_GAP) dead = true;
      }
      if (dead) { playGameOver(); setGs('gameover'); return; }

      // Draw sky
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#87CEEB'); g.addColorStop(1, '#E0F0FF');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 5; i++) {
        const cx = (i * 180 + frame.current * 0.3) % (W + 100) - 50;
        ctx.beginPath(); ctx.ellipse(cx, 40 + i * 30, 40, 20, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Pipes
      for (const p of ps) {
        ctx.fillStyle = '#4ade80'; ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.strokeRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillRect(p.x - 3, p.gapY - 16, PIPE_W + 6, 16);
        ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_W, H);
        ctx.strokeRect(p.x, p.gapY + PIPE_GAP, PIPE_W, H);
        ctx.fillRect(p.x - 3, p.gapY + PIPE_GAP, PIPE_W + 6, 16);
      }

      // Bird
      ctx.save();
      ctx.translate(bx + BIRD_SZ / 2, b.y + BIRD_SZ / 2);
      ctx.rotate(Math.min(Math.max(b.vy * 0.06, -0.4), 0.6));
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.ellipse(0, 0, BIRD_SZ / 2, BIRD_SZ / 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(5, -3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, -3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(17, 2); ctx.lineTo(10, 5); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Ground
      ctx.fillStyle = '#86efac'; ctx.fillRect(0, H - 20, W, 20);
      ctx.fillStyle = '#65a30d'; ctx.fillRect(0, H - 20, W, 3);

      frame.current++;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [gs, playScore, playGameOver]);

  return (
    <GameShell gameId="flappy" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={start} onBack={onBack}>
      <div ref={conRef} className="absolute inset-0" onClick={jump} onTouchStart={(e) => { e.preventDefault(); jump(); }}>
        <canvas ref={canRef} className="w-full h-full" />
      </div>
    </GameShell>
  );
}
