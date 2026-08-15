import { useState } from 'react';
import { GameShell } from '../components/GameShell';
import { GameState } from '../types';

type PieceType = 'white' | 'white-dama' | 'black' | 'black-dama' | null;

export function TurkishCheckersGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [board, setBoard] = useState<PieceType[][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [turn, setTurn] = useState<'white' | 'black'>('white');
  const [message, setMessage] = useState<string>('');

  const initBoard = () => {
    let b: PieceType[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    // Black pieces in rows 1 and 2
    for (let r = 1; r <= 2; r++) {
      for (let c = 0; c < 8; c++) b[r][c] = 'black';
    }
    // White pieces in rows 5 and 6
    for (let r = 5; r <= 6; r++) {
      for (let c = 0; c < 8; c++) b[r][c] = 'white';
    }
    setBoard(b);
    setTurn('white');
    setMessage('Oyun başladı! Beyaz taşlar oynar.');
    setGameState('playing');
  };

  const handleSquareClick = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    const piece = board[r]?.[c];

    if (piece && ((turn === 'white' && piece.startsWith('white')) || (turn === 'black' && piece.startsWith('black')))) {
      setSelected({ r, c });
      return;
    }

    if (selected && !piece) {
      // Move logic
      const sr = selected.r;
      const sc = selected.c;
      const pieceType = board[sr][sc];

      
      const dc = Math.abs(c - sc);

      // Simple 1-step or jump move for standard pieces
      let valid = false;
      let captured: { r: number; c: number } | null = null;

      if (pieceType === 'white' && ((r === sr - 1 && c === sc) || (r === sr && dc === 1))) {
        valid = true;
      } else if (pieceType === 'black' && ((r === sr + 1 && c === sc) || (r === sr && dc === 1))) {
        valid = true;
      } else if (pieceType?.includes('dama') && (sr === r || sc === c)) {
        valid = true;
      }

      // Jump capture
      if (!valid) {
        if (pieceType === 'white' && r === sr - 2 && c === sc && board[sr - 1][sc]?.startsWith('black')) {
          valid = true;
          captured = { r: sr - 1, c: sc };
        } else if (pieceType === 'black' && r === sr + 2 && c === sc && board[sr + 1][sc]?.startsWith('white')) {
          valid = true;
          captured = { r: sr + 1, c: sc };
        } else if (dc === 2 && r === sr) {
          const midC = (c + sc) / 2;
          const oppColor = turn === 'white' ? 'black' : 'white';
          if (board[r][midC]?.startsWith(oppColor)) {
            valid = true;
            captured = { r, c: midC };
          }
        }
      }

      if (valid) {
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = pieceType;
        newBoard[sr][sc] = null;

        if (captured) {
          newBoard[captured.r][captured.c] = null;
        }

        // Dama promotion
        if (r === 0 && pieceType === 'white') newBoard[r][c] = 'white-dama';
        if (r === 7 && pieceType === 'black') newBoard[r][c] = 'black-dama';

        setBoard(newBoard);
        setSelected(null);
        const nextTurn = turn === 'white' ? 'black' : 'white';
        setTurn(nextTurn);
        setMessage(`Sıra ${nextTurn === 'white' ? 'Beyazda' : 'Siyahta (Bot)'}`);

        if (nextTurn === 'black') {
          setTimeout(() => aiTurn(newBoard), 800);
        }
      }
    }
  };

  const aiTurn = (currentBoard: PieceType[][]) => {
    // Basic AI move
    let moves: { sr: number; sc: number; r: number; c: number }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c]?.startsWith('black')) {
          if (r + 1 < 8 && !currentBoard[r + 1][c]) moves.push({ sr: r, sc: c, r: r + 1, c });
          if (c + 1 < 8 && !currentBoard[r][c + 1]) moves.push({ sr: r, sc: c, r, c: c + 1 });
          if (c - 1 >= 0 && !currentBoard[r][c - 1]) moves.push({ sr: r, sc: c, r, c: c - 1 });
        }
      }
    }

    if (moves.length > 0) {
      const m = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[m.r][m.c] = newBoard[m.sr][m.sc];
      newBoard[m.sr][m.sc] = null;
      if (m.r === 7) newBoard[m.r][m.c] = 'black-dama';
      setBoard(newBoard);
    }
    setTurn('white');
    setMessage('Sıra Sizde (Beyaz)');
  };

  return (
    <GameShell
      gameId="turkishcheckers"
      score={100}
      gameState={gameState}
      onStart={initBoard}
      onPause={() => setGameState('paused')}
      onResume={() => setGameState('playing')}
      onRestart={initBoard}
      onBack={onBack}
    >
      <div className="flex flex-col items-center justify-between min-h-full p-4 bg-slate-900 text-slate-100 select-none">
        {gameState === 'playing' && (
          <div className="flex flex-col items-center max-w-md w-full gap-3">
            <div className="bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300">
              {message}
            </div>

            <div className="bg-amber-950 border-4 border-amber-800 p-2 rounded-2xl shadow-2xl grid grid-cols-8 gap-1 aspect-square w-full">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isSelected = selected?.r === r && selected?.c === c;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`rounded-md flex items-center justify-center font-bold text-xl transition-all ${
                        (r + c) % 2 === 0 ? 'bg-amber-900/60' : 'bg-amber-800/80'
                      } ${isSelected ? 'ring-4 ring-amber-400 scale-95' : ''}`}
                    >
                      {cell?.startsWith('white') ? (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-900 border-2 border-slate-400 flex items-center justify-center font-black shadow-md">
                          {cell.includes('dama') ? '👑' : '⚪'}
                        </div>
                      ) : cell?.startsWith('black') ? (
                        <div className="w-7 h-7 rounded-full bg-slate-950 text-slate-100 border-2 border-slate-700 flex items-center justify-center font-black shadow-md">
                          {cell.includes('dama') ? '👑' : '⚫'}
                        </div>
                      ) : null}
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
