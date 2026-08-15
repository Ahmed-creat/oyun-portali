import { GameShell } from '../components/GameShell';


export function MangalaGame({ onBack }: { onBack: () => void }) {
  // Use exact HTML implementation via iframe srcdoc from Google Drive MANGALA.html
  const mangalaHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Türk Mangalası</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a0a00 0%, #2d1810 50%, #1a0a00 100%);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: hidden;
        }
        .mode-screen {
            position: fixed; inset: 0;
            background: linear-gradient(135deg, #1a0a00 0%, #2d1810 50%, #1a0a00 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 100; transition: opacity 0.5s ease, visibility 0.5s ease;
        }
        .mode-screen.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
        .mode-title { color: #ffd700; font-size: 2.8rem; text-shadow: 3px 3px 10px rgba(0,0,0,0.8); margin-bottom: 10px; }
        .mode-subtitle { color: #d4c4a8; font-size: 1.1rem; margin-bottom: 40px; }
        .mode-buttons { display: flex; flex-direction: column; gap: 15px; }
        .mode-btn {
            padding: 18px 50px; font-size: 1.2rem;
            background: linear-gradient(180deg, #5a4030 0%, #3d2817 100%);
            color: #f4e4bc; border: 3px solid #8b6914; border-radius: 12px;
            cursor: pointer; transition: all 0.3s ease; font-weight: bold;
        }
        .mode-btn:hover {
            background: linear-gradient(180deg, #7a5a40 0%, #5a4030 100%);
            transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.5);
        }
        .game-container { display: none; flex-direction: column; align-items: center; padding: 15px; }
        .game-container.active { display: flex; }
        .header { display: flex; align-items: center; gap: 15px; margin-bottom: 12px; }
        .back-btn {
            padding: 8px 16px; background: #3d2817; color: #f4e4bc; border: 2px solid #8b6914;
            border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;
        }
        .back-btn:hover { background: #5a4030; }
        .turn-indicator {
            padding: 10px 25px; background: rgba(0, 0, 0, 0.6); border: 2px solid #8b6914;
            border-radius: 20px; color: #ffd700; font-size: 1.1rem; font-weight: bold; text-align: center;
        }
        .board-wrapper {
            background: linear-gradient(180deg, #4a2e1b 0%, #2d1810 100%);
            padding: 20px; border-radius: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            border: 4px solid #8b6914; max-width: 900px; width: 100%;
        }
        .board { display: flex; justify-content: space-between; align-items: center; gap: 15px; }
        .player-area { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .player-title { color: #d4c4a8; font-size: 0.9rem; font-weight: bold; text-transform: uppercase; }
        .player-title.active { color: #ffd700; text-shadow: 0 0 10px rgba(255,215,0,0.5); }
        .store {
            width: 90px; height: 260px;
            background: radial-gradient(ellipse at center, #1a0a00 0%, #0d0500 100%);
            border: 4px solid #5a4030; border-radius: 45px; display: flex; flex-direction: column;
            align-items: center; justify-content: space-between; padding: 15px 5px; box-shadow: inset 0 10px 20px rgba(0,0,0,0.9);
        }
        .store-count { color: #ffd700; font-size: 1.8rem; font-weight: bold; text-shadow: 0 2px 5px rgba(0,0,0,0.8); }
        .store-seeds { display: flex; flex-wrap: wrap; justify-content: center; align-content: center; gap: 3px; max-height: 180px; overflow: hidden; padding: 5px; }
        .pits-container { display: flex; flex-direction: column; gap: 15px; flex-grow: 1; }
        .pits-row { display: flex; justify-content: space-between; gap: 10px; }
        .pit-wrapper { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .pit-label { color: #8b6914; font-size: 0.75rem; font-weight: bold; }
        .pit {
            width: 70px; height: 70px;
            background: radial-gradient(circle at center, #2d1810 0%, #1a0a00 100%);
            border: 3px solid #5a4030; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            position: relative; cursor: pointer; transition: all 0.3s ease; box-shadow: inset 0 5px 15px rgba(0,0,0,0.8);
        }
        .pit:hover:not(.disabled) { border-color: #ffd700; box-shadow: inset 0 5px 15px rgba(0,0,0,0.8), 0 0 15px rgba(255,215,0,0.4); transform: scale(1.05); }
        .pit.disabled { cursor: not-allowed; opacity: 0.7; }
        .pit.highlight { border-color: #00ff88; box-shadow: 0 0 15px rgba(0,255,136,0.6); }
        .pit-count { position: absolute; top: -8px; right: -8px; background: #8b6914; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; border: 2px solid #2d1810; }
        .pit-seeds { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 2px; width: 50px; height: 50px; }
        .seed { width: 10px; height: 10px; border-radius: 50%; background: radial-gradient(circle at 3px 3px, #ffffff, #d4af37, #8b6914); box-shadow: 1px 1px 3px rgba(0,0,0,0.6); transition: all 0.3s ease; }
        .seed.red { background: radial-gradient(circle at 3px 3px, #ff8888, #cc0000, #660000); }
        .seed.blue { background: radial-gradient(circle at 3px 3px, #8888ff, #0000cc, #000066); }
        .seed.green { background: radial-gradient(circle at 3px 3px, #88ff88, #00cc00, #006600); }
        .seed.purple { background: radial-gradient(circle at 3px 3px, #ff88ff, #cc00cc, #660066); }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 200; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
        .modal.active { opacity: 1; visibility: visible; }
        .modal-content { background: linear-gradient(180deg, #3d2817 0%, #1a0a00 100%); border: 3px solid #8b6914; border-radius: 20px; padding: 30px 40px; text-align: center; max-width: 400px; width: 90%; }
        .winner-title { color: #ffd700; font-size: 2rem; margin-bottom: 15px; }
        .score-board { margin: 20px 0; color: #d4c4a8; font-size: 1.2rem; }
        .play-again-btn { padding: 12px 30px; font-size: 1rem; background: #8b6914; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
    </style>
</head>
<body>
    <div class="mode-screen" id="modeScreen">
        <h1 class="mode-title">TÜRK MANGALASI</h1>
        <p class="mode-subtitle">Geleneksel Strateji Oyunu</p>
        <div class="mode-buttons">
            <button class="mode-btn" onclick="startGame('ai')">🤖 Yapay Zekaya Karşı</button>
            <button class="mode-btn" onclick="startGame('pvp')">👥 2 Kişilik (Aynı Cihaz)</button>
        </div>
    </div>
    <div class="game-container" id="gameContainer">
        <div class="header">
            <button class="back-btn" onclick="showModeScreen()">← Menü</button>
            <div class="turn-indicator" id="turnIndicator">Sıra: Oyuncu 1</div>
        </div>
        <div class="board-wrapper">
            <div class="board">
                <div class="player-area">
                    <span class="player-title" id="p2Title">Rakip</span>
                    <div class="store" id="store2">
                        <span class="store-count" id="count-store2">0</span>
                        <div class="store-seeds" id="seeds-store2"></div>
                    </div>
                </div>
                <div class="pits-container">
                    <div class="pits-row" id="row2">
                        <div class="pit-wrapper"><span class="pit-label">12</span><div class="pit disabled" id="pit-11" onclick="makeMove(11)"><span class="pit-count" id="count-11">4</span><div class="pit-seeds" id="seeds-11"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">11</span><div class="pit disabled" id="pit-10" onclick="makeMove(10)"><span class="pit-count" id="count-10">4</span><div class="pit-seeds" id="seeds-10"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">10</span><div class="pit disabled" id="pit-9" onclick="makeMove(9)"><span class="pit-count" id="count-9">4</span><div class="pit-seeds" id="seeds-9"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">9</span><div class="pit disabled" id="pit-8" onclick="makeMove(8)"><span class="pit-count" id="count-8">4</span><div class="pit-seeds" id="seeds-8"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">8</span><div class="pit disabled" id="pit-7" onclick="makeMove(7)"><span class="pit-count" id="count-7">4</span><div class="pit-seeds" id="seeds-7"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">7</span><div class="pit disabled" id="pit-6" onclick="makeMove(6)"><span class="pit-count" id="count-6">4</span><div class="pit-seeds" id="seeds-6"></div></div></div>
                    </div>
                    <div class="pits-row" id="row1">
                        <div class="pit-wrapper"><span class="pit-label">1</span><div class="pit" id="pit-0" onclick="makeMove(0)"><span class="pit-count" id="count-0">4</span><div class="pit-seeds" id="seeds-0"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">2</span><div class="pit" id="pit-1" onclick="makeMove(1)"><span class="pit-count" id="count-1">4</span><div class="pit-seeds" id="seeds-1"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">3</span><div class="pit" id="pit-2" onclick="makeMove(2)"><span class="pit-count" id="count-2">4</span><div class="pit-seeds" id="seeds-2"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">4</span><div class="pit" id="pit-3" onclick="makeMove(3)"><span class="pit-count" id="count-3">4</span><div class="pit-seeds" id="seeds-3"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">5</span><div class="pit" id="pit-4" onclick="makeMove(4)"><span class="pit-count" id="count-4">4</span><div class="pit-seeds" id="seeds-4"></div></div></div>
                        <div class="pit-wrapper"><span class="pit-label">6</span><div class="pit" id="pit-5" onclick="makeMove(5)"><span class="pit-count" id="count-5">4</span><div class="pit-seeds" id="seeds-5"></div></div></div>
                    </div>
                </div>
                <div class="player-area">
                    <span class="player-title active" id="p1Title">Oyuncu 1</span>
                    <div class="store" id="store1">
                        <span class="store-count" id="count-store1">0</span>
                        <div class="store-seeds" id="seeds-store1"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="modal" id="winnerModal">
        <div class="modal-content">
            <h2 class="winner-title" id="winnerText">Tebrikler!</h2>
            <div class="score-board" id="scoreText"></div>
            <button class="play-again-btn" onclick="showModeScreen()">Tekrar Oyna</button>
        </div>
    </div>

    <script>
        let gameState = { board: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], stores: [0, 0], currentPlayer: 1, mode: 'pvp', isAnimating: false };
        const seedColors = ['gold', 'red', 'blue', 'green', 'purple'];
        let seedColorMap = [];

        function initSeedColors() {
            seedColorMap = [];
            for (let i = 0; i < 48; i++) {
                seedColorMap.push(seedColors[Math.floor(Math.random() * seedColors.length)]);
            }
        }

        function startGame(mode) {
            gameState.mode = mode;
            gameState.board = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
            gameState.stores = [0, 0];
            gameState.currentPlayer = 1;
            gameState.isAnimating = false;
            initSeedColors();
            document.getElementById('modeScreen').classList.add('hidden');
            document.getElementById('gameContainer').classList.add('active');
            document.getElementById('winnerModal').classList.remove('active');
            document.getElementById('p2Title').textContent = mode === 'ai' ? 'Yapay Zeka' : 'Oyuncu 2';
            updateUI();
        }

        function showModeScreen() {
            document.getElementById('modeScreen').classList.remove('hidden');
            document.getElementById('gameContainer').classList.remove('active');
            document.getElementById('winnerModal').classList.remove('active');
        }

        function updateUI() {
            for (let i = 0; i < 12; i++) {
                const countEl = document.getElementById('count-' + i);
                const seedsEl = document.getElementById('seeds-' + i);
                const pitEl = document.getElementById('pit-' + i);
                countEl.textContent = gameState.board[i];
                seedsEl.innerHTML = '';
                for (let s = 0; s < Math.min(gameState.board[i], 12); s++) {
                    const seed = document.createElement('div');
                    seed.className = 'seed ' + (seedColorMap[s % seedColorMap.length] || '');
                    seedsEl.appendChild(seed);
                }
                const isP1Pit = i >= 0 && i <= 5;
                const isP2Pit = i >= 6 && i <= 11;
                if ((gameState.currentPlayer === 1 && isP1Pit) || (gameState.currentPlayer === 2 && isP2Pit && gameState.mode === 'pvp')) {
                    if (gameState.board[i] > 0 && !gameState.isAnimating) { pitEl.classList.remove('disabled'); } else { pitEl.classList.add('disabled'); }
                } else { pitEl.classList.add('disabled'); }
            }
            document.getElementById('count-store1').textContent = gameState.stores[0];
            document.getElementById('count-store2').textContent = gameState.stores[1];
            updateStoreSeeds('seeds-store1', gameState.stores[0]);
            updateStoreSeeds('seeds-store2', gameState.stores[1]);
            const turnText = gameState.currentPlayer === 1 ? 'Sıra: Oyuncu 1' : (gameState.mode === 'ai' ? 'Sıra: Yapay Zeka' : 'Sıra: Oyuncu 2');
            document.getElementById('turnIndicator').textContent = turnText;
            document.getElementById('p1Title').className = 'player-title' + (gameState.currentPlayer === 1 ? ' active' : '');
            document.getElementById('p2Title').className = 'player-title' + (gameState.currentPlayer === 2 ? ' active' : '');
        }

        function updateStoreSeeds(elId, count) {
            const el = document.getElementById(elId);
            el.innerHTML = '';
            for (let s = 0; s < Math.min(count, 24); s++) {
                const seed = document.createElement('div');
                seed.className = 'seed ' + (seedColorMap[s % seedColorMap.length] || '');
                el.appendChild(seed);
            }
        }

        async function makeMove(pitIndex) {
            if (gameState.isAnimating) return;
            const isP1Turn = gameState.currentPlayer === 1;
            const isP2Turn = gameState.currentPlayer === 2;
            if (isP1Turn && (pitIndex < 0 || pitIndex > 5)) return;
            if (isP2Turn && (pitIndex < 6 || pitIndex > 11)) return;
            if (gameState.board[pitIndex] === 0) return;

            gameState.isAnimating = true;
            let seeds = gameState.board[pitIndex];
            gameState.board[pitIndex] = 0;
            updateUI();
            await sleep(200);

            let currentIndex = pitIndex;
            let extraTurn = false;

            if (seeds === 1) {
                currentIndex = getNextIndex(currentIndex, gameState.currentPlayer);
                await depositSeed(currentIndex);
                seeds--;
            } else {
                gameState.board[pitIndex] = 1;
                seeds--;
                updateUI();
                await sleep(150);
                while (seeds > 0) {
                    currentIndex = getNextIndex(currentIndex, gameState.currentPlayer);
                    await depositSeed(currentIndex);
                    seeds--;
                }
            }

            if (isStore(currentIndex, gameState.currentPlayer)) { extraTurn = true; }
            else if (!isStore(currentIndex, 1) && !isStore(currentIndex, 2)) {
                const pit = currentIndex;
                const seedsInPit = gameState.board[pit];
                const isOpponentPit = (isP1Turn && pit >= 6 && pit <= 11) || (isP2Turn && pit >= 0 && pit <= 5);
                const isOwnPit = (isP1Turn && pit >= 0 && pit <= 5) || (isP2Turn && pit >= 6 && pit <= 11);
                if (isOpponentPit && seedsInPit % 2 === 0) {
                    const storeIdx = isP1Turn ? 0 : 1;
                    gameState.stores[storeIdx] += seedsInPit;
                    gameState.board[pit] = 0;
                    await highlightPit(pit, 'highlight');
                    updateUI();
                } else if (isOwnPit && seedsInPit === 1) {
                    const oppositePit = 11 - pit;
                    const oppSeeds = gameState.board[oppositePit];
                    if (oppSeeds > 0) {
                        const storeIdx = isP1Turn ? 0 : 1;
                        gameState.stores[storeIdx] += oppSeeds + 1;
                        gameState.board[pit] = 0;
                        gameState.board[oppositePit] = 0;
                        await highlightPit(pit, 'highlight');
                        await highlightPit(oppositePit, 'highlight');
                        updateUI();
                    }
                }
            }

            if (checkGameOver()) { gameState.isAnimating = false; return; }
            if (!extraTurn) { gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1; }
            gameState.isAnimating = false;
            updateUI();
            if (gameState.currentPlayer === 2 && gameState.mode === 'ai') { await sleep(500); makeAIMove(); }
        }

        function getNextIndex(current, player) {
            if (player === 1) {
                if (current === 5) return 'store1';
                if (current === 'store1') return 6;
                if (current === 11) return 0;
                return current + 1;
            } else {
                if (current === 11) return 'store2';
                if (current === 'store2') return 0;
                if (current === 5) return 6;
                return current + 1;
            }
        }

        async function depositSeed(index) {
            if (index === 'store1') { gameState.stores[0]++; }
            else if (index === 'store2') { gameState.stores[1]++; }
            else { gameState.board[index]++; await highlightPit(index, 'highlight'); }
            updateUI();
            await sleep(150);
        }

        function isStore(index, player) {
            return (player === 1 && index === 'store1') || (player === 2 && index === 'store2');
        }

        function highlightPit(index, className) {
            return new Promise(resolve => {
                const el = document.getElementById('pit-' + index);
                if (el) {
                    el.classList.add(className);
                    setTimeout(() => { el.classList.remove(className); resolve(); }, 300);
                } else { resolve(); }
            });
        }

        function checkGameOver() {
            const p1Empty = gameState.board.slice(0, 6).every(seeds => seeds === 0);
            const p2Empty = gameState.board.slice(6, 12).every(seeds => seeds === 0);
            if (p1Empty || p2Empty) {
                if (p1Empty) {
                    let sum = 0;
                    for (let i = 6; i < 12; i++) { sum += gameState.board[i]; gameState.board[i] = 0; }
                    gameState.stores[0] += sum;
                } else {
                    let sum = 0;
                    for (let i = 0; i < 6; i++) { sum += gameState.board[i]; gameState.board[i] = 0; }
                    gameState.stores[1] += sum;
                }
                updateUI();
                showWinner();
                return true;
            }
            return false;
        }

        function showWinner() {
            const s1 = gameState.stores[0];
            const s2 = gameState.stores[1];
            let winnerText = '';
            if (s1 > s2) { winnerText = 'Oyuncu 1 Kazandı! 🎉'; }
            else if (s2 > s1) { winnerText = gameState.mode === 'ai' ? 'Yapay Zeka Kazandı! 🤖' : 'Oyuncu 2 Kazandı! 🎉'; }
            else { winnerText = 'Berabere! 🤝'; }
            document.getElementById('winnerText').textContent = winnerText;
            document.getElementById('scoreText').textContent = \`Oyuncu 1: \${s1} - \${gameState.mode === 'ai' ? 'Yapay Zeka' : 'Oyuncu 2'}: \${s2}\`;
            document.getElementById('winnerModal').classList.add('active');
        }

        function makeAIMove() {
            const validMoves = [];
            for (let i = 6; i < 12; i++) { if (gameState.board[i] > 0) validMoves.push(i); }
            if (validMoves.length === 0) return;
            for (let pit of validMoves) {
                const seeds = gameState.board[pit];
                if ((pit + seeds) % 13 === 11) { makeMove(pit); return; }
            }
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            makeMove(randomMove);
        }

        function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    </script>
</body>
</html>`;

  return (
    <GameShell
      gameId="mangala"
      score={0}
      gameState="playing"
      onStart={() => {}}
      onPause={() => {}}
      onResume={() => {}}
      onRestart={() => {}}
      onBack={onBack}
      hideScore
    >
      <iframe
        srcDoc={mangalaHtml}
        className="w-full h-full border-none"
        title="Türk Mangalası"
      />
    </GameShell>
  );
}
