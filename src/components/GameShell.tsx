import { useState, useEffect, useRef, ReactNode } from 'react';
import { GameState, GameId, GAMES } from '../types';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface Props {
  gameId: GameId;
  score: number;
  gameState: GameState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onBack: () => void;
  children: ReactNode;
  extraInfo?: string;
  hideScore?: boolean;
}

export function GameShell({ gameId, score, gameState, onStart, onPause, onResume, onRestart, onBack, children, extraInfo, hideScore }: Props) {
  const game = GAMES.find(g => g.id === gameId)!;
  const { entries, addEntry, getHighScore } = useLeaderboard(gameId);
  const [showLB, setShowLB] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const savedRef = useRef(false);
  const highScore = getHighScore();

  useEffect(() => {
    if (gameState === 'gameover' && score > 0 && !savedRef.current) { savedRef.current = true; addEntry(score); }
    if (gameState === 'playing') savedRef.current = false;
  }, [gameState, score, addEntry]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (gameState === 'playing') onPause(); else if (gameState === 'paused') onResume(); }
      if (e.key === 'Enter' || e.key === ' ') {
        if (gameState === 'menu' && !showHelp && !showLB) { e.preventDefault(); onStart(); }
        else if (gameState === 'gameover' && !showHelp && !showLB) { e.preventDefault(); onRestart(); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [gameState, onStart, onPause, onResume, onRestart, showHelp, showLB]);

  return (
    <div className="fixed inset-0 flex flex-col bg-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border z-30 shrink-0 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
          <span className="text-lg">←</span>
          <span className="text-xs font-bold hidden sm:inline">MENÜ</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{game.icon}</span>
          <span className="font-bold text-sm" style={{ color: game.color }}>{game.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {extraInfo && <span className="text-[11px] text-text-secondary font-semibold">{extraInfo}</span>}
          {!hideScore && (
            <div className="text-right">
              <div className="font-extrabold text-sm" style={{ color: game.color }}>{score.toLocaleString('tr-TR')}</div>
              <div className="text-[10px] text-text-secondary">En: {highScore.toLocaleString('tr-TR')}</div>
            </div>
          )}
          <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold text-text-secondary transition-colors">?</button>
          {gameState === 'playing' && (
            <button onClick={onPause} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm transition-colors">⏸</button>
          )}
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 relative overflow-hidden">
        {children}

        {/* Start */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/95 z-20 animate-pop">
            <div className="text-7xl mb-4">{game.icon}</div>
            <h2 className="font-extrabold text-2xl sm:text-3xl mb-1" style={{ color: game.color }}>{game.name}</h2>
            <p className="text-text-secondary text-sm mb-6">En yüksek skor: {highScore.toLocaleString('tr-TR')}</p>
            <button onClick={onStart} className="btn-primary text-base mb-3">▶ OYNA</button>
            <button onClick={() => setShowLB(true)} className="btn-secondary text-xs mb-1">🏆 Skor Tablosu</button>
            <p className="text-text-secondary text-xs mt-4">ENTER ile başla</p>
          </div>
        )}

        {/* Pause */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 z-20 animate-pop">
            <h2 className="font-extrabold text-2xl mb-1" style={{ color: game.color }}>⏸ DURAKLATILDI</h2>
            <p className="text-text-secondary text-sm mb-6">Skor: {score.toLocaleString('tr-TR')}</p>
            <button onClick={onResume} className="btn-primary mb-2">▶ DEVAM ET</button>
            <button onClick={onRestart} className="btn-secondary text-xs mb-1">🔄 Yeniden Başla</button>
            <button onClick={onBack} className="btn-secondary text-xs">🏠 Ana Menü</button>
            <p className="text-text-secondary text-xs mt-4">ESC ile devam et</p>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 z-20 animate-pop">
            <h2 className="font-extrabold text-2xl mb-1 text-danger">OYUN BİTTİ</h2>
            {score > 0 && score >= getHighScore() && (
              <p className="text-sm font-bold text-warning mb-1 animate-bounce-in">⭐ YENİ REKOR! ⭐</p>
            )}
            <p className="font-extrabold text-2xl mb-1" style={{ color: game.color }}>{score.toLocaleString('tr-TR')}</p>
            <p className="text-text-secondary text-xs mb-6">En iyi: {getHighScore().toLocaleString('tr-TR')}</p>
            <button onClick={onRestart} className="btn-primary mb-2">🔄 TEKRAR OYNA</button>
            <button onClick={() => setShowLB(true)} className="btn-secondary text-xs mb-1">🏆 Skor Tablosu</button>
            <button onClick={onBack} className="btn-secondary text-xs">🏠 Ana Menü</button>
            <p className="text-text-secondary text-xs mt-4">ENTER ile tekrar</p>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-pop" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-4xl">{game.icon}</span>
              <h3 className="font-extrabold text-lg mt-2" style={{ color: game.color }}>Nasıl Oynanır?</h3>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed text-center">{game.howToPlay}</p>
            <button onClick={() => setShowHelp(false)} className="btn-primary w-full mt-5 text-sm">Anladım! 👍</button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLB && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setShowLB(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl animate-pop" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg mb-4 text-center" style={{ color: game.color }}>🏆 Skor Tablosu</h3>
            {entries.length === 0 ? <p className="text-text-secondary text-center text-sm">Henüz skor yok!</p> : (
              <div className="space-y-1.5">
                {entries.slice(0, 10).map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: i < 3 ? `${game.color}10` : 'transparent' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm w-6">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
                      <span className="text-sm font-semibold">{e.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: game.color }}>{e.score.toLocaleString('tr-TR')}</span>
                      <span className="text-[10px] text-text-secondary">{e.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowLB(false)} className="btn-primary w-full mt-4 text-sm">Kapat</button>
          </div>
        </div>
      )}
    </div>
  );
}
