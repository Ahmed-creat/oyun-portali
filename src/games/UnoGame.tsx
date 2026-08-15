import { useState } from 'react';
import { GameShell } from '../components/GameShell';
import { GameState } from '../types';

type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export function UnoGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [topCard, setTopCard] = useState<Card | null>(null);
  const [currentColor, setCurrentColor] = useState<CardColor>('red');
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [message, setMessage] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [score, setScore] = useState<number>(0);

  const createDeck = (): Card[] => {
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
    const values: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
    let deck: Card[] = [];
    let idCounter = 1;

    for (const color of colors) {
      for (const val of values) {
        deck.push({ id: `card-${idCounter++}`, color, value: val });
        if (val !== '0') {
          deck.push({ id: `card-${idCounter++}`, color, value: val });
        }
      }
    }
    // Wild cards
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `card-${idCounter++}`, color: 'wild', value: 'wild' });
      deck.push({ id: `card-${idCounter++}`, color: 'wild', value: 'wild4' });
    }

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const startGame = () => {
    const deck = createDeck();
    const pHand = deck.splice(0, 7);
    const aHand = deck.splice(0, 7);

    let top = deck.pop()!;
    while (top.color === 'wild') {
      deck.unshift(top);
      top = deck.pop()!;
    }

    setPlayerHand(pHand);
    setAiHand(aHand);
    setDrawPile(deck);
    setTopCard(top);
    setCurrentColor(top.color);
    setTurn('player');
    setMessage('Sıra Sizde! Uygun bir kart seçin.');
    setScore(0);
    setGameState('playing');
  };

  const isCardPlayable = (card: Card): boolean => {
    if (!topCard) return false;
    if (card.color === 'wild') return true;
    return card.color === currentColor || card.value === topCard.value;
  };

  const playCard = (card: Card, isPlayer: boolean, chosenColor?: CardColor) => {
    if (isPlayer) {
      if (card.color === 'wild' && !chosenColor) {
        setPendingWildCard(card);
        setShowColorPicker(true);
        return;
      }
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    } else {
      setAiHand(prev => prev.filter(c => c.id !== card.id));
    }

    setTopCard(card);
    const activeColor = card.color === 'wild' ? (chosenColor || 'red') : card.color;
    setCurrentColor(activeColor);

    // Check Win
    const remainingHand = isPlayer ? playerHand.length - 1 : aiHand.length - 1;
    if (remainingHand === 0) {
      if (isPlayer) {
        setScore(100);
        setMessage('Tebrikler! UNO Kazandınız! 🎉');
      } else {
        setMessage('Rakip Bot Kazandı!');
      }
      setGameState('gameover');
      return;
    }

    // Handle special effects
    let nextTurn: 'player' | 'ai' = isPlayer ? 'ai' : 'player';

    if (card.value === 'skip' || card.value === 'reverse') {
      nextTurn = isPlayer ? 'player' : 'ai';
      setMessage(`${isPlayer ? 'Siz' : 'Bot'} Pas kartı oynadı! Tekrar sıra sizde.`);
    } else if (card.value === 'draw2') {
      drawCards(nextTurn === 'player' ? 'player' : 'ai', 2);
      nextTurn = isPlayer ? 'player' : 'ai';
      setMessage(`${isPlayer ? 'Siz' : 'Bot'} +2 Kart oynadı! Rakip 2 kart çekti.`);
    } else if (card.value === 'wild4') {
      drawCards(nextTurn === 'player' ? 'player' : 'ai', 4);
      nextTurn = isPlayer ? 'player' : 'ai';
      setMessage(`${isPlayer ? 'Siz' : 'Bot'} +4 Joker oynadı! Rakip 4 kart çekti.`);
    } else {
      setMessage(`Sıra ${nextTurn === 'player' ? 'Sizde' : 'Bota geçti'}`);
    }

    setTurn(nextTurn);

    if (nextTurn === 'ai') {
      setTimeout(() => aiTurn(activeColor, card.value), 1000);
    }
  };

  const drawCards = (target: 'player' | 'ai', count: number) => {
    let currentDeck = [...drawPile];
    const drawn: Card[] = [];

    for (let i = 0; i < count; i++) {
      if (currentDeck.length === 0) {
        currentDeck = createDeck();
      }
      drawn.push(currentDeck.pop()!);
    }

    setDrawPile(currentDeck);
    if (target === 'player') {
      setPlayerHand(prev => [...prev, ...drawn]);
    } else {
      setAiHand(prev => [...prev, ...drawn]);
    }
  };

  const handlePlayerDraw = () => {
    if (turn !== 'player' || gameState !== 'playing') return;
    drawCards('player', 1);
    setMessage('Bir kart çektiniz. Sıra Bota geçti.');
    setTurn('ai');
    setTimeout(() => aiTurn(currentColor, topCard?.value || '0'), 1000);
  };

  const aiTurn = (activeColor: CardColor, topValue: CardValue) => {
    if (gameState !== 'playing') return;

    const playable = aiHand.filter(c => c.color === 'wild' || c.color === activeColor || c.value === topValue);

    if (playable.length > 0) {
      const chosen = playable[0];
      const aiColorChoice: CardColor = ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)] as CardColor;
      playCard(chosen, false, aiColorChoice);
    } else {
      drawCards('ai', 1);
      setMessage('Bot kart çekemediği için pas geçti. Sıra sizde!');
      setTurn('player');
    }
  };

  const getColorBg = (c: CardColor) => {
    switch (c) {
      case 'red': return 'bg-red-600 text-white';
      case 'blue': return 'bg-blue-600 text-white';
      case 'green': return 'bg-emerald-600 text-white';
      case 'yellow': return 'bg-amber-400 text-slate-900';
      default: return 'bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 text-white';
    }
  };

  return (
    <GameShell
      gameId="uno"
      score={score}
      gameState={gameState}
      onStart={startGame}
      onPause={() => setGameState('paused')}
      onResume={() => setGameState('playing')}
      onRestart={startGame}
      onBack={onBack}
    >
      <div className="flex flex-col items-center justify-between min-h-full p-4 bg-slate-900 text-white select-none">
        {gameState === 'playing' && (
          <div className="flex flex-col items-center w-full max-w-xl gap-4">
            {/* Message Bar */}
            <div className="bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-300">
              {message}
            </div>

            {/* AI Hand */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400 font-medium">🤖 Bot ({aiHand.length} Kart)</span>
              <div className="flex -space-x-4 overflow-x-auto p-2">
                {aiHand.map((_, i) => (
                  <div key={i} className="w-10 h-14 bg-gradient-to-br from-indigo-800 to-slate-900 border-2 border-indigo-400 rounded-lg shadow-md flex items-center justify-center font-black text-xs">
                    UNO
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Play Area */}
            <div className="flex items-center justify-center gap-8 py-4">
              {/* Draw Deck */}
              <button
                onClick={handlePlayerDraw}
                disabled={turn !== 'player'}
                className="w-16 h-24 bg-gradient-to-br from-indigo-700 to-purple-900 border-2 border-indigo-300 rounded-xl shadow-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-transform"
              >
                <span className="text-xs font-black">CEK</span>
                <span className="text-xs bg-indigo-500 px-1.5 rounded-full">{drawPile.length}</span>
              </button>

              {/* Discard Pile Top Card */}
              {topCard && (
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-16 h-24 ${getColorBg(currentColor)} border-2 border-white/80 rounded-xl shadow-2xl flex flex-col items-center justify-center font-black text-xl animate-pop`}>
                    {topCard.value === 'wild' ? '🌈' : topCard.value === 'wild4' ? '+4' : topCard.value}
                  </div>
                  <span className="text-[10px] text-slate-400">Aktif Renk: <strong className="capitalize">{currentColor}</strong></span>
                </div>
              )}
            </div>

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-1 w-full">
              <span className="text-xs text-slate-300 font-bold">
                {turn === 'player' ? '👉 SİZİN SIRANIZ' : 'Sıra Botta...'} ({playerHand.length} Kart)
              </span>
              <div className="flex -space-x-3 hover:space-x-1 transition-all overflow-x-auto max-w-full p-2">
                {playerHand.map((card) => {
                  const playable = isCardPlayable(card) && turn === 'player';
                  return (
                    <button
                      key={card.id}
                      onClick={() => playable && playCard(card, true)}
                      disabled={!playable}
                      className={`w-14 h-20 ${getColorBg(card.color)} border-2 border-white rounded-xl shadow-lg flex items-center justify-center font-black text-lg shrink-0 transition-transform ${
                        playable ? 'hover:-translate-y-3 hover:scale-110 cursor-pointer' : 'opacity-50 grayscale'
                      }`}
                    >
                      {card.value === 'wild' ? '🌈' : card.value === 'wild4' ? '+4' : card.value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Color Picker Modal */}
        {showColorPicker && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-600 text-center max-w-xs w-full shadow-2xl">
              <h3 className="font-bold text-lg mb-4 text-white">Yeni Rengi Seçin:</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setShowColorPicker(false);
                      if (pendingWildCard) {
                        playCard(pendingWildCard, true, c);
                        setPendingWildCard(null);
                      }
                    }}
                    className={`py-3 rounded-xl font-bold uppercase ${getColorBg(c)} hover:scale-105 transition-transform`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
