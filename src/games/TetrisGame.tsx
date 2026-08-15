import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { particleEmitter } from '../components/Particles';
import { useSound } from '../hooks/useSound';

const C=10,R=20;
const S:number[][][]=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
const CL=['#6366f1','#eab308','#a855f7','#f97316','#3b82f6','#22c55e','#ef4444'];
type Board=(string|null)[][];
interface Piece{shape:number[][];color:string;x:number;y:number}
function mkBoard():Board{return Array.from({length:R},()=>Array(C).fill(null))}
function rot(s:number[][]):number[][]{const r=s.length,c=s[0].length;const o:number[][]=Array.from({length:c},()=>Array(r).fill(0));for(let i=0;i<r;i++)for(let j=0;j<c;j++)o[j][r-1-i]=s[i][j];return o}
function hit(b:Board,p:Piece):boolean{for(let r=0;r<p.shape.length;r++)for(let c=0;c<p.shape[r].length;c++)if(p.shape[r][c]){const x=p.x+c,y=p.y+r;if(x<0||x>=C||y>=R)return true;if(y>=0&&b[y][x])return true}return false}
function rp():Piece{const i=Math.floor(Math.random()*S.length);return{shape:S[i],color:CL[i],x:Math.floor(C/2)-1,y:-1}}

export function TetrisGame({onBack}:{onBack:()=>void}){
  const[gs,setGs]=useState<GameState>('menu');
  const[score,setScore]=useState(0);
  const[board,setBoard]=useState<Board>(mkBoard);
  const[piece,setPiece]=useState<Piece>(rp);
  const[level,setLevel]=useState(1);
  const[lines,setLines]=useState(0);
  const conRef=useRef<HTMLDivElement>(null);
  const{playScore,playGameOver,playTone}=useSound();
  const gsRef=useRef(gs);useEffect(()=>{gsRef.current=gs},[gs]);
  const tRef=useRef<{x:number;y:number}|null>(null);

  const lock=useCallback((b:Board,p:Piece)=>{
    const nb=b.map(r=>[...r]);
    for(let r=0;r<p.shape.length;r++)for(let c=0;c<p.shape[r].length;c++)if(p.shape[r][c]&&p.y+r>=0)nb[p.y+r][p.x+c]=p.color;
    let cl=0;for(let r=R-1;r>=0;r--)if(nb[r].every(c=>c!==null)){nb.splice(r,1);nb.unshift(Array(C).fill(null));cl++;r++}
    return{nb,cl};
  },[]);

  const mv=useCallback((dx:number,dy:number)=>{setPiece(p=>{const n={...p,x:p.x+dx,y:p.y+dy};return hit(board,n)?p:n})},[board]);
  const rt=useCallback(()=>{setPiece(p=>{const n={...p,shape:rot(p.shape)};if(!hit(board,n))return n;for(const k of[-1,1,-2,2]){const kk={...n,x:n.x+k};if(!hit(board,kk))return kk}return p})},[board]);
  const hd=useCallback(()=>{setPiece(p=>{let n={...p};while(!hit(board,{...n,y:n.y+1}))n.y++;return n})},[board]);

  const start=useCallback(()=>{setBoard(mkBoard());setPiece(rp());setScore(0);setLevel(1);setLines(0);setGs('playing')},[]);

  useEffect(()=>{
    if(gs!=='playing')return;
    const sp=Math.max(80,500-(level-1)*40);
    const iv=setInterval(()=>{
      setPiece(prev=>{
        const d={...prev,y:prev.y+1};
        if(!hit(board,d))return d;
        const{nb,cl}=lock(board,prev);
        if(prev.y<=0){playGameOver();setGs('gameover');return prev}
        setBoard(nb);
        if(cl>0){const pts=[0,100,300,500,800][cl]*level;setScore(s=>s+pts);setLines(l=>{const nl=l+cl;setLevel(Math.floor(nl/10)+1);return nl});playScore();
          if(conRef.current){const r=conRef.current.getBoundingClientRect();particleEmitter.emit(r.left+r.width/2,r.top+r.height/2,10,'#6366f1',`+${pts}`)}
        }else playTone(200,0.04,'sine',0.02);
        const np=rp();if(hit(nb,np)){playGameOver();setGs('gameover');return prev}return np;
      });
    },sp);
    return()=>clearInterval(iv);
  },[gs,board,level,lock,playScore,playGameOver,playTone]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(gsRef.current!=='playing')return;
      if(e.key==='ArrowLeft'||e.key==='a'){e.preventDefault();mv(-1,0)}
      if(e.key==='ArrowRight'||e.key==='d'){e.preventDefault();mv(1,0)}
      if(e.key==='ArrowDown'||e.key==='s'){e.preventDefault();mv(0,1)}
      if(e.key==='ArrowUp'||e.key==='w'){e.preventDefault();rt()}
      if(e.key===' '){e.preventDefault();hd()}
    };window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[mv,rt,hd]);

  const onTS=(e:React.TouchEvent)=>{tRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}};
  const onTE=(e:React.TouchEvent)=>{if(!tRef.current)return;const dx=e.changedTouches[0].clientX-tRef.current.x,dy=e.changedTouches[0].clientY-tRef.current.y;
    if(Math.abs(dx)<15&&Math.abs(dy)<15){rt();return}
    if(Math.abs(dx)>Math.abs(dy))mv(dx>0?1:-1,0);else if(dy>0)dy>60?hd():mv(0,1);
  };

  let ghost={...piece,y:piece.y};while(!hit(board,{...ghost,y:ghost.y+1}))ghost.y++;
  const cs='min(4vw,3.5vh)';

  return(
    <GameShell gameId="tetris" score={score} gameState={gs} onStart={start} onPause={()=>setGs('paused')} onResume={()=>setGs('playing')} onRestart={start} onBack={onBack} extraInfo={`Sv.${level} Satır:${lines}`}>
      <div ref={conRef} className="absolute inset-0 flex items-center justify-center" onTouchStart={onTS} onTouchEnd={onTE}>
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-0.5 shadow-lg">
          <div className="grid gap-0" style={{gridTemplateColumns:`repeat(${C},${cs})`,gridTemplateRows:`repeat(${R},${cs})`}}>
            {board.map((row,r)=>row.map((cell,c)=>{
              let isGhost=false,isPiece=false,color=cell;
              for(let pr=0;pr<piece.shape.length;pr++)for(let pc=0;pc<piece.shape[pr].length;pc++)
                if(piece.shape[pr][pc]&&piece.y+pr===r&&piece.x+pc===c){isPiece=true;color=piece.color}
              if(!isPiece&&!cell)for(let pr=0;pr<ghost.shape.length;pr++)for(let pc=0;pc<ghost.shape[pr].length;pc++)
                if(ghost.shape[pr][pc]&&ghost.y+pr===r&&ghost.x+pc===c){isGhost=true;color=piece.color}
              return <div key={`${r}-${c}`} className="border border-gray-100" style={{width:cs,height:cs,backgroundColor:color||'#f8fafc',opacity:isGhost?0.2:1,boxShadow:(isPiece||cell)?'inset 0 0 3px rgba(255,255,255,0.4)':'none',borderRadius:2}} />;
            }))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden z-10">
        <button className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg active:bg-indigo-100 shadow-sm" onTouchStart={()=>mv(-1,0)}>←</button>
        <button className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg active:bg-indigo-100 shadow-sm" onTouchStart={()=>rt()}>↻</button>
        <button className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg active:bg-indigo-100 shadow-sm" onTouchStart={()=>mv(0,1)}>↓</button>
        <button className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg active:bg-indigo-100 shadow-sm" onTouchStart={()=>hd()}>⏬</button>
        <button className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg active:bg-indigo-100 shadow-sm" onTouchStart={()=>mv(1,0)}>→</button>
      </div>
    </GameShell>
  );
}
