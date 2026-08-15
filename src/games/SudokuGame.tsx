import { useState, useCallback } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';

type Grid = number[][];

function solve(g: Grid): boolean {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    if (g[r][c] === 0) {
      for (let n = 1; n <= 9; n++) {
        if (valid(g, r, c, n)) { g[r][c] = n; if (solve(g)) return true; g[r][c] = 0; }
      }
      return false;
    }
  }
  return true;
}

function valid(g: Grid, r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) { if (g[r][i] === n || g[i][c] === n) return false; }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) if (g[i][j] === n) return false;
  return true;
}

function generate(): { puzzle: Grid; solution: Grid } {
  const g: Grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  // Fill diagonal boxes
  for (let b = 0; b < 3; b++) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
    let idx = 0;
    for (let r = b * 3; r < b * 3 + 3; r++) for (let c = b * 3; c < b * 3 + 3; c++) g[r][c] = nums[idx++];
  }
  solve(g);
  const solution = g.map(r => [...r]);
  // Remove cells
  let remove = 45;
  while (remove > 0) {
    const r = Math.floor(Math.random() * 9), c = Math.floor(Math.random() * 9);
    if (g[r][c] !== 0) { g[r][c] = 0; remove--; }
  }
  return { puzzle: g, solution };
}

export function SudokuGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [puzzle, setPuzzle] = useState<Grid>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [solution, setSolution] = useState<Grid>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [board, setBoard] = useState<Grid>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [errorCount, setErrorCount] = useState(0);
  const { playScore, playHit, playWin, playClick } = useSound();

  const start = useCallback(() => {
    const { puzzle: p, solution: s } = generate();
    setPuzzle(p); setSolution(s); setBoard(p.map(r => [...r]));
    setSelected(null); setErrors(new Set()); setScore(0); setErrorCount(0); setGs('playing');
  }, []);

  const placeNumber = useCallback((n: number) => {
    if (!selected || gs !== 'playing') return;
    const [r, c] = selected;
    if (puzzle[r][c] !== 0) return;
    playClick();

    const nb = board.map(row => [...row]);
    nb[r][c] = n;
    setBoard(nb);

    if (n !== solution[r][c]) {
      playHit();
      setErrors(prev => new Set(prev).add(`${r}-${c}`));
      const ne = errorCount + 1;
      setErrorCount(ne);
      if (ne >= 3) { setGs('gameover'); return; }
    } else {
      setErrors(prev => { const s = new Set(prev); s.delete(`${r}-${c}`); return s; });
      setScore(s => s + 10);
      // Check complete
      let complete = true;
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
        const v = (i === r && j === c) ? n : nb[i][j];
        if (v !== solution[i][j]) complete = false;
      }
      if (complete) { playWin(); setScore(s => s + 500); setTimeout(() => setGs('gameover'), 500); }
      else playScore();
    }
  }, [selected, gs, puzzle, board, solution, errorCount, playClick, playHit, playScore, playWin]);

  const isOriginal = (r: number, c: number) => puzzle[r][c] !== 0;
  const isError = (r: number, c: number) => errors.has(`${r}-${c}`);
  const isSel = (r: number, c: number) => selected?.[0] === r && selected?.[1] === c;
  const sameRow = (r: number) => selected?.[0] === r;
  const sameCol = (c: number) => selected?.[1] === c;
  const sameBox = (r: number, c: number) => selected && Math.floor(r / 3) === Math.floor(selected[0] / 3) && Math.floor(c / 3) === Math.floor(selected[1] / 3);

  return (
    <GameShell gameId="sudoku" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={start} onBack={onBack}
      extraInfo={`Hata: ${errorCount}/3`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-3">
        <div className="grid grid-cols-9 border-2 border-gray-800 rounded-lg overflow-hidden bg-white shadow-lg">
          {board.map((row, r) => row.map((v, c) => (
            <button key={`${r}-${c}`}
              onClick={() => { if (gs === 'playing' && !isOriginal(r, c)) setSelected([r, c]); }}
              className={`w-[min(10vw,5vh)] h-[min(10vw,5vh)] sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base font-bold transition-colors
                ${r % 3 === 2 && r < 8 ? 'border-b-2 border-b-gray-800' : 'border-b border-b-gray-200'}
                ${c % 3 === 2 && c < 8 ? 'border-r-2 border-r-gray-800' : 'border-r border-r-gray-200'}
                ${isSel(r, c) ? 'bg-indigo-200' : sameRow(r) || sameCol(c) || sameBox(r, c) ? 'bg-indigo-50' : 'bg-white'}
                ${isOriginal(r, c) ? 'text-gray-800' : isError(r, c) ? 'text-red-500' : 'text-indigo-600'}
              `}>
              {v > 0 ? v : ''}
            </button>
          )))}
        </div>
        {/* Number pad */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => placeNumber(n)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border-2 border-gray-200 hover:border-indigo-400 active:bg-indigo-100 font-bold text-lg shadow-sm transition-all">
              {n}
            </button>
          ))}
          <button onClick={() => { if (selected && !isOriginal(selected[0], selected[1])) { const nb = board.map(r => [...r]); nb[selected[0]][selected[1]] = 0; setBoard(nb); } }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 border-2 border-red-200 hover:border-red-400 active:bg-red-100 font-bold text-lg shadow-sm transition-all">✕</button>
        </div>
      </div>
    </GameShell>
  );
}
