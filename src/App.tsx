import { useState, useCallback } from 'react';
import { GameId } from './types';
import { ArcadeHub } from './components/ArcadeHub';
import { ParticleLayer } from './components/Particles';
import { SnakeGame } from './games/SnakeGame';
import { FlappyGame } from './games/FlappyGame';
import { TetrisGame } from './games/TetrisGame';
import { MemoryGame } from './games/MemoryGame';
import { TicTacToeGame } from './games/TicTacToeGame';
import { MinesweeperGame } from './games/MinesweeperGame';
import { BreakoutGame } from './games/BreakoutGame';
import { Game2048 } from './games/Game2048';
import { RedBallGame } from './games/RedBallGame';
import { DotsBoxesGame } from './games/DotsBoxesGame';
import { SudokuGame } from './games/SudokuGame';
import { FruitMergeGame } from './games/FruitMergeGame';
import { ChessGame } from './games/ChessGame';
import { BattleshipGame } from './games/BattleshipGame';
import { LudoGame } from './games/LudoGame';
import { ColorConnectGame } from './games/ColorConnectGame';
import { FruitNinjaGame } from './games/FruitNinjaGame';
import { PuzzleGame } from './games/PuzzleGame';
import { MangalaGame } from './games/MangalaGame';
import { UnoGame } from './games/UnoGame';
import { QuoridorGame } from './games/QuoridorGame';
import { TurkishCheckersGame } from './games/TurkishCheckersGame';
import { ConnectFourGame } from './games/ConnectFourGame';

export default function App() {
  const [game, setGame] = useState<GameId | null>(null);
  const back = useCallback(() => setGame(null), []);
  const select = useCallback((id: string) => setGame(id as GameId), []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-bg">
      <ParticleLayer />
      {!game && <ArcadeHub onSelectGame={select} />}
      {game === 'snake' && <SnakeGame onBack={back} />}
      {game === 'flappy' && <FlappyGame onBack={back} />}
      {game === 'tetris' && <TetrisGame onBack={back} />}
      {game === 'memory' && <MemoryGame onBack={back} />}
      {game === 'tictactoe' && <TicTacToeGame onBack={back} />}
      {game === 'minesweeper' && <MinesweeperGame onBack={back} />}
      {game === 'breakout' && <BreakoutGame onBack={back} />}
      {game === '2048' && <Game2048 onBack={back} />}
      {game === 'redball' && <RedBallGame onBack={back} />}
      {game === 'karekapmaca' && <DotsBoxesGame onBack={back} />}
      {game === 'sudoku' && <SudokuGame onBack={back} />}
      {game === 'fruitmarge' && <FruitMergeGame onBack={back} />}
      {game === 'chess' && <ChessGame onBack={back} />}
      {game === 'battleship' && <BattleshipGame onBack={back} />}
      {game === 'ludo' && <LudoGame onBack={back} />}
      {game === 'colorconnect' && <ColorConnectGame onBack={back} />}
      {game === 'fruitninja' && <FruitNinjaGame onBack={back} />}
      {game === 'puzzle' && <PuzzleGame onBack={back} />}
      {game === 'mangala' && <MangalaGame onBack={back} />}
      {game === 'uno' && <UnoGame onBack={back} />}
      {game === 'quoridor' && <QuoridorGame onBack={back} />}
      {game === 'turkishcheckers' && <TurkishCheckersGame onBack={back} />}
      {game === 'connectfour' && <ConnectFourGame onBack={back} />}
    </div>
  );
}
