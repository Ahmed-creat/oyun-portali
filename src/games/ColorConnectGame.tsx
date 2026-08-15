import { useState, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';


const LEVELS = [
  { size: 5, pairs: [[0,0,4,4,'#ef4444'],[0,4,4,0,'#3b82f6'],[2,0,2,4,'#22c55e']] },
  { size: 5, pairs: [[0,0,3,3,'#ef4444'],[1,0,4,3,'#3b82f6'],[0,4,4,4,'#22c55e'],[2,1,2,3,'#eab308']] },
  { size: 6, pairs: [[0,0,5,5,'#ef4444'],[0,5,5,0,'#3b82f6'],[2,1,3,4,'#22c55e'],[1,3,4,2,'#eab308']] },
  { size: 6, pairs: [[0,0,4,4,'#ef4444'],[1,0,5,4,'#3b82f6'],[0,5,4,1,'#22c55e'],[2,2,3,3,'#eab308'],[1,4,5,0,'#a855f7']] },
];

type Path = { color: string; points: [number, number][]; complete: boolean };

export function ColorConnectGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [paths, setPaths] = useState<Path[]>([]);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [dots, setDots] = useState<{r: number; c: number; color: string}[]>([]);
  const { playClick, playScore, playWin } = useSound();
  const boardRef = useRef<HTMLDivElement>(null);

  const initLevel = useCallback((lvl: number) => {
    const l = LEVELS[lvl % LEVELS.length];
    const g: (string | null)[][] = Array.from({ length: l.size }, () => Array(l.size).fill(null));
    const d: {r: number; c: number; color: string}[] = [];
    const p: Path[] = [];
    for (const [r1, c1, r2, c2, col] of l.pairs) {
      d.push({ r: r1 as number, c: c1 as number, color: col as string });
      d.push({ r: r2 as number, c: c2 as number, color: col as string });
      g[r1 as number][c1 as number] = col as string;
      g[r2 as number][c2 as number] = col as string;
      p.push({ color: col as string, points: [], complete: false });
    }
    setGrid(g);
    setDots(d);
    setPaths(p);
    setDrawing(null);
  }, []);

  const start = useCallback(() => {
    setLevel(0);
    setScore(0);
    initLevel(0);
    setGs('playing');
  }, [initLevel]);

  const getDot = (r: number, c: number) => dots.find(d => d.r === r && d.c === c);

  const handleCell = useCallback((r: number, c: number, isStart: boolean) => {
    if (gs !== 'playing') return;
    const dot = getDot(r, c);


    if (isStart) {
      if (dot) {
        playClick();
        // Start new path from dot
        const newPaths = paths.map(p => p.color === dot.color ? { ...p, points: [[r, c] as [number, number]], complete: false } : p);
        // Clear grid cells for this color
        const newGrid = grid.map(row => row.map(cell => cell === dot.color ? null : cell));
        newGrid[r][c] = dot.color;
        setGrid(newGrid);
        setPaths(newPaths);
        setDrawing(dot.color);
      }
    } else if (drawing) {
      const path = paths.find(p => p.color === drawing);
      if (!path || path.points.length === 0) return;
      
      const last = path.points[path.points.length - 1];
      const dr = Math.abs(r - last[0]);
      const dc = Math.abs(c - last[1]);
      
      // Must be adjacent (no diagonal)
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // Check if cell is free or is same color dot
        const cellColor = grid[r][c];
        if (cellColor && cellColor !== drawing) return;
        
        // Check if this is the target dot
        const targetDot = dot && dot.color === drawing && !path.points.some(([pr, pc]) => pr === r && pc === c);
        
        playClick();
        const newPoints = [...path.points, [r, c] as [number, number]];
        const newGrid = grid.map(row => [...row]);
        newGrid[r][c] = drawing;
        
        const newPaths = paths.map(p => 
          p.color === drawing ? { ...p, points: newPoints, complete: targetDot || false } : p
        );
        
        setGrid(newGrid);
        setPaths(newPaths);
        
        if (targetDot) {
          setDrawing(null);
          // Check win
          const allComplete = newPaths.every(p => p.complete);
          const allFilled = newGrid.flat().every(c => c !== null);
          if (allComplete && allFilled) {
            playWin();
            setScore(s => s + (level + 1) * 100);
            setTimeout(() => {
              if (level < LEVELS.length - 1) {
                setLevel(l => l + 1);
                initLevel(level + 1);
              } else {
                setGs('gameover');
              }
            }, 1000);
          } else if (allComplete) {
            playScore();
            setScore(s => s + 50);
          }
        }
      }
    }
  }, [gs, drawing, paths, grid, dots, level, playClick, playScore, playWin, initLevel]);

  const handleEnd = () => setDrawing(null);

  const cellSize = `min(${80 / (LEVELS[level % LEVELS.length]?.size || 5)}vw, ${60 / (LEVELS[level % LEVELS.length]?.size || 5)}vh)`;
  const size = LEVELS[level % LEVELS.length]?.size || 5;

  return (
    <GameShell gameId="colorconnect" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={start} onBack={onBack} extraInfo={`Seviye: ${level + 1}/${LEVELS.length}`}>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={boardRef} className="bg-white rounded-xl p-2 shadow-lg" onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchEnd={handleEnd}>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${size}, ${cellSize})` }}>
            {grid.map((row, r) => row.map((cell, c) => {
              const dot = getDot(r, c);
              return (
                <div key={`${r}-${c}`}
                  onMouseDown={() => handleCell(r, c, true)}
                  onMouseEnter={(e) => { if (e.buttons === 1) handleCell(r, c, false); }}
                  onTouchStart={() => handleCell(r, c, true)}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    const coords = el?.getAttribute('data-coords');
                    if (coords) {
                      const [nr, nc] = coords.split('-').map(Number);
                      handleCell(nr, nc, false);
                    }
                  }}
                  data-coords={`${r}-${c}`}
                  className="rounded-md flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: cell ? `${cell}30` : '#f1f5f9',
                  }}>
                  {dot && (
                    <div className="rounded-full shadow-md" style={{
                      width: '60%',
                      height: '60%',
                      backgroundColor: dot.color,
                    }} />
                  )}
                  {cell && !dot && (
                    <div className="rounded-full" style={{
                      width: '40%',
                      height: '40%',
                      backgroundColor: cell,
                    }} />
                  )}
                </div>
              );
            }))}
          </div>
        </div>
      </div>
    </GameShell>
  );
}
