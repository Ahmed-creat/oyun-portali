import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑', '🥝', '🍍', '🍌'];
interface Fruit { id: number; x: number; y: number; vx: number; vy: number; emoji: string; sliced: boolean; bomb: boolean; size: number; rot: number; }
let fid = 0;

export function FruitNinjaGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const canRef = useRef<HTMLCanvasElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const { playScore, playHit, playGameOver } = useSound();
  const gsRef = useRef<GameState>('menu');
  useEffect(() => { gsRef.current = gs; }, [gs]);
  
  const fruits = useRef<Fruit[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const lastSlice = useRef<{ x: number; y: number; t: number } | null>(null);
  const sliceTrail = useRef<{ x: number; y: number; t: number }[]>([]);

  const start = useCallback(() => {
    fruits.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setGs('playing');
  }, []);

  // Spawn fruits
  useEffect(() => {
    if (gs !== 'playing') return;
    const spawn = () => {
      if (!conRef.current) return;
      const W = conRef.current.clientWidth;
      const H = conRef.current.clientHeight;
      const isBomb = Math.random() < 0.15;
      fruits.current.push({
        id: fid++,
        x: Math.random() * (W - 60) + 30,
        y: H + 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -12 - Math.random() * 5,
        emoji: isBomb ? '💣' : FRUITS[Math.floor(Math.random() * FRUITS.length)],
        sliced: false,
        bomb: isBomb,
        size: 40 + Math.random() * 20,
        rot: Math.random() * 360,
      });
    };
    const iv = setInterval(spawn, 800 + Math.random() * 400);
    return () => clearInterval(iv);
  }, [gs]);

  // Game loop
  useEffect(() => {
    if (gs !== 'playing') return;
    const can = canRef.current;
    const con = conRef.current;
    if (!can || !con) return;
    const ctx = can.getContext('2d')!;
    let id: number;

    const loop = () => {
      const W = con.clientWidth, H = con.clientHeight;
      can.width = W; can.height = H;
      const fs = fruits.current;
      const now = Date.now();

      // Update fruits
      for (let i = fs.length - 1; i >= 0; i--) {
        const f = fs[i];
        f.vy += 0.3;
        f.x += f.vx;
        f.y += f.vy;
        f.rot += f.vx * 2;
        
        if (f.y > H + 50) {
          if (!f.sliced && !f.bomb) {
            livesRef.current--;
            setLives(livesRef.current);
            playHit();
            if (livesRef.current <= 0) {
              playGameOver();
              setGs('gameover');
              return;
            }
          }
          fs.splice(i, 1);
        }
      }

      // Update slice trail
      sliceTrail.current = sliceTrail.current.filter(p => now - p.t < 150);

      // Draw background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(1, '#16213e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Draw slice trail
      if (sliceTrail.current.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sliceTrail.current[0].x, sliceTrail.current[0].y);
        for (let i = 1; i < sliceTrail.current.length; i++) {
          ctx.lineTo(sliceTrail.current[i].x, sliceTrail.current[i].y);
        }
        ctx.stroke();
      }

      // Draw fruits
      for (const f of fs) {
        if (f.sliced) continue;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot * Math.PI / 180);
        ctx.font = `${f.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.emoji, 0, 0);
        ctx.restore();
      }

      // Draw lives
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'left';
      for (let i = 0; i < livesRef.current; i++) {
        ctx.fillText('❤️', 10 + i * 25, 30);
      }

      // Draw score
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(scoreRef.current.toString(), W - 10, 30);

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [gs, playHit, playGameOver]);

  const handleSlice = useCallback((x: number, y: number) => {
    if (gs !== 'playing' || !conRef.current) return;
    const rect = conRef.current.getBoundingClientRect();
    const sx = x - rect.left;
    const sy = y - rect.top;
    const now = Date.now();

    sliceTrail.current.push({ x: sx, y: sy, t: now });

    // Check if slicing through any fruit
    if (lastSlice.current && now - lastSlice.current.t < 100) {
      const dx = sx - lastSlice.current.x;
      const dy = sy - lastSlice.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 10) {
        for (const f of fruits.current) {
          if (f.sliced) continue;
          const fdx = f.x - sx;
          const fdy = f.y - sy;
          const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
          
          if (fdist < f.size / 2 + 10) {
            f.sliced = true;
            if (f.bomb) {
              playGameOver();
              setLives(0);
              livesRef.current = 0;
              setTimeout(() => setGs('gameover'), 500);
              return;
            }
            playScore();
            scoreRef.current += 10;
            setScore(scoreRef.current);
            particleEmitter.emit(rect.left + f.x, rect.top + f.y, 8, '#ff6b6b', '+10');
          }
        }
      }
    }

    lastSlice.current = { x: sx, y: sy, t: now };
  }, [gs, playScore, playGameOver]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const touch = 'touches' in e ? e.touches[0] : e;
    if (touch) handleSlice(touch.clientX, touch.clientY);
  }, [handleSlice]);

  return (
    <GameShell gameId="fruitninja" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={start} onBack={onBack} extraInfo={`❤️ ${lives}`}>
      <div ref={conRef} className="absolute inset-0 cursor-crosshair"
        onMouseMove={handleMove}
        onTouchMove={handleMove}
        onMouseDown={handleMove}
        onTouchStart={handleMove}>
        <canvas ref={canRef} className="w-full h-full" />
      </div>
    </GameShell>
  );
}
