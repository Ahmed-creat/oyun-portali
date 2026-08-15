import { useState } from 'react';
import { GameShell } from '../components/GameShell';
import { GameState } from '../types';

interface Position {
  r: number;
  c: number;
}

export function QuoridorGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [p1Pos, setP1Pos] = useState<Position>({ r: 8, c: 4 });
  const [p2Pos, setP2Pos] = useState<Position>({ r: 0, c: 4 });
  const [p1Walls, setP1Walls] = useState<number>(10);
  const [p2Walls, setP2Walls] = useState<number>(10);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [_, setPlacedWalls] = useState<{ r: number; c: number; dir: 'H' | 'V' }[]>([]);
  const [message, setMessage] = useState<string>('Oyuncu 1 hamle yapsın (Hedef: Üst Sıra)');

  const startGame = () => {
    setP1Pos({ r: 8, c: 4 });
    setP2Pos({ r: 0, c: 4 });
    setP1Walls(10);
    setP2Walls(10);
    setPlacedWalls([]);
    setTurn(1);
    setMessage('Oyun Başladı! Piyonunuzu hareket ettirin veya engel koyun.');
    setGameState('playing');
  };

  const movePawn = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    const current = turn === 1 ? p1Pos : p2Pos;

    // Check valid 1-step move
    const dr = Math.abs(current.r - r);
    const dc = Math.abs(current.c - c);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      if (turn === 1) {
        setP1Pos({ r, c });
        if (r === 0) {
          setMessage('Tebrikler! Oyuncu 1 Koridoru Geçti ve Kazandı! 🎉');
          setGameState('gameover');
          return;
        }
      } else {
        setP2Pos({ r, c });
        if (r === 8) {
          setMessage('Oyuncu 2 (Bot) Kazandı!');
          setGameState('gameover');
          return;
        }
      }

      const nextTurn = turn === 1 ? 2 : 1;
      setTurn(nextTurn);
      setMessage(`Sıra ${nextTurn === 1 ? 'Oyuncu 1\'de' : 'Oyuncu 2 (Bot)\'de'}`);
      if (nextTurn === 2) {
        setTimeout(aiMove, 800);
      }
    }
  };

  const aiMove = () => {
    if (gameState !== 'playing') return;
    // Simple AI moves pawn towards target row (row 8)
    const possibleMoves = [
      { r: p2Pos.r + 1, c: p2Pos.c },
      { r: p2Pos.r, c: p2Pos.c + 1 },
      { r: p2Pos.r, c: p2Pos.c - 1 },
      { r: p2Pos.r - 1, c: p2Pos.c }
    ].filter(m => m.r >= 0 && m.r < 9 && m.c >= 0 && m.c < 9);

    if (possibleMoves.length > 0) {
      const chosen = possibleMoves[0];
      setP2Pos(chosen);
      if (chosen.r === 8) {
        setMessage('Bot Kazandı!');
        setGameState('gameover');
        return;
      }
    }
    setTurn(1);
    setMessage('Sıra Sizde! (Oyuncu 1)');
  };

  return (
    <GameShell
      gameId="quoridor"
      score={100 - p1Walls * 5}
      gameState={gameState}
      onStart={startGame}
      onPause={() => setGameState('paused')}
      onResume={() => setGameState('playing')}
      onRestart={startGame}
      onBack={onBack}
    >
      <div className="flex flex-col items-center justify-between min-h-full p-4 bg-slate-950 text-slate-100 select-none">
        {gameState === 'playing' && (
          <div className="flex flex-col items-center max-w-lg w-full gap-3">
            <div className="bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300">
              {message}
            </div>

            {/* Walls info */}
            <div className="flex items-center justify-between w-full px-4 text-xs font-bold">
              <span className="text-rose-400">🤖 Bot Engelleri: {p2Walls}</span>
              <span className="text-emerald-400">👤 P1 Engelleri: {p1Walls}</span>
            </div>

            {/* 9x9 Board */}
            <div className="bg-slate-900 border-4 border-slate-700 p-2 rounded-2xl shadow-2xl grid grid-cols-9 gap-1.5 aspect-square w-full max-w-sm">
              {Array.from({ length: 9 }).map((_, r) =>
                Array.from({ length: 9 }).map((_, c) => {
                  const isP1 = p1Pos.r === r && p1Pos.c === c;
                  const isP2 = p2Pos.r === r && p2Pos.c === c;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => movePawn(r, c)}
                      className={`rounded-lg flex items-center justify-center font-black text-lg transition-all ${
                        isP1
                          ? 'bg-emerald-500 text-white shadow-lg scale-105'
                          : isP2
                          ? 'bg-rose-500 text-white shadow-lg scale-105'
                          : 'bg-slate-800 hover:bg-slate-700/80 border border-slate-700'
                      }`}
                    >
                      {isP1 ? '♟️' : isP2 ? '♟️' : ''}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
