import { useState, useCallback, useEffect } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';

const COLORS = ['#ef4444', '#22c55e', '#eab308', '#3b82f6'];
const NAMES = ['Kırmızı', 'Yeşil', 'Sarı', 'Mavi'];
const START_POS = [0, 13, 26, 39]; // Starting positions on main track
const SAFE_ZONES = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe spots

interface Token { pos: number; home: boolean; finished: boolean; } // -1 = base, 0-51 = track, 52-56 = home path
interface Player { tokens: Token[]; color: string; name: string; isBot: boolean; }

function createPlayers(humanCount: number): Player[] {
  return [0, 1, 2, 3].map(i => ({
    tokens: [{ pos: -1, home: false, finished: false }, { pos: -1, home: false, finished: false }, { pos: -1, home: false, finished: false }, { pos: -1, home: false, finished: false }],
    color: COLORS[i],
    name: NAMES[i],
    isBot: i >= humanCount,
  }));
}

export function LudoGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [players, setPlayers] = useState<Player[]>([]);
  const [current, setCurrent] = useState(0);
  const [dice, setDice] = useState(0);
  const [rolled, setRolled] = useState(false);
  const [msg, setMsg] = useState('');
  const [humanCount, setHumanCount] = useState(1);
  const [winner, setWinner] = useState<number | null>(null);
  const [diceAnim, setDiceAnim] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const { playClick, playScore, playHit, playWin, playGameOver } = useSound();

  const start = useCallback(() => {
    setPlayers(createPlayers(humanCount));
    setCurrent(0);
    setDice(0);
    setRolled(false);
    setMsg(`${NAMES[0]} zar atsın!`);
    setWinner(null);
    setShowSetup(false);
    setGs('playing');
  }, [humanCount]);

  const checkWin = (ps: Player[]): number | null => {
    for (let i = 0; i < 4; i++) if (ps[i].tokens.every(t => t.finished)) return i;
    return null;
  };

  const getAbsolutePos = (playerIdx: number, pos: number): number => {
    if (pos < 0 || pos >= 52) return -1;
    return (START_POS[playerIdx] + pos) % 52;
  };

  const moveToken = useCallback((playerIdx: number, tokenIdx: number, diceVal: number, ps: Player[]): Player[] | null => {
    const np = ps.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) }));
    const token = np[playerIdx].tokens[tokenIdx];
    if (token.finished) return null;

    if (token.pos === -1) {
      if (diceVal !== 6) return null;
      token.pos = 0;
      playClick();
    } else {
      const newPos = token.pos + diceVal;
      if (newPos > 56) return null;
      if (newPos === 56) {
        token.finished = true;
        token.pos = newPos;
        playScore();
      } else if (newPos >= 52) {
        token.pos = newPos;
        playClick();
      } else {
        token.pos = newPos;
        const absPos = getAbsolutePos(playerIdx, newPos);
        // Capture check
        if (!SAFE_ZONES.includes(absPos)) {
          for (let pi = 0; pi < 4; pi++) {
            if (pi === playerIdx) continue;
            for (const ot of np[pi].tokens) {
              if (ot.pos >= 0 && ot.pos < 52 && getAbsolutePos(pi, ot.pos) === absPos) {
                ot.pos = -1;
                playHit();
              }
            }
          }
        }
        playClick();
      }
    }
    return np;
  }, [playClick, playScore, playHit]);

  const nextTurn = useCallback((ps: Player[], cur: number, diceVal: number) => {
    const w = checkWin(ps);
    if (w !== null) {
      setWinner(w);
      if (!ps[w].isBot) playWin();
      else playGameOver();
      setMsg(`${NAMES[w]} kazandı! 🎉`);
      setTimeout(() => setGs('gameover'), 2000);
      return;
    }
    const next = diceVal === 6 ? cur : (cur + 1) % 4;
    setCurrent(next);
    setRolled(false);
    setDice(0);
    setMsg(`${NAMES[next]} zar atsın!`);

    if (ps[next].isBot) {
      setTimeout(() => botTurn(ps, next), 800);
    }
  }, [playWin, playGameOver]);

  const rollDice = useCallback(() => {
    if (gs !== 'playing' || rolled || winner !== null) return;
    const p = players[current];
    if (p.isBot) return;

    setDiceAnim(true);
    playClick();
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDice(val);
      setRolled(true);
      setDiceAnim(false);

      const canMove = p.tokens.some((_, ti) => moveToken(current, ti, val, players) !== null);
      if (!canMove) {
        setMsg(`${NAMES[current]}: ${val} - hamle yok!`);
        setTimeout(() => nextTurn(players, current, val), 1000);
      } else {
        setMsg(`${NAMES[current]}: ${val} - taş seç!`);
      }
    }, 500);
  }, [gs, rolled, winner, players, current, moveToken, nextTurn, playClick]);

  const handleTokenClick = useCallback((tokenIdx: number) => {
    if (!rolled || players[current].isBot || winner !== null) return;
    const result = moveToken(current, tokenIdx, dice, players);
    if (!result) { playHit(); return; }
    setPlayers(result);
    setRolled(false);
    nextTurn(result, current, dice);
  }, [rolled, players, current, dice, winner, moveToken, nextTurn, playHit]);

  const botTurn = useCallback((ps: Player[], botIdx: number) => {
    if (winner !== null) return;
    setDiceAnim(true);
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDice(val);
      setRolled(true);
      setDiceAnim(false);

      let moved = false;
      for (let ti = 0; ti < 4; ti++) {
        const result = moveToken(botIdx, ti, val, ps);
        if (result) {
          setPlayers(result);
          setRolled(false);
          setTimeout(() => nextTurn(result, botIdx, val), 500);
          moved = true;
          break;
        }
      }
      if (!moved) {
        setMsg(`${NAMES[botIdx]}: ${val} - hamle yok!`);
        setTimeout(() => { setRolled(false); nextTurn(ps, botIdx, val); }, 800);
      }
    }, 500);
  }, [winner, moveToken, nextTurn]);

  // Bot auto-play
  useEffect(() => {
    if (gs === 'playing' && players.length > 0 && players[current]?.isBot && !rolled && !diceAnim && winner === null) {
      setTimeout(() => botTurn(players, current), 500);
    }
  }, [gs, current, players, rolled, diceAnim, winner, botTurn]);

  const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  if (showSetup && gs === 'menu') {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border z-30 shrink-0 shadow-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            <span className="text-lg">←</span><span className="text-xs font-bold hidden sm:inline">MENÜ</span>
          </button>
          <div className="flex items-center gap-2"><span className="text-xl">🎲</span><span className="font-bold text-sm text-red-600">Kızma Birader</span></div>
          <div />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="text-6xl">🎲</div>
          <h2 className="font-extrabold text-2xl text-red-600">Kızma Birader</h2>
          <div>
            <p className="text-sm font-bold text-center mb-3">Kaç kişi oynayacak?</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setHumanCount(n)}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${humanCount === n ? 'bg-red-500 text-white shadow-lg' : 'bg-white border-2 border-gray-200 hover:border-red-300'}`}>
                  {n} Kişi
                </button>
              ))}
            </div>
            <p className="text-xs text-text-secondary text-center mt-2">Seçilmeyenler bot olarak oynar</p>
          </div>
          <button onClick={start} className="btn-primary text-base">▶ BAŞLA</button>
        </div>
      </div>
    );
  }

  return (
    <GameShell gameId="ludo" score={0} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={() => { setShowSetup(true); setGs('menu'); }} onBack={() => { setShowSetup(true); onBack(); }} hideScore>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-2">
        <p className="text-sm font-bold" style={{ color: COLORS[current] }}>{msg}</p>

        {/* Simple board representation */}
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            {players.map((p, pi) => (
              <div key={pi} className={`rounded-lg p-3 border-2 ${current === pi ? 'shadow-md' : 'opacity-70'}`}
                style={{ borderColor: current === pi ? p.color : '#e2e8f0', backgroundColor: `${p.color}10` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{p.isBot ? '🤖' : '👤'}</span>
                  <span className="font-bold text-sm" style={{ color: p.color }}>{p.name}</span>
                </div>
                <div className="flex gap-2">
                  {p.tokens.map((t, ti) => (
                    <button key={ti}
                      onClick={() => pi === current && rolled && !p.isBot && handleTokenClick(ti)}
                      disabled={t.finished}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white transition-all
                        ${current === pi && rolled && !p.isBot ? 'hover:scale-125 cursor-pointer animate-pulse' : ''}
                        ${t.finished ? 'opacity-30' : ''}`}
                      style={{
                        backgroundColor: p.color,
                        borderColor: t.pos === -1 ? 'rgba(0,0,0,0.2)' : 'white',
                        opacity: t.pos === -1 ? 0.4 : 1,
                      }}>
                      {t.finished ? '✓' : t.pos === -1 ? '🏠' : t.pos >= 52 ? '🏁' : t.pos + 1}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-text-secondary mt-1">
                  Bitiren: {p.tokens.filter(t => t.finished).length}/4
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dice */}
        <button onClick={rollDice} disabled={rolled || players[current]?.isBot || winner !== null}
          className={`text-5xl transition-all ${diceAnim ? 'animate-shake' : ''} ${!rolled && !players[current]?.isBot ? 'hover:scale-110 cursor-pointer' : 'opacity-60'}`}>
          {dice > 0 ? DICE_FACES[dice - 1] : '🎲'}
        </button>

        <p className="text-xs text-text-secondary">
          6 gelince: Taşı çıkar veya tekrar at • Aynı karede: Rakibi eve gönder
        </p>
      </div>
    </GameShell>
  );
}
