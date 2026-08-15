import { useState, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';

type Color = 'w' | 'b';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
interface Piece { type: PieceType; color: Color; }
type Board = (Piece | null)[][];
interface Move { fr: number; fc: number; tr: number; tc: number; promo?: PieceType; }

const ICONS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};
const VALS: Record<PieceType, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

function initBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back: PieceType[] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: back[c], color: 'b' }; b[1][c] = { type: 'P', color: 'b' };
    b[6][c] = { type: 'P', color: 'w' }; b[7][c] = { type: back[c], color: 'w' };
  }
  return b;
}

function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function getMoves(board: Board, color: Color, checkCheck = true): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]; if (!p || p.color !== color) continue;
    const add = (tr: number, tc: number) => {
      if (!inBounds(tr, tc)) return false;
      const target = board[tr][tc];
      if (target && target.color === color) return false;
      if (p.type === 'P' && ((color === 'w' && tr === 0) || (color === 'b' && tr === 7))) {
        for (const promo of ['Q', 'R', 'B', 'N'] as PieceType[]) moves.push({ fr: r, fc: c, tr, tc, promo });
      } else moves.push({ fr: r, fc: c, tr, tc });
      return !target;
    };
    const slide = (dirs: [number, number][]) => { for (const [dr, dc] of dirs) { for (let i = 1; i < 8; i++) if (!add(r + dr * i, c + dc * i)) break; } };

    switch (p.type) {
      case 'P': {
        const dir = color === 'w' ? -1 : 1;
        if (inBounds(r + dir, c) && !board[r + dir][c]) { add(r + dir, c); if ((color === 'w' && r === 6) || (color === 'b' && r === 1)) if (!board[r + dir * 2][c]) add(r + dir * 2, c); }
        for (const dc of [-1, 1]) if (inBounds(r + dir, c + dc) && board[r + dir][c + dc] && board[r + dir][c + dc]!.color !== color) add(r + dir, c + dc);
        break;
      }
      case 'N': for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) add(r + dr, c + dc); break;
      case 'B': slide([[-1,-1],[-1,1],[1,-1],[1,1]]); break;
      case 'R': slide([[-1,0],[1,0],[0,-1],[0,1]]); break;
      case 'Q': slide([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]); break;
      case 'K': for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) add(r + dr, c + dc); break;
    }
  }
  if (!checkCheck) return moves;
  return moves.filter(m => { const nb = applyMove(board, m); return !isInCheck(nb, color); });
}

function applyMove(board: Board, m: Move): Board {
  const b = board.map(r => r.map(c => c ? { ...c } : null));
  b[m.tr][m.tc] = m.promo ? { type: m.promo, color: b[m.fr][m.fc]!.color } : b[m.fr][m.fc];
  b[m.fr][m.fc] = null;
  return b;
}

function isInCheck(board: Board, color: Color): boolean {
  let kr = -1, kc = -1;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = board[r][c]; if (p && p.type === 'K' && p.color === color) { kr = r; kc = c; } }
  if (kr === -1) return true;
  const opp = color === 'w' ? 'b' : 'w';
  const oppMoves = getMoves(board, opp, false);
  return oppMoves.some(m => m.tr === kr && m.tc === kc);
}

function evaluate(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]; if (!p) continue;
    const v = VALS[p.type];
    const pos = p.type === 'P' ? (p.color === 'w' ? (6 - r) * 5 : (r - 1) * 5) : 0;
    score += (p.color === 'b' ? 1 : -1) * (v + pos);
  }
  return score;
}

function aiSearch(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0) return evaluate(board);
  const color = maximizing ? 'b' : 'w';
  const moves = getMoves(board, color);
  if (moves.length === 0) return isInCheck(board, color) ? (maximizing ? -99999 : 99999) : 0;
  if (maximizing) {
    let val = -Infinity;
    for (const m of moves) { val = Math.max(val, aiSearch(applyMove(board, m), depth - 1, alpha, beta, false)); alpha = Math.max(alpha, val); if (beta <= alpha) break; }
    return val;
  } else {
    let val = Infinity;
    for (const m of moves) { val = Math.min(val, aiSearch(applyMove(board, m), depth - 1, alpha, beta, true)); beta = Math.min(beta, val); if (beta <= alpha) break; }
    return val;
  }
}

function aiGetMove(board: Board): Move | null {
  const moves = getMoves(board, 'b');
  if (moves.length === 0) return null;
  let bestScore = -Infinity, bestMove = moves[0];
  for (const m of moves) {
    const s = aiSearch(applyMove(board, m), 2, -Infinity, Infinity, false);
    if (s > bestScore) { bestScore = s; bestMove = m; }
  }
  return bestMove;
}

export function ChessGame({ onBack }: { onBack: () => void }) {
  const [gs, setGs] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [board, setBoard] = useState<Board>(initBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [msg, setMsg] = useState('');
  const [thinking, setThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const { playClick, playScore, playHit, playWin, playGameOver } = useSound();
  const boardRef = useRef(board);

  const start = useCallback(() => {
    const b = initBoard(); setBoard(b); boardRef.current = b;
    setSelected(null); setValidMoves([]); setMsg('Senin sıran (Beyaz)'); setScore(0); setThinking(false); setLastMove(null); setGs('playing');
  }, []);

  const doAiMove = useCallback((b: Board) => {
    setThinking(true); setMsg('Yapay zeka düşünüyor...');
    setTimeout(() => {
      const m = aiGetMove(b);
      if (!m) {
        if (isInCheck(b, 'b')) { playWin(); setMsg('Şah Mat! Kazandın! 🎉'); setScore(s => s + 500); }
        else setMsg('Pat! Berabere.');
        setThinking(false); setTimeout(() => setGs('gameover'), 1500); return;
      }
      const captured = b[m.tr][m.tc];
      const nb = applyMove(b, m);
      setBoard(nb); boardRef.current = nb; setLastMove(m);
      if (captured) { playHit(); setScore(s => s - VALS[captured.type] / 10); }
      else playClick();

      // Check if player has moves
      const playerMoves = getMoves(nb, 'w');
      if (playerMoves.length === 0) {
        if (isInCheck(nb, 'w')) { playGameOver(); setMsg('Şah Mat! Kaybettin.'); }
        else setMsg('Pat! Berabere.');
        setThinking(false); setTimeout(() => setGs('gameover'), 1500); return;
      }
      if (isInCheck(nb, 'w')) setMsg('Şah! Dikkat!');
      else setMsg('Senin sıran');
      setThinking(false);
    }, 500);
  }, [playClick, playHit, playWin, playGameOver]);

  const handleClick = useCallback((r: number, c: number) => {
    if (gs !== 'playing' || thinking) return;
    const b = boardRef.current;

    if (selected) {
      const mv = validMoves.find(m => m.tr === r && m.tc === c);
      if (mv) {
        const captured = b[mv.tr][mv.tc];
        const nb = applyMove(b, mv);
        setBoard(nb); boardRef.current = nb; setLastMove(mv);
        setSelected(null); setValidMoves([]);
        if (captured) { playScore(); setScore(s => s + VALS[captured.type] / 10); }
        else playClick();

        // Check if AI has moves
        const aiMoves = getMoves(nb, 'b');
        if (aiMoves.length === 0) {
          if (isInCheck(nb, 'b')) { playWin(); setMsg('Şah Mat! Kazandın! 🎉'); setScore(s => s + 500); }
          else setMsg('Pat! Berabere.');
          setTimeout(() => setGs('gameover'), 1500); return;
        }
        doAiMove(nb);
        return;
      }
    }

    const p = b[r][c];
    if (p && p.color === 'w') {
      playClick();
      setSelected([r, c]);
      setValidMoves(getMoves(b, 'w').filter(m => m.fr === r && m.fc === c));
    } else {
      setSelected(null); setValidMoves([]);
    }
  }, [gs, selected, validMoves, thinking, playClick, playScore, playWin, doAiMove]);

  return (
    <GameShell gameId="chess" score={score} gameState={gs} onStart={start} onPause={() => setGs('paused')} onResume={() => setGs('playing')} onRestart={start} onBack={onBack}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-2">
        <p className="text-sm font-bold text-stone-600">{msg}</p>
        {thinking && <div className="text-xs text-text-secondary animate-pulse">🤔 Düşünüyor...</div>}
        <div className="grid grid-cols-8 border-2 border-stone-700 rounded-lg overflow-hidden shadow-xl">
          {board.map((row, r) => row.map((piece, c) => {
            const isLight = (r + c) % 2 === 0;
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isValid = validMoves.some(m => m.tr === r && m.tc === c);
            const isLast = lastMove && ((lastMove.fr === r && lastMove.fc === c) || (lastMove.tr === r && lastMove.tc === c));
            return (
              <button key={`${r}-${c}`} onClick={() => handleClick(r, c)}
                className={`w-[min(11vw,6vh)] h-[min(11vw,6vh)] sm:w-12 sm:h-12 flex items-center justify-center text-2xl sm:text-3xl relative transition-colors
                  ${isSel ? 'bg-yellow-300' : isLast ? (isLight ? 'bg-yellow-100' : 'bg-yellow-200') : isLight ? 'bg-amber-100' : 'bg-amber-700'}`}>
                {isValid && <div className={`absolute rounded-full ${piece ? 'inset-0.5 border-4 border-indigo-400 border-opacity-60' : 'w-3 h-3 bg-indigo-400 opacity-40'}`} />}
                {piece && <span className={piece.color === 'w' ? 'drop-shadow-sm' : ''}>{ICONS[piece.color + piece.type]}</span>}
              </button>
            );
          }))}
        </div>
        <div className="flex gap-2 text-xs text-text-secondary">
          <span>♔ Beyaz (Sen)</span>
          <span>vs</span>
          <span>♚ Siyah (Yapay Zeka)</span>
        </div>
      </div>
    </GameShell>
  );
}
