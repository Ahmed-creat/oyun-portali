import { useState, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

const ALL_EMOJIS = ['🎮','🎯','🎲','🎪','🎨','🎭','🎵','🎸','🚀','⭐','💎','🔥','🌈','🦄','🎁','🍕','🍦','🌸','🐶','🐱','🦋','🌺','🍀','🎈','🏆','⚽','🎹','🦊','🐼','🦁','🐸','🌻','🍩','🎂','🍭','🌙'];

interface Card { id: number; emoji: string; flipped: boolean; matched: boolean; }

function shuffleAndPick(count: number): string[] {
  const shuffled = [...ALL_EMOJIS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function mkCards(pairCount: number): Card[] {
  const emojis = shuffleAndPick(pairCount);
  const cards = [...emojis, ...emojis].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
  for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}

export function MemoryGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gridSize, setGridSize] = useState(4); // 4x4 default
  const [showSetup, setShowSetup] = useState(true);
  const lock = useRef(false);
  const conRef = useRef<HTMLDivElement>(null);
  const { playScore, playHit, playWin, playClick } = useSound();

  const start = useCallback(() => {
    const pairCount = (gridSize * gridSize) / 2;
    setCards(mkCards(pairCount));
    setFlipped([]); setMoves(0); setScore(0); setCombo(0);
    lock.current = false; setShowSetup(false); setGs('playing');
  }, [gridSize]);

  const click = useCallback((idx: number) => {
    if (gs !== 'playing' || lock.current) return;
    const c = cards[idx];
    if (c.flipped || c.matched) return;
    playClick();
    const nf = [...flipped, idx];
    setCards(p => p.map((c, i) => i === idx ? { ...c, flipped: true } : c));
    setFlipped(nf);
    
    if (nf.length === 2) {
      lock.current = true;
      setMoves(m => m + 1);
      const [a, b] = nf;
      
      if (cards[a].emoji === cards[idx].emoji) {
        setTimeout(() => {
          playScore();
          const nc = combo + 1;
          setCombo(nc);
          const pts = 100 * nc;
          setScore(s => s + pts);
          
          setCards(p => {
            const c = p.map((card, i) => i === a || i === b ? { ...card, matched: true } : card);
            if (c.every(x => x.matched)) {
              setScore(s => s + Math.max(0, 1000 - moves * 20));
              playWin();
              setTimeout(() => setGs('gameover'), 500);
            }
            return c;
          });
          
          if (conRef.current) {
            const r = conRef.current.getBoundingClientRect();
            const col = idx % gridSize;
            const row = Math.floor(idx / gridSize);
            particleEmitter.emit(r.left + col * (r.width / gridSize) + r.width / gridSize / 2, r.top + row * (r.height / gridSize) + r.height / gridSize / 2, 8, '#a855f7', `+${pts}`);
          }
          
          setFlipped([]);
          lock.current = false;
        }, 300);
      } else {
        setTimeout(() => {
          playHit();
          setCombo(0);
          setCards(p => p.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setFlipped([]);
          lock.current = false;
        }, 700);
      }
    }
  }, [gs, cards, flipped, combo, moves, gridSize, playScore, playHit, playClick, playWin]);

  if (showSetup && gs === 'menu') {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border z-30 shrink-0 shadow-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            <span className="text-lg">←</span><span className="text-xs font-bold hidden sm:inline">MENÜ</span>
          </button>
          <div className="flex items-center gap-2"><span className="text-xl">🧠</span><span className="font-bold text-sm text-purple-600">Hafıza Kartları</span></div>
          <div />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="text-6xl">🧠</div>
          <h2 className="font-extrabold text-2xl text-purple-600">Hafıza Kartları</h2>
          <div>
            <p className="text-sm font-bold text-center mb-3">Kart sayısını seç:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {[{s: 4, l: '16 Kart'}, {s: 6, l: '36 Kart'}].map(opt => (
                <button key={opt.s} onClick={() => setGridSize(opt.s)}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${gridSize === opt.s ? 'bg-purple-500 text-white shadow-lg' : 'bg-white border-2 border-gray-200 hover:border-purple-300'}`}>
                  {opt.l} ({opt.s}x{opt.s})
                </button>
              ))}
            </div>
          </div>
          <button onClick={start} className="btn-primary text-base">▶ BAŞLA</button>
        </div>
      </div>
    );
  }

  const cellSize = gridSize === 6 ? 'min(14vw, 10vh)' : 'min(20vw, 16vh)';

  return (
    <GameShell gameId="memory" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={() => { setShowSetup(true); setGs('menu'); }} onBack={() => { setShowSetup(true); onBack(); }} extraInfo={`Hamle: ${moves} | x${combo}`}>
      <div ref={conRef} className="absolute inset-0 flex items-center justify-center p-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellSize})` }}>
          {cards.map((c, i) => (
            <button key={c.id} onClick={() => click(i)}
              className={`rounded-xl text-xl sm:text-3xl flex items-center justify-center transition-all duration-300 shadow-sm
                ${c.matched ? 'scale-90 opacity-40' : 'hover:scale-105 active:scale-95'}
                ${c.flipped || c.matched ? 'bg-purple-50 border-2 border-purple-300' : 'bg-white border-2 border-gray-200 hover:border-purple-300 cursor-pointer'}`}
              style={{ width: cellSize, height: cellSize }}>
              {c.flipped || c.matched ? <span className="animate-pop">{c.emoji}</span> : <span className="text-gray-300 text-lg font-bold">?</span>}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
