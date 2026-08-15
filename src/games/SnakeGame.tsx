import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

const GRID = 20;
const SPEED = 110;
type Dir = 'UP'|'DOWN'|'LEFT'|'RIGHT';
type Pos = { x: number; y: number };

export function SnakeGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<Pos[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Pos>({ x: 15, y: 10 });
  const dirRef = useRef<Dir>('RIGHT');
  const canRef = useRef<HTMLCanvasElement>(null);
  const conRef = useRef<HTMLDivElement>(null);
  const { playScore, playGameOver } = useSound();
  const touchRef = useRef<{x:number;y:number}|null>(null);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);

  const spawnFood = useCallback((s: Pos[]): Pos => {
    let p: Pos;
    do { p = { x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID) }; } while (s.some(q => q.x===p.x&&q.y===p.y));
    return p;
  }, []);

  const start = useCallback(() => {
    const s = [{ x:10, y:10 }];
    setSnake(s); setFood(spawnFood(s)); dirRef.current='RIGHT'; setScore(0); setGs('playing');
  }, [spawnFood]);

  useEffect(() => {
    if (gs !== 'playing') return;
    const iv = setInterval(() => {
      setSnake(prev => {
        const h = { ...prev[0] };
        const d = dirRef.current;
        if (d==='UP') h.y--; if (d==='DOWN') h.y++; if (d==='LEFT') h.x--; if (d==='RIGHT') h.x++;
        if (h.x<0||h.x>=GRID||h.y<0||h.y>=GRID||prev.some(s=>s.x===h.x&&s.y===h.y)) { playGameOver(); setGs('gameover'); return prev; }
        const ns = [h,...prev];
        const f = foodRef.current;
        if (h.x===f.x&&h.y===f.y) {
          playScore(); setScore(s=>s+10); 
          const nf = spawnFood(ns);
          setFood(nf);
          if (conRef.current) { const r=conRef.current.getBoundingClientRect(); const cw=r.width/GRID; particleEmitter.emit(r.left+h.x*cw+cw/2,r.top+h.y*cw+cw/2,8,'#22c55e','+10'); }
          return ns;
        }
        ns.pop(); return ns;
      });
    }, SPEED);
    return () => clearInterval(iv);
  }, [gs, playScore, playGameOver, spawnFood]);

  // Canvas render for snake shape
  useEffect(() => {
    if (!canRef.current || !conRef.current) return;
    const can = canRef.current;
    const con = conRef.current;
    const ctx = can.getContext('2d')!;
    
    const render = () => {
      const W = con.clientWidth, H = con.clientHeight;
      can.width = W; can.height = H;
      const cellW = W / GRID, cellH = H / GRID;
      const s = snakeRef.current;
      const f = foodRef.current;
      
      // Background
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(0, 0, W, H);
      
      // Grid
      ctx.strokeStyle = '#d1fae5';
      ctx.lineWidth = 1;
      for (let i = 1; i < GRID; i++) {
        ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(W, i * cellH); ctx.stroke();
      }
      
      // Food
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(f.x * cellW + cellW/2, f.y * cellH + cellH/2, cellW * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(f.x * cellW + cellW/2 - 2, f.y * cellH + cellH/2 - cellW * 0.5, 4, 6);
      
      // Snake body - smooth curves
      if (s.length > 0) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw body segments with gradient
        for (let i = s.length - 1; i >= 0; i--) {
          const seg = s[i];
          const cx = seg.x * cellW + cellW/2;
          const cy = seg.y * cellH + cellH/2;
          const size = i === 0 ? cellW * 0.45 : cellW * 0.38 - (i / s.length) * 5;
          
          // Body segment
          const alpha = 1 - (i / s.length) * 0.3;
          ctx.fillStyle = i === 0 ? `rgba(34, 197, 94, ${alpha})` : `rgba(74, 222, 128, ${alpha})`;
          ctx.beginPath();
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Connect segments with thick line
          if (i < s.length - 1) {
            const next = s[i + 1];
            const nx = next.x * cellW + cellW/2;
            const ny = next.y * cellH + cellH/2;
            ctx.strokeStyle = `rgba(74, 222, 128, ${alpha})`;
            ctx.lineWidth = size * 1.8;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.stroke();
          }
        }
        
        // Head details
        const head = s[0];
        const hx = head.x * cellW + cellW/2;
        const hy = head.y * cellH + cellH/2;
        const dir = dirRef.current;
        
        // Eyes
        ctx.fillStyle = 'white';
        const eyeOffset = cellW * 0.15;
        const eyeSize = cellW * 0.12;
        let e1x = hx, e1y = hy, e2x = hx, e2y = hy;
        
        if (dir === 'RIGHT') { e1x += eyeOffset; e1y -= eyeOffset; e2x += eyeOffset; e2y += eyeOffset; }
        else if (dir === 'LEFT') { e1x -= eyeOffset; e1y -= eyeOffset; e2x -= eyeOffset; e2y += eyeOffset; }
        else if (dir === 'UP') { e1x -= eyeOffset; e1y -= eyeOffset; e2x += eyeOffset; e2y -= eyeOffset; }
        else { e1x -= eyeOffset; e1y += eyeOffset; e2x += eyeOffset; e2y += eyeOffset; }
        
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2); ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize * 0.5, 0, Math.PI * 2); ctx.fill();
        
        // Tongue
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        let tx = hx, ty = hy;
        if (dir === 'RIGHT') tx += cellW * 0.5;
        else if (dir === 'LEFT') tx -= cellW * 0.5;
        else if (dir === 'UP') ty -= cellW * 0.5;
        else ty += cellW * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(hx + (dir === 'RIGHT' ? cellW * 0.3 : dir === 'LEFT' ? -cellW * 0.3 : 0),
                   hy + (dir === 'DOWN' ? cellW * 0.3 : dir === 'UP' ? -cellW * 0.3 : 0));
        ctx.lineTo(tx, ty);
        ctx.stroke();
        
        // Fork
        const forkLen = cellW * 0.1;
        if (dir === 'RIGHT') {
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + forkLen, ty - forkLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + forkLen, ty + forkLen); ctx.stroke();
        } else if (dir === 'LEFT') {
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - forkLen, ty - forkLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - forkLen, ty + forkLen); ctx.stroke();
        } else if (dir === 'UP') {
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - forkLen, ty - forkLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + forkLen, ty - forkLen); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - forkLen, ty + forkLen); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + forkLen, ty + forkLen); ctx.stroke();
        }
      }
      
      requestAnimationFrame(render);
    };
    const id = requestAnimationFrame(render);
    return () => cancelAnimationFrame(id);
  }, [gs]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (gs!=='playing') return; const d=dirRef.current;
      if ((e.key==='ArrowUp'||e.key==='w')&&d!=='DOWN') dirRef.current='UP';
      if ((e.key==='ArrowDown'||e.key==='s')&&d!=='UP') dirRef.current='DOWN';
      if ((e.key==='ArrowLeft'||e.key==='a')&&d!=='RIGHT') dirRef.current='LEFT';
      if ((e.key==='ArrowRight'||e.key==='d')&&d!=='LEFT') dirRef.current='RIGHT';
    };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  }, [gs]);

  const onTS = (e: React.TouchEvent) => { touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}; };
  const onTE = (e: React.TouchEvent) => {
    if (!touchRef.current||gs!=='playing') return;
    const dx=e.changedTouches[0].clientX-touchRef.current.x, dy=e.changedTouches[0].clientY-touchRef.current.y;
    if (Math.abs(dx)<20&&Math.abs(dy)<20) return; const d=dirRef.current;
    if (Math.abs(dx)>Math.abs(dy)) { if(dx>0&&d!=='LEFT') dirRef.current='RIGHT'; else if(dx<0&&d!=='RIGHT') dirRef.current='LEFT'; }
    else { if(dy>0&&d!=='UP') dirRef.current='DOWN'; else if(dy<0&&d!=='DOWN') dirRef.current='UP'; }
  };

  return (
    <GameShell gameId="snake" score={score} gameState={gs} onStart={start} onPause={()=>setGs('paused')} onResume={()=>setGs('playing')} onRestart={start} onBack={onBack} extraInfo={`Uzunluk: ${snake.length}`}>
      <div ref={conRef} className="absolute inset-0 flex items-center justify-center p-2" onTouchStart={onTS} onTouchEnd={onTE}>
        <div className="relative w-full max-w-[min(90vw,80vh)] aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-green-200">
          <canvas ref={canRef} className="w-full h-full" />
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:hidden z-10">
        <div className="grid grid-cols-3 gap-1 w-36">
          <div/>
          <button className="bg-white/90 border border-gray-200 rounded-xl p-3 text-xl active:bg-green-100 shadow-sm" onTouchStart={()=>{if(dirRef.current!=='DOWN')dirRef.current='UP'}}>↑</button>
          <div/>
          <button className="bg-white/90 border border-gray-200 rounded-xl p-3 text-xl active:bg-green-100 shadow-sm" onTouchStart={()=>{if(dirRef.current!=='RIGHT')dirRef.current='LEFT'}}>←</button>
          <button className="bg-white/90 border border-gray-200 rounded-xl p-3 text-xl active:bg-green-100 shadow-sm" onTouchStart={()=>{if(dirRef.current!=='UP')dirRef.current='DOWN'}}>↓</button>
          <button className="bg-white/90 border border-gray-200 rounded-xl p-3 text-xl active:bg-green-100 shadow-sm" onTouchStart={()=>{if(dirRef.current!=='LEFT')dirRef.current='RIGHT'}}>→</button>
        </div>
      </div>
    </GameShell>
  );
}
