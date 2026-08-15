import { useState, useCallback } from 'react';
import { GameId, LeaderboardEntry } from '../types';

const STORAGE_KEY = 'oyun_salonu_lb';

function getAll(): Record<string, LeaderboardEntry[]> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export function useLeaderboard(gameId: GameId) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getAll()[gameId] || []);

  const addEntry = useCallback((score: number) => {
    const all = getAll();
    const list = all[gameId] || [];
    list.push({ name: 'Oyuncu', score, date: new Date().toLocaleDateString('tr-TR') });
    list.sort((a, b) => b.score - a.score);
    all[gameId] = list.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setEntries(all[gameId]);
  }, [gameId]);

  const getHighScore = useCallback((): number => {
    const list = getAll()[gameId] || [];
    return list.length > 0 ? list[0].score : 0;
  }, [gameId]);

  return { entries, addEntry, getHighScore };
}
