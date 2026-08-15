import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';
const SZ=4;type Grid=number[][];
function eg():Grid{return Array.from({length:SZ},()=>Array(SZ).fill(0))}
function addR(g:Grid):Grid{const n=g.map(r=>[...r]);const e:[number,number][]=[];n.forEach((r,ri)=>r.forEach((v,ci)=>{if(v===0)e.push([ri,ci])}));if(!e.length)return n;const[r,c]=e[Math.floor(Math.random()*e.length)];n[r][c]=Math.random()<0.9?2:4;return n}
function slide(row:number[]):{r:number[];s:number;m:boolean}{const f=row.filter(v=>v!==0);let s=0;let m=false;const r:number[]=[];let i=0;while(i<f.length){if(i+1<f.length&&f[i]===f[i+1]){const v=f[i]*2;r.push(v);s+=v;i+=2}else{r.push(f[i]);i++}}while(r.length<SZ)r.push(0);if(r.some((v,i)=>v!==row[i]))m=true;return{r,s,m}}
function moveG(g:Grid,d:'left'|'right'|'up'|'down'):{g:Grid;s:number;m:boolean}{let ts=0,am=false;let n=g.map(r=>[...r]);
  if(d==='left')n=n.map(r=>{const{r:res,s,m}=slide(r);ts+=s;if(m)am=true;return res});
  else if(d==='right')n=n.map(r=>{const{r:res,s,m}=slide([...r].reverse());ts+=s;if(m)am=true;return res.reverse()});
  else if(d==='up'){for(let c=0;c<SZ;c++){const col=n.map(r=>r[c]);const{r:res,s,m}=slide(col);ts+=s;if(m)am=true;res.forEach((v,r)=>{n[r][c]=v})}}
  else{for(let c=0;c<SZ;c++){const col=n.map(r=>r[c]).reverse();const{r:res,s,m}=slide(col);ts+=s;if(m)am=true;res.reverse().forEach((v,r)=>{n[r][c]=v})}}
  return{g:n,s:ts,m:am};}
function canMv(g:Grid):boolean{for(let r=0;r<SZ;r++)for(let c=0;c<SZ;c++){if(g[r][c]===0)return true;if(c+1<SZ&&g[r][c]===g[r][c+1])return true;if(r+1<SZ&&g[r][c]===g[r+1][c])return true}return false}
const TC:Record<number,{bg:string;tx:string}>={0:{bg:'#f1f5f9',tx:'transparent'},2:{bg:'#e2e8f0',tx:'#475569'},4:{bg:'#cbd5e1',tx:'#334155'},8:{bg:'#fb923c',tx:'#fff'},16:{bg:'#f97316',tx:'#fff'},32:{bg:'#ef4444',tx:'#fff'},64:{bg:'#dc2626',tx:'#fff'},128:{bg:'#eab308',tx:'#fff'},256:{bg:'#ca8a04',tx:'#fff'},512:{bg:'#a855f7',tx:'#fff'},1024:{bg:'#7c3aed',tx:'#fff'},2048:{bg:'#22c55e',tx:'#fff'}};

export function Game2048({onBack}:{onBack:()=>void}){
  const[gs,setGs]=useState<GameState>('menu');const[score,setScore]=useState(0);
  const[grid,setGrid]=useState<Grid>(()=>addR(addR(eg())));const[anim,setAnim]=useState<Set<string>>(new Set());
  const conRef=useRef<HTMLDivElement>(null);const tRef=useRef<{x:number;y:number}|null>(null);
  const{playScore,playGameOver,playTone,playWin}=useSound();

  const start=useCallback(()=>{setGrid(addR(addR(eg())));setScore(0);setGs('playing')},[]);

  const move=useCallback((d:'left'|'right'|'up'|'down')=>{
    if(gs!=='playing')return;
    setGrid(prev=>{const{g,s,m}=moveG(prev,d);if(!m)return prev;const wn=addR(g);
      if(s>0){setScore(sc=>sc+s);playScore();if(conRef.current){const r=conRef.current.getBoundingClientRect();particleEmitter.emit(r.left+r.width/2,r.top+r.height/2,5,'#ec4899',`+${s}`)}}else playTone(400,0.03,'sine',0.02);
      if(wn.flat().includes(2048))playWin();
      const a=new Set<string>();for(let r=0;r<SZ;r++)for(let c=0;c<SZ;c++)if(wn[r][c]!==g[r][c])a.add(`${r}-${c}`);setAnim(a);setTimeout(()=>setAnim(new Set()),200);
      if(!canMv(wn))setTimeout(()=>{playGameOver();setGs('gameover')},300);return wn;});
  },[gs,playScore,playGameOver,playTone,playWin]);

  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(gs!=='playing')return;
    if(e.key==='ArrowLeft'||e.key==='a'){e.preventDefault();move('left')}if(e.key==='ArrowRight'||e.key==='d'){e.preventDefault();move('right')}
    if(e.key==='ArrowUp'||e.key==='w'){e.preventDefault();move('up')}if(e.key==='ArrowDown'||e.key==='s'){e.preventDefault();move('down')}};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[gs,move]);

  const onTS=(e:React.TouchEvent)=>{tRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
  const onTE=(e:React.TouchEvent)=>{if(!tRef.current)return;const dx=e.changedTouches[0].clientX-tRef.current.x,dy=e.changedTouches[0].clientY-tRef.current.y;
    if(Math.abs(dx)<30&&Math.abs(dy)<30)return;Math.abs(dx)>Math.abs(dy)?move(dx>0?'right':'left'):move(dy>0?'down':'up')};

  return(
    <GameShell gameId="2048" score={score} gameState={gs} onStart={start} onPause={()=>setGs('paused')} onResume={()=>setGs('playing')} onRestart={start} onBack={onBack}>
      <div ref={conRef} className="absolute inset-0 flex items-center justify-center p-4" onTouchStart={onTS} onTouchEnd={onTE}>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-xs bg-white border-2 border-gray-200 rounded-2xl p-3 shadow-lg">
          {grid.flat().map((v,i)=>{const r=Math.floor(i/SZ),c=i%SZ;const cl=TC[v]||{bg:'#22c55e',tx:'#fff'};
            return(<div key={`${r}-${c}`} className={`aspect-square rounded-xl flex items-center justify-center font-extrabold transition-all duration-150 ${anim.has(`${r}-${c}`)?'animate-pop':''}`}
              style={{backgroundColor:cl.bg,color:cl.tx,fontSize:v>=1024?'0.7rem':v>=128?'0.9rem':'1.1rem'}}>{v>0?v:''}</div>)})}
        </div>
      </div>
    </GameShell>
  );
}
