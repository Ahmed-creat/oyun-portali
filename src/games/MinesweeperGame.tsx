import { useState, useCallback, useRef } from 'react';
import { GameState } from '../types';
import { GameShell } from '../components/GameShell';
import { useSound } from '../hooks/useSound';
const SZ=9,MN=10;
interface Cell{mine:boolean;rev:boolean;flag:boolean;adj:number}
function mkGrid(sx?:number,sy?:number):Cell[][]{
  const g:Cell[][]=Array.from({length:SZ},()=>Array.from({length:SZ},()=>({mine:false,rev:false,flag:false,adj:0})));
  let p=0;while(p<MN){const x=Math.floor(Math.random()*SZ),y=Math.floor(Math.random()*SZ);if(g[y][x].mine)continue;if(sx!==undefined&&Math.abs(x-sx)<=1&&Math.abs(y-(sy??0))<=1)continue;g[y][x].mine=true;p++}
  for(let y=0;y<SZ;y++)for(let x=0;x<SZ;x++){let c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const ny=y+dy,nx=x+dx;if(ny>=0&&ny<SZ&&nx>=0&&nx<SZ&&g[ny][nx].mine)c++}g[y][x].adj=c}return g;
}

export function MinesweeperGame({onBack}:{onBack:()=>void}){
  const[gs,setGs]=useState<GameState>('menu');const[score,setScore]=useState(0);
  const[grid,setGrid]=useState<Cell[][]>(()=>mkGrid());const[first,setFirst]=useState(true);const[flags,setFlags]=useState(0);
  const{playScore,playHit,playGameOver,playWin,playClick}=useSound();
  const lpRef=useRef<ReturnType<typeof setTimeout>|null>(null);

  const start=useCallback(()=>{setGrid(mkGrid());setFirst(true);setScore(0);setFlags(0);setGs('playing')},[]);

  const reveal=(g:Cell[][],x:number,y:number):Cell[][]=>{
    if(x<0||x>=SZ||y<0||y>=SZ||g[y][x].rev||g[y][x].flag)return g;
    g[y][x].rev=true;if(g[y][x].adj===0&&!g[y][x].mine)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)reveal(g,x+dx,y+dy);return g;
  };

  const click=useCallback((x:number,y:number)=>{
    if(gs!=='playing')return;let g=grid.map(r=>r.map(c=>({...c})));
    if(first){g=mkGrid(x,y);setFirst(false)}
    if(g[y][x].flag||g[y][x].rev)return;playClick();
    if(g[y][x].mine){g.forEach(r=>r.forEach(c=>{if(c.mine)c.rev=true}));setGrid(g);playGameOver();setGs('gameover');return}
    reveal(g,x,y);const rv=g.flat().filter(c=>c.rev).length;setScore(rv*10);
    const ur=g.flat().filter(c=>!c.rev).length;
    if(ur===MN){playWin();setScore(rv*10+500);setTimeout(()=>setGs('gameover'),500)}else playScore();
    setGrid(g);
  },[gs,grid,first,playClick,playGameOver,playWin,playScore]);

  const flag=useCallback((x:number,y:number,e:React.MouseEvent|React.TouchEvent)=>{
    e.preventDefault();if(gs!=='playing')return;const c=grid[y][x];if(c.rev)return;playHit();
    const g=grid.map(r=>r.map(c=>({...c})));g[y][x].flag=!g[y][x].flag;setFlags(g.flat().filter(c=>c.flag).length);setGrid(g);
  },[gs,grid,playHit]);

  const CL:Record<number,string>={1:'#3b82f6',2:'#22c55e',3:'#ef4444',4:'#7c3aed',5:'#dc2626',6:'#06b6d4',7:'#1e293b',8:'#6b7280'};

  return(
    <GameShell gameId="minesweeper" score={score} gameState={gs} onStart={start} onPause={()=>setGs('paused')} onResume={()=>setGs('playing')} onRestart={start} onBack={onBack} extraInfo={`🚩 ${flags}/${MN}`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        <div className="grid gap-0.5 bg-white border-2 border-gray-200 rounded-xl p-1 shadow-lg" style={{gridTemplateColumns:`repeat(${SZ},minmax(0,1fr))`}}>
          {grid.map((row,y)=>row.map((c,x)=>(
            <button key={`${x}-${y}`} onClick={()=>click(x,y)} onContextMenu={e=>flag(x,y,e)}
              onTouchStart={()=>{lpRef.current=setTimeout(()=>flag(x,y,{preventDefault:()=>{}} as any),400)}}
              onTouchEnd={()=>{if(lpRef.current)clearTimeout(lpRef.current)}}
              className={`w-[min(9vw,5vh)] h-[min(9vw,5vh)] sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-bold rounded transition-all duration-100
                ${c.rev?c.mine?'bg-red-100':'bg-gray-50':'bg-white hover:bg-gray-100 active:scale-95 cursor-pointer border border-gray-200'}`}
              style={{color:CL[c.adj]||'#000'}}>
              {c.rev?c.mine?'💥':c.adj>0?c.adj:'':c.flag?'🚩':''}
            </button>
          )))}
        </div>
        <p className="text-text-secondary text-xs mt-3">Sağ tık veya uzun bas = bayrak</p>
      </div>
    </GameShell>
  );
}
