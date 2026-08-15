import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';

const LEVELS = [
  { platforms: [{x:0,y:350,w:800,h:50},{x:200,y:280,w:100,h:15},{x:450,y:220,w:100,h:15}], spikes: [], flag: {x:700,y:310} },
  { platforms: [{x:0,y:350,w:180,h:50},{x:260,y:350,w:120,h:50},{x:460,y:300,w:100,h:15},{x:620,y:350,w:180,h:50}], spikes: [], flag: {x:720,y:310} },
  { platforms: [{x:0,y:350,w:150,h:50},{x:180,y:300,w:100,h:15},{x:320,y:250,w:100,h:15},{x:460,y:200,w:100,h:15},{x:600,y:150,w:200,h:50}], spikes: [], flag: {x:720,y:110} },
  { platforms: [{x:0,y:350,w:800,h:50}], spikes: [{x:200,y:340,w:40},{x:400,y:340,w:40},{x:550,y:340,w:40}], flag: {x:720,y:310} },
  { platforms: [{x:0,y:350,w:120,h:50},{x:180,y:300,w:80,h:15},{x:320,y:250,w:80,h:15},{x:460,y:200,w:80,h:15},{x:600,y:350,w:200,h:50}], spikes: [{x:300,y:340,w:100}], flag: {x:720,y:310} },
  { platforms: [{x:0,y:200,w:120,h:40},{x:180,y:250,w:80,h:15},{x:320,y:300,w:80,h:15},{x:460,y:350,w:340,h:50}], spikes: [], flag: {x:720,y:310} },
  { platforms: [{x:0,y:350,w:100,h:50},{x:150,y:350,w:60,h:50},{x:260,y:350,w:60,h:50},{x:370,y:350,w:60,h:50},{x:480,y:350,w:60,h:50},{x:590,y:350,w:210,h:50}], spikes: [{x:110,y:340,w:30},{x:220,y:340,w:30},{x:330,y:340,w:30},{x:440,y:340,w:30},{x:550,y:340,w:30}], flag: {x:720,y:310} },
  { platforms: [{x:0,y:350,w:120,h:50},{x:180,y:300,w:60,h:15},{x:300,y:250,w:60,h:15},{x:420,y:200,w:60,h:15},{x:540,y:150,w:60,h:15},{x:660,y:100,w:140,h:50}], spikes: [], flag: {x:720,y:60} },
  { platforms: [{x:0,y:200,w:100,h:40},{x:150,y:250,w:80,h:15},{x:280,y:300,w:80,h:15},{x:410,y:350,w:390,h:50}], spikes: [{x:500,y:340,w:40},{x:600,y:340,w:40}], flag: {x:720,y:310} },
  { platforms: [{x:0,y:350,w:80,h:50},{x:140,y:300,w:60,h:15},{x:260,y:250,w:60,h:15},{x:380,y:200,w:60,h:15},{x:500,y:150,w:60,h:15},{x:620,y:100,w:60,h:15},{x:720,y:350,w:80,h:50}], spikes: [{x:200,y:340,w:30},{x:400,y:340,w:30},{x:550,y:340,w:30}], flag: {x:740,y:310} },
  // Additional new levels
  { platforms: [{x:0,y:350,w:100,h:50},{x:150,y:280,w:100,h:15},{x:300,y:220,w:100,h:15},{x:450,y:160,w:100,h:15},{x:600,y:350,w:200,h:50}], spikes: [{x:250,y:340,w:300}], flag: {x:720,y:310} },
  { platforms: [{x:0,y:350,w:150,h:50},{x:200,y:300,w:80,h:15},{x:330,y:300,w:80,h:15},{x:460,y:300,w:80,h:15},{x:600,y:350,w:200,h:50}], spikes: [{x:150,y:340,w:450}], flag: {x:720,y:310} },
];

export function RedBallGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const canRef = useRef<HTMLCanvasElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const { playScore, playGameOver, playWin, playTone } = useSound();
  const gsRef = useRef<GameState>('menu');
  useEffect(() => { gsRef.current = gs; }, [gs]);

  const ball = useRef({ x: 60, y: 250, vx: 0, vy: 0, onGround: false });
  const keys = useRef({ left: false, right: false, jump: false });
  const levelRef = useRef(0);
  const scoreRef = useRef(0);

  const initLevel = useCallback((n: number) => {
    ball.current = { x: 60, y: 200, vx: 0, vy: 0, onGround: false };
    levelRef.current = n;
  }, []);

  const start = useCallback(() => {
    setLevel(0);
    setScore(0);
    scoreRef.current = 0;
    initLevel(0);
    setGs('playing');
  }, [initLevel]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.current.jump = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.current.jump = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

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
      const scaleX = W / 800, scaleY = H / 400;
      const b = ball.current;
      const lvl = LEVELS[levelRef.current];
      const K = keys.current;

      // Controls
      if (K.left) b.vx = -4;
      else if (K.right) b.vx = 4;
      else b.vx *= 0.8;

      if (K.jump && b.onGround) { b.vy = -9.5; b.onGround = false; playTone(350, 0.1); }

      // Physics
      b.vy += 0.45;
      b.x += b.vx;
      b.y += b.vy;

      // Collisions with platforms
      b.onGround = false;
      const radius = 12;
      for (const p of lvl.platforms) {
        if (b.x + radius > p.x && b.x - radius < p.x + p.w) {
          if (b.y + radius >= p.y && b.y - radius < p.y + p.h && b.vy > 0) {
            b.y = p.y - radius;
            b.vy = 0;
            b.onGround = true;
          }
        }
      }

      // Spikes collision
      for (const s of lvl.spikes) {
        if (b.x + radius > s.x && b.x - radius < s.x + s.w && b.y + radius > s.y) {
          playGameOver();
          setGs('gameover');
          return;
        }
      }

      // Fall off
      if (b.y > 450) {
        playGameOver();
        setGs('gameover');
        return;
      }

      // Flag win
      const f = lvl.flag;
      if (Math.hypot(b.x - f.x, b.y - f.y) < 25) {
        scoreRef.current += 100;
        setScore(scoreRef.current);
        playScore();

        if (levelRef.current + 1 < LEVELS.length) {
          const nxt = levelRef.current + 1;
          setLevel(nxt);
          initLevel(nxt);
        } else {
          playWin();
          setGs('gameover');
          return;
        }
      }

      // Render
      ctx.clearRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1e1b4b');
      sky.addColorStop(1, '#312e81');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Platforms
      ctx.fillStyle = '#10b981';
      for (const p of lvl.platforms) {
        ctx.fillRect(p.x * scaleX, p.y * scaleY, p.w * scaleX, p.h * scaleY);
      }

      // Spikes
      ctx.fillStyle = '#ef4444';
      for (const s of lvl.spikes) {
        ctx.beginPath();
        ctx.moveTo(s.x * scaleX, (s.y + 10) * scaleY);
        ctx.lineTo((s.x + s.w / 2) * scaleX, s.y * scaleY);
        ctx.lineTo((s.x + s.w) * scaleX, (s.y + 10) * scaleY);
        ctx.fill();
      }

      // Flag
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(f.x * scaleX, (f.y - 20) * scaleY, 4 * scaleX, 30 * scaleY);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo((f.x + 4) * scaleX, (f.y - 20) * scaleY);
      ctx.lineTo((f.x + 20) * scaleX, (f.y - 12) * scaleY);
      ctx.lineTo((f.x + 4) * scaleX, (f.y - 4) * scaleY);
      ctx.fill();

      // Ball
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(b.x * scaleX, b.y * scaleY, radius * scaleX, 0, Math.PI * 2);
      ctx.fill();

      id = requestAnimationFrame(loop);
    };

    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [gs, initLevel, playGameOver, playScore, playTone, playWin]);

  return (
    <GameShell
      gameId="redball"
      score={score}
      gameState={gs}
      onStart={start}
      onPause={() => setGs('paused')}
      onResume={() => setGs('playing')}
      onRestart={start}
      onBack={onBack}
      extraInfo={`Bölüm: ${level + 1}/${LEVELS.length}`}
    >
      <div ref={conRef} className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas ref={canRef} className="w-full h-full block" />

        {/* Touch Controls for Mobile */}
        {gs === 'playing' && (
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none select-none">
            <div className="flex gap-3 pointer-events-auto">
              <button
                onTouchStart={() => (keys.current.left = true)}
                onTouchEnd={() => (keys.current.left = false)}
                onMouseDown={() => (keys.current.left = true)}
                onMouseUp={() => (keys.current.left = false)}
                className="w-14 h-14 bg-white/20 active:bg-white/40 border border-white/30 rounded-2xl flex items-center justify-center text-white text-2xl backdrop-blur-md"
              >
                ◀
              </button>
              <button
                onTouchStart={() => (keys.current.right = true)}
                onTouchEnd={() => (keys.current.right = false)}
                onMouseDown={() => (keys.current.right = true)}
                onMouseUp={() => (keys.current.right = false)}
                className="w-14 h-14 bg-white/20 active:bg-white/40 border border-white/30 rounded-2xl flex items-center justify-center text-white text-2xl backdrop-blur-md"
              >
                ▶
              </button>
            </div>
            <button
              onTouchStart={() => (keys.current.jump = true)}
              onTouchEnd={() => (keys.current.jump = false)}
              onMouseDown={() => (keys.current.jump = true)}
              onMouseUp={() => (keys.current.jump = false)}
              className="w-16 h-16 bg-rose-500/80 active:bg-rose-600 border border-rose-400 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg pointer-events-auto backdrop-blur-md"
            >
              ▲
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
