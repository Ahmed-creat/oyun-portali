import { useState } from 'react';
import { GameShell } from '../components/GameShell';
import { GameState } from '../types';

type Cell = 'R' | 'Y' | null;

export function ConnectFourGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [board, setBoard] = useState<Cell[][]>(Array.from({ length: 6 }, () => Array(7).fill(null)));
  const [turn, setTurn] = useState<'R' | 'Y'>('R');
  const [message, setMessage] = useState<string>('');

  const startGame = () => {
    setBoard(Array.from({ length: 6 }, () => Array(7).fill(null)));
    setTurn('R');
    setMessage('Oyun başladı! Kırmızı pulunuzu düşürün.');
    setGameState('playing');
  };

  const checkWin = (b: Cell[][], p: Cell): boolean => {
    // Horizontal
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === p && b[r][c + 1] === p && b[r][c + 2] === p && b[r][c + 3] === p) return true;
      }
    }
    // Vertical
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        if (b[r][c] === p && b[r + 1][c] === p && b[r + 2][c] === p && b[r + 3][c] === p) return true;
      }
    }
    // Diagonal /
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === p && b[r - 1][c + 1] === p && b[r - 2][c + 2] === p && b[r - 3][c + 3] === p) return true;
      }
    }
    // Diagonal \
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === p && b[r + 1][c + 1] === p && b[r + 2][c + 2] === p && b[r + 3][c + 3] === p) return true;
      }
    }
    return false;
  };

  const dropPiece = (col: number) => {
    if (gameState !== 'playing' || turn !== 'R') return;

    // Find lowest available row
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (!board[r][col]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; // Column full

    const newBoard = board.map(row => [...row]);
    newBoard[targetRow][col] = 'R';
    setBoard(newBoard);

    if (checkWin(newBoard, 'R')) {
      setMessage('Tebrikler! 4\'lü Dizdiniz ve KAZANDINIZ! 🎉');
      setGameState('gameover');
      return;
    }

    setTurn('Y');
    setMessage('Sıra Sarı Botta...');
    setTimeout(() => aiTurn(newBoard), 700);
  };

  const aiTurn = (currentBoard: Cell[][]) => {
    // Find valid columns
    const validCols = [];
    for (let c = 0; c < 7; c++) {
      if (!currentBoard[0][c]) validCols.push(c);
    }

    if (validCols.length === 0) return;

    const chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (!currentBoard[r][chosenCol]) {
        targetRow = r;
        break;
      }
    }

    const newBoard = currentBoard.map(row => [...row]);
    newBoard[targetRow][chosenCol] = 'Y';
    setBoard(newBoard);

    if (checkWin(newBoard, 'Y')) {
      setMessage('Sarı Bot Kazandı!');
      setGameState('gameover');
      return;
    }

    setTurn('R');
    setMessage('Sıra Sizde (Kırmızı)');
  };

  return (
    <GameShell
      gameId="connectfour"
      score={100}
      gameState={gameState}
      onStart={startGame}
      onPause={() => setGameState('paused')}
      onResume={() => setGameState('playing')}
      onRestart={startGame}
      onBack={onBack}
    >
      <div className="flex flex-col items-center justify-between min-h-full p-4 bg-slate-900 text-slate-100 select-none">
        {gameState === 'playing' && (
          <div className="flex flex-col items-center max-w-md w-full gap-3">
            <div className="bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300">
              {message}
            </div>

            {/* Board Grid */}
            <div className="bg-blue-600 border-4 border-blue-800 p-3 rounded-2xl shadow-2xl grid grid-cols-7 gap-2 w-full aspect-[7/6]">
              {Array.from({ length: 7 }).map((_, c) => (
                <button
                  key={c}
                  onClick={() => dropPiece(c)}
                  className="flex flex-col justify-between gap-2 h-full hover:bg-blue-500/30 p-1 rounded-xl transition-colors cursor-pointer"
                >
                  {Array.from({ length: 6 }).map((_, r) => {
                    const cell = board[r][c];
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-full aspect-square rounded-full border-2 transition-all shadow-inner ${
                          cell === 'R'
                            ? 'bg-rose-500 border-rose-700 shadow-rose-900/50'
                            : cell === 'Y'
                            ? 'bg-amber-400 border-amber-600 shadow-amber-800/50'
                            : 'bg-slate-900/80 border-blue-700'
                        }`}
                      />
                    );
                  })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
