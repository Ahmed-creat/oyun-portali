import { useState, useEffect } from 'react';

interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; text?: string; }
let pid = 0;

export const particleEmitter = {
  listeners: [] as ((p: Particle[]) => void)[],
  emit(x: number, y: number, count: number, color: string, text?: string) {
    const ps: Particle[] = [];
    for (let i = 0; i < count; i++) {
      ps.push({ id: pid++, x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 2, color, size: Math.random() * 5 + 2, life: 1, text: i === 0 ? text : undefined });
    }
    this.listeners.forEach(fn => fn(ps));
  },
};

export function ParticleLayer() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const h = (np: Particle[]) => setParticles(p => [...p, ...np].slice(-60));
    particleEmitter.listeners.push(h);
    return () => { particleEmitter.listeners = particleEmitter.listeners.filter(l => l !== h); };
  }, []);

  useEffect(() => {
    if (!particles.length) return;
    const r = requestAnimationFrame(() => {
      setParticles(p => p.map(pp => ({ ...pp, x: pp.x + pp.vx, y: pp.y + pp.vy, vy: pp.vy + 0.12, life: pp.life - 0.03 })).filter(pp => pp.life > 0));
    });
    return () => cancelAnimationFrame(r);
  }, [particles]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map(p => (
        <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, opacity: p.life, transform: `scale(${p.life})` }}>
          {p.text ? <span className="font-bold text-sm whitespace-nowrap" style={{ color: p.color }}>{p.text}</span>
           : <div className="rounded-full" style={{ width: p.size, height: p.size, backgroundColor: p.color, boxShadow: `0 0 ${p.size}px ${p.color}` }} />}
        </div>
      ))}
    </div>
  );
}
