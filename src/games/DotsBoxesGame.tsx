import { useState, useCallback } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';

type Mode = '1v1' | 'vsBot';
type Line = { r: number; c: number; h: boolean; owner: 0 | 1 | 2 }; // 0=none, 1=p1, 2=p2
type Box = { r: number; c: number; owner: 0 | 1 | 2 };

const GRID = 5; // 5x5 dots = 4x4 boxes

export function DotsBoxesGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [, setScore] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [mode, setMode] = useState<Mode>('vsBot');
  const [showSetup, setShowSetup] = useState(true);
  const [msg, setMsg] = useState('');
  const [thinking, setThinking] = useState(false);
  const { playClick, playScore, playWin, playHit } = useSound();

  const initGame = useCallback(() => {
    const ls: Line[] = [];
    // Horizontal lines
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID - 1; c++) ls.push({ r, c, h: true, owner: 0 });
    // Vertical lines
    for (let r = 0; r < GRID - 1; r++) for (let c = 0; c < GRID; c++) ls.push({ r, c, h: false, owner: 0 });
    
    const bs: Box[] = [];
    for (let r = 0; r < GRID - 1; r++) for (let c = 0; c < GRID - 1; c++) bs.push({ r, c, owner: 0 });
    
    setLines(ls);
    setBoxes(bs);
    setCurrentPlayer(1);
    setP1Score(0);
    setP2Score(0);
    setMsg('🔴 Oyuncu 1 sırası');
  }, []);

  const start = useCallback(() => {
    initGame();
    setShowSetup(false);
    setGs('playing');
  }, [initGame]);

  
  
  const checkBox = useCallback((ls: Line[], r: number, c: number): boolean => {
    const top = ls.find(l => l.r === r && l.c === c && l.h);
    const bottom = ls.find(l => l.r === r + 1 && l.c === c && l.h);
    const left = ls.find(l => l.r === r && l.c === c && !l.h);
    const right = ls.find(l => l.r === r && l.c === c + 1 && !l.h);
    return !!(top?.owner && bottom?.owner && left?.owner && right?.owner);
  }, []);

  const clickLine = useCallback((lineIdx: number) => {
    if (gs !== 'playing' || thinking) return;
    const line = lines[lineIdx];
    if (line.owner !== 0) return;
    
    playClick();
    const newLines = lines.map((l, i) => i === lineIdx ? { ...l, owner: currentPlayer } : l);
    setLines(newLines);
    
    // Check if any box completed
    let boxesCompleted = 0;
    const newBoxes = boxes.map(b => {
      if (b.owner !== 0) return b;
      if (checkBox(newLines, b.r, b.c)) {
        boxesCompleted++;
        return { ...b, owner: currentPlayer };
      }
      return b;
    });
    setBoxes(newBoxes);
    
    if (boxesCompleted > 0) {
      playScore();
      if (currentPlayer === 1) setP1Score(s => s + boxesCompleted);
      else setP2Score(s => s + boxesCompleted);
    }
    
    // Check game over
    const totalBoxes = (GRID - 1) * (GRID - 1);
    const filledBoxes = newBoxes.filter(b => b.owner !== 0).length;
    if (filledBoxes === totalBoxes) {
      const p1 = newBoxes.filter(b => b.owner === 1).length;
      const p2 = newBoxes.filter(b => b.owner === 2).length;
      if (p1 > p2) { playWin(); setMsg('🔴 Oyuncu 1 kazandı!'); setScore(p1 * 10); }
      else if (p2 > p1) { 
        if (mode === 'vsBot') { playHit(); setMsg('🤖 Bot kazandı!'); }
        else { playWin(); setMsg('🔵 Oyuncu 2 kazandı!'); }
        setScore(p2 * 10);
      }
      else { setMsg('Berabere!'); setScore((p1 + p2) * 5); }
      setTimeout(() => setGs('gameover'), 1500);
      return;
    }
    
    // Switch player or same player continues if box completed
    if (boxesCompleted === 0) {
      const next = currentPlayer === 1 ? 2 : 1;
      setCurrentPlayer(next as 1 | 2);
      setMsg(next === 1 ? '🔴 Oyuncu 1 sırası' : (mode === 'vsBot' ? '🤖 Bot düşünüyor...' : '🔵 Oyuncu 2 sırası'));
      
      if (mode === 'vsBot' && next === 2) {
        setThinking(true);
        setTimeout(() => botMove(newLines, newBoxes), 800);
      }
    } else {
      setMsg(currentPlayer === 1 ? '🔴 Tekrar sen!' : (mode === 'vsBot' ? '🤖 Bot tekrar!' : '🔵 Tekrar sen!'));
      if (mode === 'vsBot' && currentPlayer === 2) {
        setThinking(true);
        setTimeout(() => botMove(newLines, newBoxes), 600);
      }
    }
  }, [gs, lines, boxes, currentPlayer, mode, thinking, playClick, playScore, playWin, playHit, checkBox]);

  const botMove = useCallback((currentLines: Line[], currentBoxes: Box[]) => {
    const available = currentLines.map((l, i) => ({ ...l, idx: i })).filter(l => l.owner === 0);
    if (available.length === 0) { setThinking(false); return; }
    
    // Strategy: Find move that completes a box, otherwise random safe move
    let bestMove = available[0].idx;
    let foundGood = false;
    
    for (const line of available) {
      const testLines = currentLines.map((l, i) => i === line.idx ? { ...l, owner: 2 as const } : l);
      let completesBox = false;
      for (const b of currentBoxes) {
        if (b.owner === 0 && checkBox(testLines, b.r, b.c)) {
          completesBox = true;
          break;
        }
      }
      if (completesBox) { bestMove = line.idx; foundGood = true; break; }
    }
    
    if (!foundGood) {
      // Avoid moves that give opponent a box
      const safe = available.filter(line => {
        const testLines = currentLines.map((l, i) => i === line.idx ? { ...l, owner: 2 as const } : l);
        for (const b of currentBoxes) {
          if (b.owner !== 0) continue;
          const sides = [
            testLines.find(l => l.r === b.r && l.c === b.c && l.h),
            testLines.find(l => l.r === b.r + 1 && l.c === b.c && l.h),
            testLines.find(l => l.r === b.r && l.c === b.c && !l.h),
            testLines.find(l => l.r === b.r && l.c === b.c + 1 && !l.h),
          ];
          const filled = sides.filter(s => s?.owner !== 0).length;
          if (filled === 3) return false; // Would give opponent 4th side
        }
        return true;
      });
      bestMove = safe.length > 0 ? safe[Math.floor(Math.random() * safe.length)].idx : available[Math.floor(Math.random() * available.length)].idx;
    }
    
    setThinking(false);
    clickLine(bestMove);
  }, [checkBox, clickLine]);

  if (showSetup && gs === 'menu') {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border z-30 shrink-0 shadow-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            <span className="text-lg">←</span><span className="text-xs font-bold hidden sm:inline">MENÜ</span>
          </button>
          <div className="flex items-center gap-2"><span className="text-xl">🎯</span><span className="font-bold text-sm text-sky-600">Kare Kapmaca</span></div>
          <div />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="text-6xl">🎯</div>
          <h2 className="font-extrabold text-2xl text-sky-600">Kare Kapmaca</h2>
          <p className="text-sm text-text-secondary text-center max-w-xs">Noktalar arasına çizgi çizerek kareler oluştur. Kim daha çok kare kaparsa kazanır!</p>
          <div>
            <p className="text-sm font-bold text-center mb-3">Oyun modu seç:</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setMode('vsBot')}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'vsBot' ? 'bg-sky-500 text-white shadow-lg' : 'bg-white border-2 border-gray-200 hover:border-sky-300'}`}>
                🤖 Bot'a Karşı
              </button>
              <button onClick={() => setMode('1v1')}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${mode === '1v1' ? 'bg-sky-500 text-white shadow-lg' : 'bg-white border-2 border-gray-200 hover:border-sky-300'}`}>
                👥 1v1 (2 Kişi)
              </button>
            </div>
          </div>
          <button onClick={start} className="btn-primary text-base">▶ BAŞLA</button>
        </div>
      </div>
    );
  }

  const cellSize = 50;
  const dotSize = 12;
  const boardW = (GRID - 1) * cellSize + dotSize;

  return (
    <GameShell gameId="karekapmaca" score={p1Score * 10} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={() => { setShowSetup(true); setGs('menu'); }} onBack={() => { setShowSetup(true); onBack(); }}
      extraInfo={`🔴 ${p1Score} - ${p2Score} 🔵`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-3">
        <p className="text-sm font-bold text-center">{msg}</p>
        <div className="relative bg-white rounded-xl p-4 shadow-lg" style={{ width: boardW + 40, height: boardW + 40 }}>
          <svg width={boardW} height={boardW} style={{ marginLeft: 20, marginTop: 20 }}>
            {/* Boxes */}
            {boxes.map((b, i) => (
              <rect key={`box-${i}`} x={b.c * cellSize + dotSize / 2} y={b.r * cellSize + dotSize / 2} width={cellSize} height={cellSize}
                fill={b.owner === 1 ? 'rgba(239,68,68,0.3)' : b.owner === 2 ? 'rgba(59,130,246,0.3)' : 'transparent'} />
            ))}
            {/* Horizontal lines */}
            {lines.filter(l => l.h).map((l, i) => (
              <line key={`h-${i}`} x1={l.c * cellSize + dotSize / 2} y1={l.r * cellSize + dotSize / 2} x2={(l.c + 1) * cellSize + dotSize / 2} y2={l.r * cellSize + dotSize / 2}
                stroke={l.owner === 1 ? '#ef4444' : l.owner === 2 ? '#3b82f6' : '#e2e8f0'}
                strokeWidth={l.owner ? 4 : 2}
                strokeLinecap="round"
                style={{ cursor: l.owner ? 'default' : 'pointer' }}
                onClick={() => { const idx = lines.findIndex(ll => ll.r === l.r && ll.c === l.c && ll.h); if (idx >= 0) clickLine(idx); }} />
            ))}
            {/* Vertical lines */}
            {lines.filter(l => !l.h).map((l, i) => (
              <line key={`v-${i}`} x1={l.c * cellSize + dotSize / 2} y1={l.r * cellSize + dotSize / 2} x2={l.c * cellSize + dotSize / 2} y2={(l.r + 1) * cellSize + dotSize / 2}
                stroke={l.owner === 1 ? '#ef4444' : l.owner === 2 ? '#3b82f6' : '#e2e8f0'}
                strokeWidth={l.owner ? 4 : 2}
                strokeLinecap="round"
                style={{ cursor: l.owner ? 'default' : 'pointer' }}
                onClick={() => { const idx = lines.findIndex(ll => ll.r === l.r && ll.c === l.c && !ll.h); if (idx >= 0) clickLine(idx); }} />
            ))}
            {/* Dots */}
            {Array.from({ length: GRID }).map((_, r) =>
              Array.from({ length: GRID }).map((_, c) => (
                <circle key={`dot-${r}-${c}`} cx={c * cellSize + dotSize / 2} cy={r * cellSize + dotSize / 2} r={dotSize / 2} fill="#1e293b" />
              ))
            )}
          </svg>
        </div>
        <div className="flex gap-6 text-sm font-bold">
          <span className="text-red-500">🔴 Oyuncu 1: {p1Score}</span>
          <span className="text-blue-500">🔵 {mode === 'vsBot' ? 'Bot' : 'Oyuncu 2'}: {p2Score}</span>
        </div>
      </div>
    </GameShell>
  );
}
