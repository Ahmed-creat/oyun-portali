export type GameCategory = 'arcade' | 'puzzle' | 'board';

export type GameId = 
  | 'snake' | 'flappy' | 'tetris' | 'memory' | 'tictactoe' | 'minesweeper' 
  | 'breakout' | '2048' | 'redball' | 'karekapmaca' | 'sudoku' | 'fruitmarge' 
  | 'chess' | 'battleship' | 'ludo' | 'colorconnect' | 'fruitninja' | 'puzzle'
  | 'mangala' | 'turkishcheckers' | 'quoridor' | 'uno' | 'connectfour';

export interface GameInfo {
  id: GameId;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  category: GameCategory;
  description: string;
  howToPlay: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export const GAMES: GameInfo[] = [
  // Arcade & Aksiyon
  { id: 'snake', name: 'Yılan', icon: '🐍', color: '#22c55e', gradient: 'from-green-400 to-emerald-600', category: 'arcade', description: 'Ye ve büyü!', howToPlay: 'Yön tuşları veya ekranı kaydırarak yılanı yönlendir. Yemleri ye, duvarlara ve kendine çarpma!' },
  { id: 'flappy', name: 'Zıp Zıp Kuş', icon: '🐤', color: '#eab308', gradient: 'from-yellow-400 to-amber-600', category: 'arcade', description: 'Uçarak engelleri geç!', howToPlay: 'Ekrana dokun veya boşluk tuşuna bas. Borulardan geç, yere veya tavana çarpma!' },
  { id: 'tetris', name: 'Tetris', icon: '🟦', color: '#6366f1', gradient: 'from-indigo-400 to-violet-600', category: 'arcade', description: 'Blokları diz!', howToPlay: '← → ile kaydır, ↑ ile döndür, ↓ ile hızlandır, Boşluk ile düşür. Satırları tamamla!' },
  { id: 'breakout', name: 'Tuğla Kır', icon: '🏓', color: '#f97316', gradient: 'from-orange-400 to-red-500', category: 'arcade', description: 'Tuğlaları kır!', howToPlay: 'Fareyi veya parmağını kaydırarak pedali kontrol et. Topu düşürme, tüm tuğlaları kır!' },
  { id: 'redball', name: 'Kırmızı Top', icon: '🔴', color: '#ef4444', gradient: 'from-red-400 to-red-700', category: 'arcade', description: 'Macera Seviyeleri!', howToPlay: '← → veya butonlarla hareket et, zıpla. Engelleri aş, yıldızları topla ve bayrağa ulaş!' },
  { id: 'fruitninja', name: 'Meyve Ninja', icon: '🗡️', color: '#dc2626', gradient: 'from-red-500 to-rose-700', category: 'arcade', description: 'Kes ve biç!', howToPlay: 'Ekranda uçan meyveleri parmağınla veya fare ile keserek puan topla. Bombalara dokunma!' },

  // Bulmaca & Zeka
  { id: '2048', name: '2048', icon: '🔢', color: '#ec4899', gradient: 'from-pink-400 to-rose-600', category: 'puzzle', description: 'Sayıları birleştir!', howToPlay: 'Yön tuşları veya kaydırma ile taşları hareket ettir. Aynı sayıları birleştirerek 2048\'e ulaş!' },
  { id: 'memory', name: 'Hafıza Kartları', icon: '🧠', color: '#a855f7', gradient: 'from-purple-400 to-fuchsia-600', category: 'puzzle', description: 'Eşleri bul!', howToPlay: 'Kartlara tıklayarak çevir. Aynı iki kartı eşleştir. En az hamlede bitirmeye çalış!' },
  { id: 'minesweeper', name: 'Mayın Tarlası', icon: '💣', color: '#64748b', gradient: 'from-slate-400 to-gray-600', category: 'puzzle', description: 'Mayınlardan kaç!', howToPlay: 'Tıklayarak kareleri aç. Sayılar çevredeki mayın sayısını gösterir. Sağ tık veya uzun basarak bayrak koy!' },
  { id: 'sudoku', name: 'Sudoku', icon: '🧩', color: '#14b8a6', gradient: 'from-teal-400 to-emerald-600', category: 'puzzle', description: 'Sayı bulmacası!', howToPlay: 'Her satır, sütun ve 3x3 kutuya 1-9 arası sayıları yerleştir. Hiçbir sayı tekrar etmemeli!' },
  { id: 'fruitmarge', name: 'Meyve Birleştir', icon: '🍉', color: '#84cc16', gradient: 'from-lime-400 to-green-600', category: 'puzzle', description: 'Meyveleri birleştir!', howToPlay: 'Meyveleri bırak, aynı meyveler birleşerek daha büyük meyve olur. Taşırma!' },
  { id: 'colorconnect', name: 'Renk Bağla', icon: '🌈', color: '#8b5cf6', gradient: 'from-violet-400 to-purple-600', category: 'puzzle', description: 'Flow Free!', howToPlay: 'Aynı renkteki noktaları birbirine bağla. Çizgiler kesişmemeli, tüm alanı doldur!' },
  { id: 'puzzle', name: 'Yapboz', icon: '🧩', color: '#0891b2', gradient: 'from-cyan-500 to-blue-600', category: 'puzzle', description: 'Görsel Tamamlama!', howToPlay: 'Parçaları doğru yerlere sürükle veya tıkla. Resmi tamamla!' },

  // Masa & Kart Oyunları
  { id: 'mangala', name: 'Türk Mangalası', icon: '🪵', color: '#b45309', gradient: 'from-amber-600 to-yellow-800', category: 'board', description: 'Geleneksel strateji oyunu!', howToPlay: 'Kendi kuyularından birini seç ve kuyuları dağıt. Son taş hazinene gelirse tekrar oyna! En çok taşı toplayan kazanır.' },
  { id: 'uno', name: 'UNO', icon: '🎴', color: '#e11d48', gradient: 'from-rose-500 to-red-700', category: 'board', description: 'Eğlenceli Kart Oyunu!', howToPlay: 'Aynı renk veya sayıdaki kartı oyna. +2, +4, Pas ve Renk Değiştir kartlarını stratejik kullan. Elindeki tüm kartları bitir!' },
  { id: 'quoridor', name: 'Koridor (Quoridor)', icon: '🧱', color: '#d97706', gradient: 'from-amber-500 to-orange-700', category: 'board', description: 'Engeller koy, karşıya ulaş!', howToPlay: 'Piyonunu 1 kare ilerlet veya rakibin yolunu kapatmak için engel yerleştir. Karşı tarafa ilk ulaşan kazanır!' },
  { id: 'turkishcheckers', name: 'Türk Daması', icon: '⚪', color: '#475569', gradient: 'from-slate-600 to-slate-800', category: 'board', description: 'Geleneksel Dama!', howToPlay: 'Taşlar düz ve yan ilerler. Rakip taşın üzerinden atlayarak alırsın. Karşı sıraya ulaşan taş Dama olur!' },
  { id: 'connectfour', name: 'Hedef 4 (Connect 4)', icon: '🔴', color: '#2563eb', gradient: 'from-blue-500 to-indigo-700', category: 'board', description: '4 taneyi yan yana diz!', howToPlay: 'Sırayla pulları sütunlara bırak. Yatay, dikey veya çapraz 4 aynı renkte pulu ilk dizen kazanır!' },
  { id: 'chess', name: 'Satranç', icon: '♟️', color: '#78716c', gradient: 'from-stone-500 to-stone-700', category: 'board', description: 'Strateji klasiği!', howToPlay: 'Taşlara tıklayarak seç, sonra gidecek kareyi seç. Rakip kralı mat et!' },
  { id: 'karekapmaca', name: 'Kare Kapmaca', icon: '🎯', color: '#0ea5e9', gradient: 'from-sky-400 to-blue-600', category: 'board', description: 'Dots & Boxes!', howToPlay: 'Noktalar arasına çizgi çizerek kareler oluştur. Kim daha çok kare kaparsa kazanır!' },
  { id: 'tictactoe', name: 'XOX', icon: '⭕', color: '#3b82f6', gradient: 'from-blue-400 to-cyan-600', category: 'board', description: '1v1 veya Bot!', howToPlay: 'Boş karelere tıklayarak X koy. Yatay, dikey veya çapraz 3 lü sıra yap!' },
  { id: 'battleship', name: 'Amiral Battı', icon: '🚢', color: '#1d4ed8', gradient: 'from-blue-600 to-indigo-800', category: 'board', description: '1v1 veya Bot!', howToPlay: 'Gemilerini yerleştir, sonra düşman tahtasına tıklayarak ateş et. Tüm gemileri batır!' },
  { id: 'ludo', name: 'Kızma Birader', icon: '🎲', color: '#dc2626', gradient: 'from-red-500 to-orange-600', category: 'board', description: '1-4 kişilik!', howToPlay: 'Zar at ve taşlarını hareket ettir. 6 gelince tekrar at. Tüm taşlarını eve götür!' },
];
