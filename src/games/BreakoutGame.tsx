import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';
const BR=5,BC=8,PW=80,PH=12,BALL=6;
interface Brick{x:number;y:number;w:number;h:number;alive:boolean;color:string}

export function BreakoutGame({onBack}:{onBack:()=>void}){
  const[gs,setGs]=useState<GameState>('menu');const[score,setScore]=useState(0);
  const canRef=useRef<HTMLCanvasElement>(null);const conRef=useRef<HTMLDivElement>(null);
  const st=useRef({px:0,bx:0,by:0,bvx:3,bvy:-3,bricks:[] as Brick[],score:0,lives:3});
  const{playScore,playHit,playGameOver,playTone}=useSound();
  const gsRef=useRef<GameState>('menu');useEffect(()=>{gsRef.current=gs},[gs]);
  const mxRef=useRef(0);const txRef=useRef<number|null>(null);

  const mkBricks=useCallback((W:number)=>{
    const bs:Brick[]=[];const bw=(W-40)/BC;const bh=20;
    const cl=['#ef4444','#f97316','#eab308','#22c55e','#3b82f6'];
    for(let r=0;r<BR;r++)for(let c=0;c<BC;c++)bs.push({x:20+c*bw,y:50+r*(bh+4),w:bw-4,h:bh,alive:true,color:cl[r]});return bs;
  },[]);

  const start=useCallback(()=>{const c=conRef.current;if(!c)return;const W=c.clientWidth,H=c.clientHeight;
    st.current={px:W/2-PW/2,bx:W/2,by:H-60,bvx:3*(Math.random()>0.5?1:-1),bvy:-3.5,bricks:mkBricks(W),score:0,lives:3};setScore(0);setGs('playing')},[mkBricks]);

  useEffect(()=>{
    const hm=(e:MouseEvent)=>{mxRef.current=e.clientX};const ht=(e:TouchEvent)=>{txRef.current=e.touches[0]?.clientX??null};
    window.addEventListener('mousemove',hm);window.addEventListener('touchmove',ht,{passive:true});window.addEventListener('touchstart',ht,{passive:true});
    return()=>{window.removeEventListener('mousemove',hm);window.removeEventListener('touchmove',ht);window.removeEventListener('touchstart',ht)};
  },[]);

  useEffect(()=>{
    const keys=new Set<string>();
    const d=(e:KeyboardEvent)=>keys.add(e.key);const u=(e:KeyboardEvent)=>keys.delete(e.key);
    window.addEventListener('keydown',d);window.addEventListener('keyup',u);
    const iv=setInterval(()=>{if(gsRef.current!=='playing')return;const c=conRef.current;if(!c)return;const W=c.clientWidth;const s=st.current;
      if(keys.has('ArrowLeft')||keys.has('a'))s.px=Math.max(0,s.px-8);if(keys.has('ArrowRight')||keys.has('d'))s.px=Math.min(W-PW,s.px+8);},16);
    return()=>{window.removeEventListener('keydown',d);window.removeEventListener('keyup',u);clearInterval(iv)};
  },[]);

  useEffect(()=>{
    if(gs!=='playing')return;const can=canRef.current;const con=conRef.current;if(!can||!con)return;
    const ctx=can.getContext('2d')!;let id:number;
    const loop=()=>{
      const W=con.clientWidth,H=con.clientHeight;can.width=W;can.height=H;const s=st.current;
      if(txRef.current!==null){const r=con.getBoundingClientRect();s.px=Math.max(0,Math.min(W-PW,txRef.current-r.left-PW/2))}
      else if(mxRef.current){const r=con.getBoundingClientRect();const mx=mxRef.current-r.left;if(mx>0&&mx<W)s.px=Math.max(0,Math.min(W-PW,mx-PW/2))}
      s.bx+=s.bvx;s.by+=s.bvy;
      if(s.bx<=BALL||s.bx>=W-BALL){s.bvx*=-1;playTone(300,0.03,'sine',0.03)}
      if(s.by<=BALL){s.bvy=Math.abs(s.bvy);playTone(300,0.03,'sine',0.03)}
      if(s.by+BALL>=H-PH-10&&s.by+BALL<=H-5&&s.bx>=s.px&&s.bx<=s.px+PW){s.bvx=(s.bx-s.px)/PW*6-3;s.bvy=-Math.abs(s.bvy)-0.05;playHit()}
      if(s.by>H+20){s.lives--;if(s.lives<=0){playGameOver();setGs('gameover');return}s.bx=W/2;s.by=H-60;s.bvx=3*(Math.random()>0.5?1:-1);s.bvy=-3.5;playTone(150,0.15,'triangle',0.04)}
      for(const b of s.bricks){if(!b.alive)continue;if(s.bx+BALL>b.x&&s.bx-BALL<b.x+b.w&&s.by+BALL>b.y&&s.by-BALL<b.y+b.h){b.alive=false;s.bvy*=-1;s.score+=10;setScore(s.score);playScore();
        const r=con.getBoundingClientRect();particleEmitter.emit(r.left+b.x+b.w/2,r.top+b.y+b.h/2,5,b.color,'+10');break}}
      if(s.bricks.every(b=>!b.alive)){s.score+=500;setScore(s.score);s.bricks=mkBricks(W);s.bvx*=1.1;s.bvy*=1.1}

      // Draw
      ctx.fillStyle='#f0f4f8';ctx.fillRect(0,0,W,H);
      for(const b of s.bricks){if(!b.alive)continue;ctx.fillStyle=b.color;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(b.x,b.y,b.w,b.h/3);ctx.strokeStyle='rgba(0,0,0,0.1)';ctx.lineWidth=1;ctx.strokeRect(b.x,b.y,b.w,b.h)}
      // Paddle
      ctx.fillStyle='#6366f1';ctx.fillRect(s.px,H-PH-10,PW,PH);ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(s.px,H-PH-10,PW,PH/3);
      // Ball
      ctx.fillStyle='#1e293b';ctx.beginPath();ctx.arc(s.bx,s.by,BALL,0,Math.PI*2);ctx.fill();
      ctx.shadowColor='#6366f1';ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;
      // Lives
      ctx.fillStyle='#ef4444';ctx.font='14px Nunito';for(let i=0;i<s.lives;i++)ctx.fillText('♥',10+i*20,H-2);
      id=requestAnimationFrame(loop);
    };
    id=requestAnimationFrame(loop);return()=>cancelAnimationFrame(id);
  },[gs,playScore,playHit,playGameOver,playTone,mkBricks]);

  return(
    <GameShell gameId="breakout" score={score} gameState={gs} onStart={start} onPause={()=>setGs('paused')} onResume={()=>setGs('playing')} onRestart={start} onBack={onBack}>
      <div ref={conRef} className="absolute inset-0"><canvas ref={canRef} className="w-full h-full" /></div>
    </GameShell>
  );
}
