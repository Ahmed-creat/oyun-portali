import { useState } from 'react';
import { GameShell } from '../components/GameShell';
import { GameState } from '../types';

export function MangalaGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [vsAI, setVsAI] = useState(true);
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Player 1 (p1) is pits 0-5, treasury is 6.
  // Player 2 (p2) is pits 7-12, treasury is 13.
  const [pits, setPits] = useState<number[]>([4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [message, setMessage] = useState<string>('Hamle sırası Sizde (Oyuncu 1)');

  const startGame = (aiMode: boolean = true) => {
    setVsAI(aiMode);
    setPits([4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]);
    setTurn(1);
    setMessage('Oyun Başladı! Oyuncu 1 hamle yapsın.');
    setGameState('playing');
  };

  const checkGameOver = (currentPits: number[]): boolean => {
    const p1PitsEmpty = currentPits.slice(0, 6).every(p => p === 0);
    const p2PitsEmpty = currentPits.slice(7, 13).every(p => p === 0);

    if (p1PitsEmpty || p2PitsEmpty) {
      const finalPits = [...currentPits];
      if (p1PitsEmpty) {
        // Player 1 empty, gathers all remaining stones on Player 2 side
        let sum = 0;
        for (let i = 7; i < 13; i++) {
          sum += finalPits[i];
          finalPits[i] = 0;
        }
        finalPits[6] += sum;
      } else {
        // Player 2 empty, gathers all remaining stones on Player 1 side
        let sum = 0;
        for (let i = 0; i < 6; i++) {
          sum += finalPits[i];
          finalPits[i] = 0;
        }
        finalPits[13] += sum;
      }
      setPits(finalPits);
      
      const p1Score = finalPits[6];
      const p2Score = finalPits[13];
      if (p1Score > p2Score) {
        setMessage(`Tebrikler! Oyuncu 1 kazandı (${p1Score} - ${p2Score})`);
      } else if (p2Score > p1Score) {
        setMessage(`Oyuncu 2 (veya Yapay Zeka) kazandı (${p2Score} - ${p1Score})`);
      } else {
        setMessage(`Berabere! (${p1Score} - ${p2Score})`);
      }
      setGameState('gameover');
      return true;
    }
    return false;
  };

  const playTurn = (pitIndex: number, isAi: boolean = false) => {
    if (gameState !== 'playing') return;
    if (!isAi && vsAI && turn === 2) return;

    // Validate valid pit selection
    if (turn === 1 && (pitIndex < 0 || pitIndex > 5)) return;
    if (turn === 2 && (pitIndex < 7 || pitIndex > 12)) return;
    if (pits[pitIndex] === 0) return;

    const newPits = [...pits];
    let stones = newPits[pitIndex];
    newPits[pitIndex] = 0;

    let curr = pitIndex;

    if (stones === 1) {
      curr = (curr + 1) % 14;
      newPits[curr]++;
    } else {
      newPits[pitIndex] = 1;
      stones--;
      while (stones > 0) {
        curr = (curr + 1) % 14;
        // Skip opponent treasury
        if (turn === 1 && curr === 13) continue;
        if (turn === 2 && curr === 6) continue;

        newPits[curr]++;
        stones--;
      }
    }

    let extraTurn = false;

    // Rule 1: Last stone in own treasury grants another turn
    if (turn === 1 && curr === 6) {
      extraTurn = true;
    } else if (turn === 2 && curr === 13) {
      extraTurn = true;
    }

    // Rule 2: Last stone in opponent pit makes it even -> capture all
    if (turn === 1 && curr >= 7 && curr <= 12 && newPits[curr] % 2 === 0) {
      newPits[6] += newPits[curr];
      newPits[curr] = 0;
    } else if (turn === 2 && curr >= 0 && curr <= 5 && newPits[curr] % 2 === 0) {
      newPits[13] += newPits[curr];
      newPits[curr] = 0;
    }

    // Rule 3: Last stone in own empty pit captures opposite pit stones
    if (turn === 1 && curr >= 0 && curr <= 5 && newPits[curr] === 1) {
      const opposite = 12 - curr;
      if (newPits[opposite] > 0) {
        newPits[6] += newPits[opposite] + 1;
        newPits[opposite] = 0;
        newPits[curr] = 0;
      }
    } else if (turn === 2 && curr >= 7 && curr <= 12 && newPits[curr] === 1) {
      const opposite = 12 - curr;
      if (newPits[opposite] > 0) {
        newPits[13] += newPits[opposite] + 1;
        newPits[opposite] = 0;
        newPits[curr] = 0;
      }
    }

    setPits(newPits);

    if (checkGameOver(newPits)) return;

    if (extraTurn) {
      setMessage(`${turn === 1 ? 'Oyuncu 1' : 'Oyuncu 2'} Hazineye ulaştı! Tekrar hamle hakkı kazanıldı.`);
      if (turn === 2 && vsAI) {
        setTimeout(() => triggerAiMove(newPits), 800);
      }
    } else {
      const nextTurn = turn === 1 ? 2 : 1;
      setTurn(nextTurn);
      setMessage(`Sıra ${nextTurn === 1 ? 'Oyuncu 1\'de' : vsAI ? 'Yapay Zekada' : 'Oyuncu 2\'de'}`);
      if (nextTurn === 2 && vsAI) {
        setTimeout(() => triggerAiMove(newPits), 800);
      }
    }
  };

  const triggerAiMove = (currentPits: number[]) => {
    const validMoves = [7, 8, 9, 10, 11, 12].filter(idx => currentPits[idx] > 0);
    if (validMoves.length === 0) return;

    let selectedMove = validMoves[0];
    if (aiLevel === 'easy') {
      selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
      // Find move that lands in treasury
      const treasuryLand = validMoves.find(m => (m + currentPits[m]) % 14 === 13);
      if (treasuryLand) {
        selectedMove = treasuryLand;
      } else {
        selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      }
    }
    playTurn(selectedMove, true);
  };

  return (
    <GameShell
      gameId="mangala"
      score={pits[6]}
      gameState={gameState}
      onStart={() => startGame(true)}
      onPause={() => setGameState('paused')}
      onResume={() => setGameState('playing')}
      onRestart={() => startGame(vsAI)}
      onBack={onBack}
    >
      <div className="flex flex-col items-center justify-center min-h-full p-4 bg-amber-950 text-amber-100 select-none">
        {/* Game Mode Picker on Menu */}
        {gameState === 'menu' && (
          <div className="flex flex-col items-center gap-4 bg-amber-900/80 p-6 rounded-2xl border border-amber-600 shadow-2xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold text-amber-300">Türk Mangalası</h2>
            <p className="text-xs text-amber-200/80">Oyun Modunu Seçin:</p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setAiLevel('easy')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold border ${aiLevel === 'easy' ? 'bg-amber-600 border-amber-300' : 'bg-amber-900 border-amber-700'}`}
              >
                Kolay Bot
              </button>
              <button
                onClick={() => setAiLevel('medium')}
                className={`flex-1 py-2 text-xs rounded-xl font-bold border ${aiLevel === 'medium' ? 'bg-amber-600 border-amber-300' : 'bg-amber-900 border-amber-700'}`}
              >
                Orta Bot
              </button>
            </div>
            <button
              onClick={() => startGame(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-700 font-bold rounded-xl shadow-lg hover:brightness-110"
            >
              🤖 Bot'a Karşı Oyna
            </button>
            <button
              onClick={() => startGame(false)}
              className="w-full py-2.5 bg-amber-800/80 hover:bg-amber-800 font-semibold text-xs rounded-xl border border-amber-600"
            >
              👥 2 Kişilik (Aynı Cihaz)
            </button>
          </div>
        )}

        {/* Playing Board */}
        {gameState === 'playing' && (
          <div className="flex flex-col items-center max-w-3xl w-full gap-4">
            <div className="bg-amber-900/90 border-2 border-amber-600 px-4 py-2 rounded-xl text-center shadow-md">
              <p className="text-sm font-bold text-amber-200">{message}</p>
            </div>

            {/* Board */}
            <div className="relative bg-gradient-to-b from-amber-900 to-amber-950 border-4 border-amber-700 rounded-3xl p-4 sm:p-6 shadow-2xl w-full max-w-2xl">
              <div className="grid grid-cols-8 gap-2 sm:gap-4 items-center">
                {/* Player 2 Treasury (Index 13) */}
                <div className="col-span-1 bg-amber-950 border-2 border-amber-600 rounded-2xl h-48 sm:h-64 flex flex-col items-center justify-between py-4 shadow-inner">
                  <span className="text-xs font-bold text-amber-400">P2 Hazine</span>
                  <div className="text-2xl sm:text-4xl font-extrabold text-amber-200">{pits[13]}</div>
                  <span className="text-xs text-amber-500">🧱</span>
                </div>

                {/* Middle Pits Grid */}
                <div className="col-span-6 flex flex-col gap-3 sm:gap-6">
                  {/* Player 2 Pits (Top Row: 12 down to 7) */}
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
                    {[12, 11, 10, 9, 8, 7].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => playTurn(idx)}
                        disabled={turn !== 2 || vsAI}
                        className={`aspect-square rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                          turn === 2 && pits[idx] > 0 && !vsAI
                            ? 'bg-amber-800 border-amber-400 hover:scale-105 cursor-pointer shadow-lg'
                            : 'bg-amber-950/80 border-amber-800 opacity-90'
                        }`}
                      >
                        <span className="text-xs sm:text-base font-extrabold text-amber-300">{pits[idx]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Player 1 Pits (Bottom Row: 0 up to 5) */}
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => playTurn(idx)}
                        disabled={turn !== 1}
                        className={`aspect-square rounded-full flex flex-col items-center justify-center border-2 transition-all ${
                          turn === 1 && pits[idx] > 0
                            ? 'bg-amber-800 border-amber-400 hover:scale-105 cursor-pointer shadow-lg'
                            : 'bg-amber-950/80 border-amber-800 opacity-90'
                        }`}
                      >
                        <span className="text-xs sm:text-base font-extrabold text-amber-300">{pits[idx]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player 1 Treasury (Index 6) */}
                <div className="col-span-1 bg-amber-950 border-2 border-amber-600 rounded-2xl h-48 sm:h-64 flex flex-col items-center justify-between py-4 shadow-inner">
                  <span className="text-xs font-bold text-amber-400">P1 Hazine</span>
                  <div className="text-2xl sm:text-4xl font-extrabold text-amber-200">{pits[6]}</div>
                  <span className="text-xs text-amber-500">🧱</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
