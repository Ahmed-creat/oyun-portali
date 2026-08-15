import { useState, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

type Cell = 'X' | 'O' | null;
type Board = Cell[];
type Mode = '1v1' | 'vsBot';

const WL = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function chk(b: Board): { w: Cell; l: number[] | null } {
  for (const l of WL) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { w: b[l[0]], l };
  return { w: null, l: null };
}

function mm(b: Board, isMax: boolean): number {
  const { w } = chk(b);
  if (w === 'O') return 10;
  if (w === 'X') return -10;
  if (b.every(c => c !== null)) return 0;
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = 'O'; best = Math.max(best, mm(b, false)); b[i] = null; }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = 'X'; best = Math.min(best, mm(b, true)); b[i] = null; }
    return best;
  }
}

function aiMv(b: Board): number {
  if (Math.random() < 0.15) {
    const e = b.map((c, i) => c === null ? i : -1).filter(i => i >= 0);
    return e[Math.floor(Math.random() * e.length)];
  }
  let bs = -Infinity, bm = -1;
  for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = 'O'; const s = mm(b, false); b[i] = null; if (s > bs) { bs = s; bm = i; } }
  return bm;
}

export function TicTacToeGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [msg, setMsg] = useState('');
  const [wins, setWins] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [mode, setMode] = useState<Mode>('vsBot');
  const [showSetup, setShowSetup] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const conRef = useRef<HTMLDivElement>(null);
  const { playHit, playClick, playWin } = useSound();

  const start = useCallback(() => {
    setBoard(Array(9).fill(null));
    setWinLine(null);
    setMsg(mode === 'vsBot' ? 'Senin sıran (X)!' : 'X oyuncusu başlıyor!');
    setAiThinking(false);
    setCurrentPlayer('X');
    setShowSetup(false);
    setGs('playing');
  }, [mode]);

  const checkEnd = useCallback((newBoard: Board, _player: 'X' | 'O') => {
    const { w, l } = chk(newBoard);
    if (w) {
      if (mode === 'vsBot') {
        if (w === 'X') {
          playWin(); setWinLine(l); setMsg('Kazandın! 🎉');
          setWins(ww => ww + 1); setScore(s => s + 100);
          if (conRef.current) {
            const r = conRef.current.getBoundingClientRect();
            particleEmitter.emit(r.left + r.width / 2, r.top + r.height / 2, 12, '#3b82f6', '+100');
          }
        } else {
          playHit(); setWinLine(l); setMsg('Yapay zeka kazandı! 💀');
        }
      } else {
        playWin(); setWinLine(l); setMsg(`${w} oyuncusu kazandı! 🎉`);
        setScore(s => s + 50);
      }
      setTimeout(() => setGs('gameover'), 1500);
      return true;
    }
    if (newBoard.every(c => c !== null)) {
      setMsg('Berabere!');
      setScore(s => s + 25);
      setTimeout(() => setGs('gameover'), 1500);
      return true;
    }
    return false;
  }, [mode, playWin, playHit]);

  const click = useCallback((idx: number) => {
    if (gs !== 'playing' || board[idx] || winLine || aiThinking) return;
    playClick();
    
    const nb = [...board];
    nb[idx] = currentPlayer;
    setBoard(nb);
    
    if (checkEnd(nb, currentPlayer)) return;
    
    if (mode === 'vsBot') {
      setMsg('Yapay zeka düşünüyor...');
      setAiThinking(true);
      setTimeout(() => {
        const ai = aiMv([...nb]);
        nb[ai] = 'O';
        setBoard([...nb]);
        setAiThinking(false);
        if (!checkEnd(nb, 'O')) {
          setMsg('Senin sıran (X)!');
        }
      }, 2000);
    } else {
      const next = currentPlayer === 'X' ? 'O' : 'X';
      setCurrentPlayer(next);
      setMsg(`${next} oyuncusu sırası!`);
    }
  }, [gs, board, winLine, aiThinking, currentPlayer, mode, playClick, checkEnd]);

  if (showSetup && gs === 'menu') {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border z-30 shrink-0 shadow-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            <span className="text-lg">←</span><span className="text-xs font-bold hidden sm:inline">MENÜ</span>
          </button>
          <div className="flex items-center gap-2"><span className="text-xl">⭕</span><span className="font-bold text-sm text-blue-600">XOX</span></div>
          <div />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="text-6xl">⭕</div>
          <h2 className="font-extrabold text-2xl text-blue-600">XOX</h2>
          <div>
            <p className="text-sm font-bold text-center mb-3">Oyun modu seç:</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setMode('vsBot')}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${mode === 'vsBot' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white border-2 border-gray-200 hover:border-blue-300'}`}>
                🤖 Bot'a Karşı
              </button>
              <button onClick={() => setMode('1v1')}
                className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${mode === '1v1' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white border-2 border-gray-200 hover:border-blue-300'}`}>
                👥 1v1 (2 Kişi)
              </button>
            </div>
          </div>
          <button onClick={start} className="btn-primary text-base">▶ BAŞLA</button>
        </div>
      </div>
    );
  }

  return (
    <GameShell gameId="tictactoe" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={() => { setShowSetup(true); setGs('menu'); }} onBack={() => { setShowSetup(true); onBack(); }} extraInfo={mode === 'vsBot' ? `Galibiyet: ${wins}` : undefined}>
      <div ref={conRef} className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <p className="text-sm font-bold text-info mb-4 animate-slide-up">{msg}</p>
        {aiThinking && <div className="mb-2 text-xs text-text-secondary animate-pulse">🤔 Düşünüyor...</div>}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
          {board.map((cell, i) => (
            <button key={i} onClick={() => click(i)}
              className={`aspect-square rounded-xl text-4xl sm:text-5xl font-bold flex items-center justify-center transition-all duration-200 shadow-sm
                ${winLine?.includes(i) ? 'animate-pulse scale-105' : ''}
                ${cell ? '' : 'hover:bg-blue-50 active:scale-95 cursor-pointer'}
                ${cell === 'X' ? 'text-blue-500' : 'text-red-500'}`}
              style={{ backgroundColor: winLine?.includes(i) ? 'rgba(59,130,246,0.1)' : 'white', border: `2px solid ${winLine?.includes(i) ? '#3b82f6' : '#e2e8f0'}` }}>
              {cell && <span className="animate-pop">{cell}</span>}
            </button>
          ))}
        </div>
        {mode === '1v1' && gs === 'playing' && (
          <p className="mt-4 text-sm font-bold" style={{ color: currentPlayer === 'X' ? '#3b82f6' : '#ef4444' }}>
            Sıra: {currentPlayer}
          </p>
        )}
      </div>
    </GameShell>
  );
}
