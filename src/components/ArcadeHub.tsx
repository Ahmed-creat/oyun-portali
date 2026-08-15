import { useState, useEffect } from 'react';
import { GAMES, GameCategory } from '../types';
import { useSound } from '../hooks/useSound';

export function ArcadeHub({ onSelectGame }: { onSelectGame: (id: string) => void }) {
  const [showIntro, setShowIntro] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { playClick } = useSound();

  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (showIntro) {
    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center cursor-pointer select-none"
        onClick={() => setShowIntro(false)}
      >
        <div className="text-center animate-pop">
          <div className="text-7xl sm:text-8xl mb-4 drop-shadow-lg">🎮</div>
          <h1 className="font-black text-4xl sm:text-6xl text-white mb-2 tracking-tight drop-shadow-md">
            Oyun Portalı
          </h1>
          <p className="text-white/90 text-base font-medium animate-pulse">
            Başlamak için ekrana dokunun
          </p>
        </div>
      </div>
    );
  }

  let highScores: Record<string, number> = {};
  try {
    const all = JSON.parse(localStorage.getItem('oyun_salonu_lb') || '{}');
    for (const [k, v] of Object.entries(all)) {
      const entries = v as any[];
      highScores[k] = entries?.[0]?.score || 0;
    }
  } catch {}

  const categories: { id: GameCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'Tüm Oyunlar', icon: '🌟' },
    { id: 'arcade', label: 'Arcade & Aksiyon', icon: '🕹️' },
    { id: 'puzzle', label: 'Bulmaca & Zeka', icon: '🧠' },
    { id: 'board', label: 'Masa & Kart', icon: '🎲' },
  ];

  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="py-5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl drop-shadow">🎮</span>
            <div>
              <h1 className="font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow">
                Oyun Portalı
              </h1>
              <p className="text-white/80 text-xs sm:text-sm font-medium">
                {GAMES.length} Harika Oyun Bir Arada!
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              placeholder="Oyun ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white placeholder-white/70 text-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <span className="absolute left-3 top-2.5 text-white/70 text-sm">🔍</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-slate-800/80 border-b border-slate-700/60 px-4 py-3 shrink-0 shadow-inner">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { playClick(); setSelectedCategory(cat.id); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {cat.id === 'all' ? GAMES.length : GAMES.filter(g => g.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {filteredGames.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="text-5xl block mb-3">🔍</span>
              <p className="text-lg font-semibold">Aradığınız oyun bulunamadı</p>
              <p className="text-sm text-slate-500 mt-1">Farklı bir arama kelimesi veya kategori deneyin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredGames.map((game, idx) => (
                <button
                  key={game.id}
                  onClick={() => { playClick(); onSelectGame(game.id); }}
                  className="bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-500 rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 group flex flex-col items-center justify-between"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="w-full flex flex-col items-center">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-3xl sm:text-4xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                      {game.icon}
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-100 group-hover:text-white transition-colors line-clamp-1 mb-1">
                      {game.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2 font-normal">
                      {game.description}
                    </p>
                  </div>

                  {highScores[game.id] > 0 ? (
                    <div className="mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <span>🏆</span>
                      <span>{highScores[game.id].toLocaleString('tr-TR')}</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
                      ▶ Oyna
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="py-2.5 px-4 bg-slate-950 border-t border-slate-800 text-center shrink-0">
        <p className="text-xs text-slate-400 font-medium">
          🎮 Favori oyununu seç ve rekorları kır!
        </p>
      </div>
    </div>
  );
}
