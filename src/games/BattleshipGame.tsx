import { useState, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

const SZ = 10;
const SHIPS = [{ len: 5, name: 'Uçak Gemisi' }, { len: 4, name: 'Kruvazör' }, { len: 3, name: 'Destroyer' }, { len: 3, name: 'Denizaltı' }, { len: 2, name: 'Devriye' }];
type Cell = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
type Board = Cell[][];
type Mode = '1v1' | 'vsBot';
type Phase = 'placing' | 'p1Attack' | 'p2Attack' | 'over';

function emptyBoard(): Board { return Array.from({ length: SZ }, () => Array(SZ).fill('empty')); }

function canPlace(board: Board, r: number, c: number, len: number, horiz: boolean): boolean {
  for (let i = 0; i < len; i++) {
    const cr = horiz ? r : r + i;
    const cc = horiz ? c + i : c;
    if (cr >= SZ || cc >= SZ) return false;
    if (board[cr][cc] !== 'empty') return false;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = cr + dr, nc = cc + dc;
      if (nr >= 0 && nr < SZ && nc >= 0 && nc < SZ && board[nr][nc] === 'ship') return false;
    }
  }
  return true;
}

function placeShip(board: Board, r: number, c: number, len: number, horiz: boolean): Board {
  const b = board.map(row => [...row]) as Board;
  for (let i = 0; i < len; i++) b[horiz ? r : r + i][horiz ? c + i : c] = 'ship';
  return b;
}

function placeRandom(board: Board): Board {
  let b = board.map(row => [...row]) as Board;
  for (const ship of SHIPS) {
    let placed = false;
    while (!placed) {
      const horiz = Math.random() > 0.5;
      const r = Math.floor(Math.random() * SZ);
      const c = Math.floor(Math.random() * SZ);
      if (canPlace(b, r, c, ship.len, horiz)) { b = placeShip(b, r, c, ship.len, horiz); placed = true; }
    }
  }
  return b;
}

function checkSunk(board: Board, r: number, c: number): [number, number][] | null {
  const visited = new Set<string>();
  const cells: [number, number][] = [];
  const stack: [number, number][] = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const key = `${cr}-${cc}`;
    if (visited.has(key)) continue;
    visited.add(key);
    const cell = board[cr][cc];
    if (cell !== 'hit' && cell !== 'ship') continue;
    cells.push([cr, cc]);
    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = cr + dr, nc = cc + dc;
      if (nr >= 0 && nr < SZ && nc >= 0 && nc < SZ) stack.push([nr, nc]);
    }
  }
  if (cells.every(([cr, cc]) => board[cr][cc] === 'hit')) return cells;
  return null;
}

export function BattleshipGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('placing');
  const [mode, setMode] = useState<Mode>('vsBot');
  const [showSetup, setShowSetup] = useState(true);
  const [p1Board, setP1Board] = useState<Board>(emptyBoard);
  const [p2Board, setP2Board] = useState<Board>(emptyBoard);
  const [p1View, setP1View] = useState<Board>(emptyBoard);
  const [p2View, setP2View] = useState<Board>(emptyBoard);
  const [placingShipIdx, setPlacingShipIdx] = useState(0);
  const [placingHoriz, setPlacingHoriz] = useState(true);
  const [msg, setMsg] = useState('');
  const [p1Name] = useState('Oyuncu 1');
  const [p2Name, setP2Name] = useState('Bot');
  const conRef = useRef<HTMLDivElement>(null);
  const { playScore, playHit, playGameOver, playWin, playClick } = useSound();

  const start = useCallback(() => {
    setP1Board(emptyBoard());
    setP2Board(mode === 'vsBot' ? placeRandom(emptyBoard()) : emptyBoard());
    setP1View(emptyBoard());
    setP2View(emptyBoard());
    setPlacingShipIdx(0);
    setPlacingHoriz(true);
    setPhase('placing');
    setP2Name(mode === 'vsBot' ? 'Bot' : 'Oyuncu 2');
    setMsg(`${SHIPS[0].name} yerleştir (${SHIPS[0].len} kare)`);
    setScore(0);
    setShowSetup(false);
    setGs('playing');
  }, [mode]);

  const countAlive = (board: Board) => board.flat().filter(c => c === 'ship').length;

  const handlePlaceClick = useCallback((r: number, c: number) => {
    if (phase !== 'placing') return;
    const ship = SHIPS[placingShipIdx];
    if (!canPlace(p1Board, r, c, ship.len, placingHoriz)) { playHit(); return; }
    playClick();
    const newBoard = placeShip(p1Board, r, c, ship.len, placingHoriz);
    setP1Board(newBoard);
    
    if (placingShipIdx < SHIPS.length - 1) {
      const nextShip = SHIPS[placingShipIdx + 1];
      setPlacingShipIdx(placingShipIdx + 1);
      setMsg(`${nextShip.name} yerleştir (${nextShip.len} kare)`);
    } else {
      setPhase('p1Attack');
      setMsg(`${p1Name} ateş etsin!`);
    }
  }, [phase, placingShipIdx, placingHoriz, p1Board, p1Name, playClick, playHit]);

  const aiShoot = useCallback((_pb: Board, pv: Board): { r: number; c: number } => {
    const targets: [number, number][] = [];
    for (let r = 0; r < SZ; r++) for (let c = 0; c < SZ; c++) {
      if (pv[r][c] === 'hit') {
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < SZ && nc >= 0 && nc < SZ && pv[nr][nc] === 'empty') targets.push([nr, nc]);
        }
      }
    }
    if (targets.length === 0) {
      for (let r = 0; r < SZ; r++) for (let c = 0; c < SZ; c++) if (pv[r][c] === 'empty') targets.push([r, c]);
    }
    const [tr, tc] = targets[Math.floor(Math.random() * targets.length)];
    return { r: tr, c: tc };
  }, []);

  const handleAttack = useCallback((r: number, c: number, isP1: boolean) => {
    if (phase !== (isP1 ? 'p1Attack' : 'p2Attack')) return;
    const targetBoard = isP1 ? p2Board : p1Board;
    const targetView = isP1 ? p1View : p2View;
    if (targetView[r][c] !== 'empty') return;
    playClick();

    const nb = targetBoard.map(row => [...row]) as Board;
    const nv = targetView.map(row => [...row]) as Board;

    if (nb[r][c] === 'ship') {
      nb[r][c] = 'hit';
      nv[r][c] = 'hit';
      playScore();
      setScore(s => s + 50);
      const sunk = checkSunk(nb, r, c);
      if (sunk) {
        sunk.forEach(([sr, sc]) => { nb[sr][sc] = 'sunk'; nv[sr][sc] = 'sunk'; });
        setScore(s => s + 100);
        setMsg('Gemi battı! 🎉');
        if (conRef.current) {
          const rect = conRef.current.getBoundingClientRect();
          particleEmitter.emit(rect.left + rect.width / 2, rect.top + 50, 10, '#ef4444', 'BATTI!');
        }
      } else setMsg('İsabet! 💥');
    } else {
      nb[r][c] = 'miss';
      nv[r][c] = 'miss';
      playHit();
      setMsg('Iskaladın!');
    }

    if (isP1) { setP2Board(nb); setP1View(nv); }
    else { setP1Board(nb); setP2View(nv); }

    if (countAlive(nb) === 0) {
      if (isP1) { playWin(); setMsg(`${p1Name} kazandı! 🎉`); }
      else { playGameOver(); setMsg(`${p2Name} kazandı!`); }
      setPhase('over');
      setTimeout(() => setGs('gameover'), 1500);
      return;
    }

    if (mode === 'vsBot') {
      if (isP1) {
        setPhase('p2Attack');
        setTimeout(() => {
          const { r: ar, c: ac } = aiShoot(p1Board, p2View);
          handleAttack(ar, ac, false);
        }, 1000);
      } else {
        setPhase('p1Attack');
        setMsg(`${p1Name} ateş etsin!`);
      }
    } else {
      setPhase(isP1 ? 'p2Attack' : 'p1Attack');
      setMsg(`${isP1 ? p2Name : p1Name} ateş etsin!`);
    }
  }, [phase, p1Board, p2Board, p1View, p2View, mode, p1Name, p2Name, playClick, playScore, playHit, playWin, playGameOver, aiShoot]);

  const renderBoard = (board: Board, view: Board, isOwn: boolean, onClick?: (r: number, c: number) => void) => (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${SZ}, minmax(0, 1fr))` }}>
      {Array.from({ length: SZ }).map((_, r) =>
        Array.from({ length: SZ }).map((_, c) => {
          const cell = isOwn ? board[r][c] : view[r][c];
          const showShip = isOwn && cell === 'ship';
          return (
            <button key={`${r}-${c}`} onClick={() => onClick?.(r, c)}
              className={`w-[min(4vw,3vh)] h-[min(4vw,3vh)] sm:w-6 sm:h-6 rounded-sm text-[8px] flex items-center justify-center transition-colors
                ${cell === 'hit' ? 'bg-red-400' : cell === 'miss' ? 'bg-gray-300' : cell === 'sunk' ? 'bg-red-700' : showShip ? 'bg-blue-400' : 'bg-blue-50'}
                ${onClick && cell === 'empty' ? 'hover:bg-blue-100 cursor-pointer' : ''}`}>
              {cell === 'hit' ? '💥' : cell === 'miss' ? '•' : cell === 'sunk' ? '🔥' : showShip ? '🚢' : ''}
            </button>
          );
        })
      )}
    </div>
  );

  if (showSetup && gs === 'menu') {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border z-30 shrink-0 shadow-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            <span className="text-lg">←</span><span className="text-xs font-bold hidden sm:inline">MENÜ</span>
          </button>
          <div className="flex items-center gap-2"><span className="text-xl">🚢</span><span className="font-bold text-sm text-blue-600">Amiral Battı</span></div>
          <div />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="text-6xl">🚢</div>
          <h2 className="font-extrabold text-2xl text-blue-600">Amiral Battı</h2>
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
    <GameShell gameId="battleship" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={() => { setShowSetup(true); setGs('menu'); }} onBack={() => { setShowSetup(true); onBack(); }}>
      <div ref={conRef} className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-2">
        <p className="text-sm font-bold text-blue-700">{msg}</p>
        
        {phase === 'placing' && (
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => setPlacingHoriz(!placingHoriz)} className="btn-secondary text-xs">
              {placingHoriz ? '↔️ Yatay' : '↕️ Dikey'}
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {phase === 'placing' ? (
            <div>
              <p className="text-xs font-bold text-center mb-1">Gemilerini yerleştir</p>
              <div className="bg-white border-2 border-blue-300 rounded-lg p-1 shadow-lg">
                {renderBoard(p1Board, p1View, true, handlePlaceClick)}
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-bold text-center mb-1 text-red-600">DÜŞMAN</p>
                <div className="bg-white border-2 border-red-300 rounded-lg p-1 shadow-lg">
                  {renderBoard(p2Board, p1View, false, phase === 'p1Attack' ? (r, c) => handleAttack(r, c, true) : undefined)}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-center mb-1 text-blue-600">SEN</p>
                <div className="bg-white border-2 border-blue-300 rounded-lg p-1 shadow-lg">
                  {renderBoard(p1Board, p2View, true)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </GameShell>
  );
}
