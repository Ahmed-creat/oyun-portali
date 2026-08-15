import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

const FRUITS = ['🍒','🍓','🍇','🍊','🍎','🍑','🍋','🍐','🥝','🍉','🍈'];
const SIZES = [14, 18, 22, 26, 30, 35, 40, 46, 52, 58, 66];
const POINTS = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];

interface Ball { id: number; x: number; y: number; vx: number; vy: number; r: number; level: number; merged?: boolean; }
let ballId = 0;

export function FruitMergeGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const canRef = useRef<HTMLCanvasElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const { playScore, playGameOver, playTone } = useSound();
  const gsRef = useRef<GameState>('menu');
  useEffect(() => { gsRef.current = gs; }, [gs]);

  const balls = useRef<Ball[]>([]);
  const nextLevel = useRef(0);
  const nextNextLevel = useRef(1);
  const dropX = useRef(0);
  const scoreRef = useRef(0);
  const canDrop = useRef(true);
  const AREA_W = 220;
  const AREA_H = 380;

  const start = useCallback(() => {
    balls.current = [];
    nextLevel.current = Math.floor(Math.random() * 4);
    nextNextLevel.current = Math.floor(Math.random() * 4);
    scoreRef.current = 0;
    setScore(0);
    canDrop.current = true;
    setGs('playing');
  }, []);

  useEffect(() => {
    if (gs !== 'playing') return;
    const can = canRef.current;
    const con = conRef.current;
    if (!can || !con) return;
    const ctx = can.getContext('2d')!;
    let id: number;

    const loop = () => {
      can.width = con.clientWidth;
      can.height = con.clientHeight;
      const W = can.width;
      const H = can.height;
      const bs = balls.current;
      
      const areaX = (W - AREA_W) / 2;
      const areaY = 60;
      const WALL_L = areaX;
      const WALL_R = areaX + AREA_W;
      const FLOOR = areaY + AREA_H;

      // Physics
      for (const b of bs) {
        if (b.merged) continue;
        b.vy += 0.3;
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.98;
        b.vy *= 0.98;

        if (b.x - b.r < WALL_L) { b.x = WALL_L + b.r; b.vx = Math.abs(b.vx) * 0.4; }
        if (b.x + b.r > WALL_R) { b.x = WALL_R - b.r; b.vx = -Math.abs(b.vx) * 0.4; }
        if (b.y + b.r > FLOOR) { b.y = FLOOR - b.r; b.vy = -Math.abs(b.vy) * 0.25; if (Math.abs(b.vy) < 0.3) b.vy = 0; }
      }

      // Collision
      for (let i = 0; i < bs.length; i++) {
        if (bs[i].merged) continue;
        for (let j = i + 1; j < bs.length; j++) {
          if (bs[j].merged) continue;
          const a = bs[i], b = bs[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minD = a.r + b.r;
          if (dist < minD && dist > 0) {
            if (a.level === b.level && a.level < FRUITS.length - 1) {
              a.merged = true;
              b.merged = true;
              const nl = a.level + 1;
              const pts = POINTS[nl];
              scoreRef.current += pts;
              setScore(scoreRef.current);
              playScore();
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              bs.push({ id: ballId++, x: mx, y: my, vx: 0, vy: -1, r: SIZES[nl], level: nl });
              const rect = con.getBoundingClientRect();
              particleEmitter.emit(rect.left + mx, rect.top + my, 6, '#84cc16', `+${pts}`);
            } else {
              const nx = dx / dist, ny = dy / dist;
              const overlap = minD - dist;
              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;
              const va = a.vx * nx + a.vy * ny;
              const vb = b.vx * nx + b.vy * ny;
              a.vx += (vb - va) * nx * 0.4;
              a.vy += (vb - va) * ny * 0.4;
              b.vx += (va - vb) * nx * 0.4;
              b.vy += (va - vb) * ny * 0.4;
            }
          }
        }
      }

      balls.current = bs.filter(b => !b.merged);

      // Game over check
      const LINE_Y = areaY + 40;
      for (const b of balls.current) {
        if (b.y - b.r < LINE_Y && Math.abs(b.vy) < 0.5 && b.y > areaY + 20) {
          playGameOver();
          setGs('gameover');
          return;
        }
      }

      // Draw background
      ctx.fillStyle = '#f0f4f8';
      ctx.fillRect(0, 0, W, H);

      // Game area
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(areaX, areaY, AREA_W, AREA_H);
      
      // Walls
      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(areaX - 8, areaY, 8, AREA_H + 8);
      ctx.fillRect(WALL_R, areaY, 8, AREA_H + 8);
      ctx.fillRect(areaX - 8, FLOOR, AREA_W + 16, 8);
      
      // Danger line
      ctx.strokeStyle = '#fca5a5';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(WALL_L, LINE_Y);
      ctx.lineTo(WALL_R, LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Drop preview
      const nxt = nextLevel.current;
      const dropPosX = Math.max(WALL_L + SIZES[nxt], Math.min(WALL_R - SIZES[nxt], dropX.current || (W / 2)));
      ctx.font = `${SIZES[nxt] * 1.3}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(FRUITS[nxt], dropPosX, areaY + 25);
      
      // Drop line
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dropPosX, areaY + 35);
      ctx.lineTo(dropPosX, FLOOR);
      ctx.stroke();

      // Balls
      for (const b of balls.current) {
        ctx.font = `${b.r * 1.6}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(FRUITS[b.level], b.x, b.y);
      }

      // Next fruit panel
      ctx.fillStyle = 'white';
      ctx.fillRect(W - 70, areaY, 60, 100);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(W - 70, areaY, 60, 100);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText('Sıradaki', W - 40, areaY + 15);
      ctx.font = '30px sans-serif';
      ctx.fillText(FRUITS[nextNextLevel.current], W - 40, areaY + 55);

      // Fruit order panel
      ctx.fillStyle = 'white';
      ctx.fillRect(10, areaY, 50, AREA_H);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(10, areaY, 50, AREA_H);
      ctx.fillStyle = '#64748b';
      ctx.font = '8px sans-serif';
      ctx.fillText('Meyveler', 35, areaY + 12);
      for (let i = 0; i < Math.min(8, FRUITS.length); i++) {
        ctx.font = '20px sans-serif';
        ctx.fillText(FRUITS[i], 35, areaY + 35 + i * 40);
      }

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [gs, playScore, playGameOver]);

  const handleDrop = useCallback((clientX: number) => {
    if (gs !== 'playing' || !canDrop.current || !conRef.current) return;
    canDrop.current = false;
    const rect = conRef.current.getBoundingClientRect();
    const W = rect.width;
    const areaX = (W - AREA_W) / 2;
    const WALL_L = areaX;
    const WALL_R = areaX + AREA_W;
    const lvl = nextLevel.current;
    const x = Math.max(WALL_L + SIZES[lvl] + 5, Math.min(WALL_R - SIZES[lvl] - 5, clientX - rect.left));
    balls.current.push({ id: ballId++, x, y: 70, vx: 0, vy: 1, r: SIZES[lvl], level: lvl });
    playTone(330 + lvl * 40, 0.08, 'sine', 0.04);
    nextLevel.current = nextNextLevel.current;
    nextNextLevel.current = Math.floor(Math.random() * 4);
    setTimeout(() => { canDrop.current = true; }, 350);
  }, [gs, playTone]);

  const handleMove = useCallback((clientX: number) => {
    if (!conRef.current) return;
    dropX.current = clientX - conRef.current.getBoundingClientRect().left;
  }, []);

  return (
    <GameShell gameId="fruitmarge" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={start} onBack={onBack}>
      <div ref={conRef} className="absolute inset-0"
        onClick={(e) => handleDrop(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchStart={(e) => { handleMove(e.touches[0].clientX); handleDrop(e.touches[0].clientX); }}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}>
        <canvas ref={canRef} className="w-full h-full" />
      </div>
    </GameShell>
  );
}
