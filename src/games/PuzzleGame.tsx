import { useState, useCallback } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';

const IMAGES = [
  { emoji: '🌅', name: 'Gün Batımı', colors: ['#ff7e5f', '#feb47b', '#ffd194'] },
  { emoji: '🏔️', name: 'Dağ', colors: ['#667db6', '#0082c8', '#667db6'] },
  { emoji: '🌊', name: 'Okyanus', colors: ['#2193b0', '#6dd5ed', '#2193b0'] },
  { emoji: '🌲', name: 'Orman', colors: ['#134e5e', '#71b280', '#134e5e'] },
  { emoji: '🌸', name: 'Sakura', colors: ['#ee9ca7', '#ffdde1', '#ee9ca7'] },
  { emoji: '🌙', name: 'Gece', colors: ['#0f0c29', '#302b63', '#24243e'] },
  { emoji: '🌈', name: 'Gökkuşağı', colors: ['#f12711', '#f5af19', '#f12711'] },
  { emoji: '🎨', name: 'Sanat', colors: ['#834d9b', '#d04ed6', '#834d9b'] },
  { emoji: '🐱', name: 'Kedi', colors: ['#f5af19', '#f12711', '#f5af19'] },
  { emoji: '🦋', name: 'Kelebek', colors: ['#667db6', '#0082c8', '#00d4ff'] },
  { emoji: '🌻', name: 'Ayçiçeği', colors: ['#f5af19', '#f12711', '#f5af19'] },
  { emoji: '🐬', name: 'Yunus', colors: ['#2193b0', '#6dd5ed', '#2193b0'] },
  { emoji: '🦁', name: 'Aslan', colors: ['#f5af19', '#834d9b', '#f5af19'] },
  { emoji: '🐼', name: 'Panda', colors: ['#1a1a2e', '#eee', '#1a1a2e'] },
  { emoji: '🦜', name: 'Papağan', colors: ['#11998e', '#38ef7d', '#11998e'] },
  { emoji: '🌍', name: 'Dünya', colors: ['#2193b0', '#38ef7d', '#2193b0'] },
  { emoji: '🚀', name: 'Roket', colors: ['#0f0c29', '#302b63', '#f5af19'] },
  { emoji: '🎸', name: 'Gitar', colors: ['#834d9b', '#d04ed6', '#f5af19'] },
  { emoji: '⚽', name: 'Futbol', colors: ['#134e5e', '#71b280', '#eee'] },
  { emoji: '🎮', name: 'Oyun', colors: ['#667db6', '#0082c8', '#00d4ff'] },
];

const GRID = 3;

interface Piece { id: number; currentPos: number; correctPos: number; }

export function PuzzleGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [imageIdx, setImageIdx] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [moves, setMoves] = useState(0);
  const [showSetup, setShowSetup] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const { playClick, playWin } = useSound();

  const initPuzzle = useCallback(() => {
    const ps: Piece[] = Array.from({ length: GRID * GRID }, (_, i) => ({ id: i, currentPos: i, correctPos: i }));
    // Shuffle
    for (let i = ps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ps[i].currentPos, ps[j].currentPos] = [ps[j].currentPos, ps[i].currentPos];
    }
    setPieces(ps);
    setMoves(0);
  }, []);

  const start = useCallback(() => {
    initPuzzle();
    setShowSetup(false);
    setScore(0);
    setGs('playing');
  }, [initPuzzle]);

  const handleDrop = useCallback((targetPos: number) => {
    if (gs !== 'playing' || dragging === null) return;
    
    const dragPiece = pieces.find(p => p.currentPos === dragging);
    const targetPiece = pieces.find(p => p.currentPos === targetPos);
    
    if (!dragPiece || !targetPiece || dragging === targetPos) {
      setDragging(null);
      return;
    }
    
    playClick();
    setMoves(m => m + 1);
    
    const newPieces = pieces.map(p => {
      if (p.id === dragPiece.id) return { ...p, currentPos: targetPos };
      if (p.id === targetPiece.id) return { ...p, currentPos: dragging };
      return p;
    });
    
    setPieces(newPieces);
    setDragging(null);
    
    // Check win
    if (newPieces.every(p => p.currentPos === p.correctPos)) {
      playWin();
      const pts = Math.max(100, 1000 - moves * 10);
      setScore(pts);
      setTimeout(() => setGs('gameover'), 1000);
    }
  }, [gs, dragging, pieces, moves, playClick, playWin]);

  const img = IMAGES[imageIdx];

  if (showSetup && gs === 'menu') {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border z-30 shrink-0 shadow-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            <span className="text-lg">←</span><span className="text-xs font-bold hidden sm:inline">MENÜ</span>
          </button>
          <div className="flex items-center gap-2"><span className="text-xl">🧩</span><span className="font-bold text-sm text-cyan-600">Yapboz</span></div>
          <div />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm font-bold text-center mb-4">Bir resim seç:</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-lg mx-auto">
            {IMAGES.map((im, i) => (
              <button key={i} onClick={() => { playClick(); setImageIdx(i); }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-3xl transition-all
                  ${imageIdx === i ? 'ring-4 ring-cyan-500 scale-105' : 'hover:scale-105'}`}
                style={{ background: `linear-gradient(135deg, ${im.colors[0]}, ${im.colors[1]}, ${im.colors[2]})` }}>
                <span>{im.emoji}</span>
                <span className="text-[8px] text-white/80 mt-1">{im.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <button onClick={start} className="btn-primary text-base">▶ BAŞLA</button>
          </div>
        </div>
      </div>
    );
  }

  const sortedPieces = [...pieces].sort((a, b) => a.currentPos - b.currentPos);

  return (
    <GameShell gameId="puzzle" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={() => { setShowSetup(true); setGs('menu'); }} onBack={() => { setShowSetup(true); onBack(); }} extraInfo={`Hamle: ${moves}`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{img.emoji}</span>
          <span className="font-bold text-lg">{img.name}</span>
        </div>
        <div className="grid gap-1 rounded-xl overflow-hidden shadow-lg p-1 bg-white" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
          {sortedPieces.map((piece) => {
            const row = Math.floor(piece.correctPos / GRID);
            const col = piece.correctPos % GRID;
            const isCorrect = piece.currentPos === piece.correctPos;
            
            return (
              <div
                key={piece.id}
                draggable
                onDragStart={() => setDragging(piece.currentPos)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(piece.currentPos)}
                onTouchStart={() => setDragging(piece.currentPos)}
                onTouchEnd={() => { if (dragging !== null && dragging !== piece.currentPos) handleDrop(piece.currentPos); else setDragging(null); }}
                className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center cursor-move transition-all
                  ${isCorrect ? 'ring-2 ring-green-400' : ''} ${dragging === piece.currentPos ? 'opacity-50 scale-95' : 'hover:scale-105'}`}
                style={{
                  background: `linear-gradient(${135 + col * 30}deg, ${img.colors[0]}, ${img.colors[1]}, ${img.colors[2]})`,
                  backgroundPosition: `${-col * 100}% ${-row * 100}%`,
                  backgroundSize: `${GRID * 100}% ${GRID * 100}%`,
                }}>
                <span className="text-4xl opacity-80" style={{ transform: `translate(${(col - 1) * -10}px, ${(row - 1) * -10}px)` }}>
                  {img.emoji}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-text-secondary">Parçaları sürükleyerek doğru yerine yerleştir</p>
      </div>
    </GameShell>
  );
}
