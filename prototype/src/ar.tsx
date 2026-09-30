import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { chapters } from './game';
import './ar.css';
type Pose = {x:number;z:number;yaw:number};
type Vec = [number,number,number];
const targets = [{x:0,z:-20},{x:20,z:-42},{x:-4,z:-70}];
const START:Pose={x:0,z:4,yaw:0};
const route:Vec[]=[[0,0,4],[0,0,-20],[0,0,-30],[20,0,-30],[20,0,-42],[20,0,-58],[-4,0,-58],[-4,0,-70]];
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function ARDemo(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const pose=useRef<Pose>({...START});
 const keys=useRef(new Set<string>());
 const targetRef=useRef(0);
 const blocked=useRef(false);
 const [step,setStep]=useState(0);
 const [reading,setReading]=useState(false);
 const [correct,setCorrect]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [finished,setFinished]=useState(false);
 const [help,setHelp]=useState(true);
 const [hud,setHud]=useState({distance:24,angle:0});
 const [displayOnly,setDisplayOnly]=useState(false);
 const displayRef=useRef(false);
 const drag=useRef<{id:number;x:number;yaw:number}|null>(null);
 const title=useRef<HTMLHeadingElement>(null);
 targetRef.current=step; blocked.current=reading||help||finished; displayRef.current=displayOnly;
 useEffect(()=>{keys.current.clear();if(reading)title.current?.focus();},[reading,help,finished]);
 useEffect(()=>{
  const el=canvas.current!;const ctx=el.getContext('2d')!;
  let width=600,height=600,last=0,frame=0,ui=0;
  const resize=()=>{width=el.clientWidth;height=el.clientHeight;const ratio=Math.min(devicePixelRatio,2);el.width=width*ratio;el.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);};
  const ro=new ResizeObserver(resize);ro.observe(el);resize();
  const down=(e:KeyboardEvent)=>{if(blocked.current)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();keys.current.add(e.key.toLowerCase());}};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
  const blur=()=>{keys.current.clear();drag.current=null;};
  const visibility=()=>{blur();if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=0;frame=requestAnimationFrame(draw);}};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  const project=(v:Vec):[number,number,number]|null=>{const p=pose.current,dx=v[0]-p.x,dz=v[2]-p.z,c=Math.cos(p.yaw),s=Math.sin(p.yaw);const depth=dx*s-dz*c;if(depth<.18)return null;const side=dx*c+dz*s;const f=Math.min(width,height)*.87;return[width/2+side/depth*f,height*.45-(v[1]-1.7)/depth*f,depth];};
  const line=(a:Vec,b:Vec,color:string,lw=1)=>{const aa=project(a),bb=project(b);if(!aa||!bb)return;ctx.beginPath();ctx.moveTo(aa[0],aa[1]);ctx.lineTo(bb[0],bb[1]);ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.stroke();};
  const face=(points:Vec[],color:string)=>{const q=points.map(project);if(q.some(p=>!p))return;ctx.beginPath();q.forEach((p,i)=>i?ctx.lineTo(p![0],p![1]):ctx.moveTo(p![0],p![1]));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
  const box=(x:number,z:number,w:number,d:number,h:number,color:string)=>{
   const a:Vec=[x,0,z],b:Vec=[x+w,0,z],c:Vec=[x+w,0,z-d],d1:Vec=[x,0,z-d];
   face([a,b,[b[0],h,b[2]],[a[0],h,a[2]]],color);
   face([b,c,[c[0],h,c[2]],[b[0],h,b[2]]],'#33494b');
   face([d1,a,[a[0],h,a[2]],[d1[0],h,d1[2]]],'#34474a');
   face([[x,h,z],[x+w,h,z],[x+w,h,z-d],[x,h,z-d]],'#50615e');
   for(let yy=1.4;yy<h-.7;yy+=2.3)for(let xx=x+.7;xx<x+w-.5;xx+=1.5)face([[xx,yy,z+.02],[xx+.7,yy,z+.02],[xx+.7,yy+.9,z+.02],[xx,yy+.9,z+.02]],'#b8b59655');
  };
  const buildings=[[-18,-7,7,9,8], [8,-6,9,9,6],[-16,-29,8,11,10],[30,-27,8,12,8],[-18,-48,9,11,7],[30,-49,10,12,11],[-18,-76,8,10,12],[10,-80,10,9,9]];
  function draw(now:number){
   frame=requestAnimationFrame(draw);if(now-last<33)return;const dt=Math.min((now-last)/1000,.08);last=now;
   const p=pose.current,t=targets[targetRef.current];
   if(!blocked.current){if(keys.current.has('arrowleft')||keys.current.has('a'))p.yaw-=dt*1.3;if(keys.current.has('arrowright')||keys.current.has('d'))p.yaw+=dt*1.3;const forward=(keys.current.has('arrowup')||keys.current.has('w')?1:0)-(keys.current.has('arrowdown')||keys.current.has('s')?1:0);p.x=clamp(p.x+Math.sin(p.yaw)*forward*dt*4.5,-7,25);p.z=clamp(p.z-Math.cos(p.yaw)*forward*dt*4.5,-76,10);}
   const dist=Math.hypot(t.x-p.x,t.z-p.z),bearing=Math.atan2(t.x-p.x,-(t.z-p.z));const angle=Math.atan2(Math.sin(bearing-p.yaw),Math.cos(bearing-p.yaw));
   if(now-ui>120){ui=now;setHud({distance:dist,angle});}
   ctx.clearRect(0,0,width,height);
   if(!displayRef.current){
    const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#172f40');sky.addColorStop(.46,'#85998e');sky.addColorStop(.47,'#4a5c51');sky.addColorStop(1,'#263932');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#e4dcc28a';ctx.beginPath();ctx.arc(width*.78,height*.19,22,0,Math.PI*2);ctx.fill();
    for(let z=-100;z<=15;z+=5)line([-35,0,z],[40,0,z],'#c9d5be15');
    for(let x=-35;x<=40;x+=5)line([x,0,-100],[x,0,15],'#c9d5be12');
    for(let i=0;i<route.length-1;i++){const a=route[i],b=route[i+1],vx=b[0]-a[0],vz=b[2]-a[2],len=Math.hypot(vx,vz),nx=-vz/len*2.6,nz=vx/len*2.6;face([[a[0]+nx,.01,a[2]+nz],[b[0]+nx,.01,b[2]+nz],[b[0]-nx,.01,b[2]-nz],[a[0]-nx,.01,a[2]-nz]],'#6f797055');}
    [...buildings].sort((a,b)=>Math.hypot(b[0]-p.x,b[1]-p.z)-Math.hypot(a[0]-p.x,a[1]-p.z)).forEach(b=>box(b[0],b[1],b[2],b[3],b[4],'#435855'));
    for(const [x,z] of [[-5,-15],[6,-23],[26,-39],[-9,-65],[3,-73]]){line([x,0,z],[x,3.3,z],'#5b5141',4);const q=project([x,3.6,z]);if(q){ctx.fillStyle='#4e775b';ctx.beginPath();ctx.arc(q[0],q[1],Math.min(width,height)*1.15/q[2],0,Math.PI*2);ctx.fill();}}
    for(const t1 of targets)box(t1.x-2,t1.z-1,2,.6,.6,'#958369');
   }
   // The path and clue are anchored only in this synthetic scene, not in the physical world.
   const end=[1,4,7][targetRef.current],start=targetRef.current===0?0:[1,4][targetRef.current-1];
   ctx.shadowColor='#89ffde';ctx.shadowBlur=12;
   for(let i=start;i<end;i++){const a=route[i],b=route[i+1];line([a[0],.055,a[2]],[b[0],.055,b[2]],'#8effd9aa',3);const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
    for(let n=2;n<length;n+=3){const x=a[0]+ux*n,z=a[2]+uz*n;line([x-ux*.6-uz*.4,.07,z-uz*.6+ux*.4],[x,.07,z],'#a0ffe3',3);line([x-ux*.6+uz*.4,.07,z-uz*.6-ux*.4],[x,.07,z],'#a0ffe3',3);}}
   const pulse=.08*Math.sin(now*.0015);const center:Vec=[t.x,1.7+pulse,t.z];
   for(let n=0;n<40;n++){const a=n/40*Math.PI*2,b=(n+1)/40*Math.PI*2;line([t.x+Math.cos(a)*1.1,.09,t.z+Math.sin(a)*1.1],[t.x+Math.cos(b)*1.1,.09,t.z+Math.sin(b)*1.1],'#a4ffda',2);}
   line([t.x,.1,t.z],[t.x,1.2,t.z],'#8bffdc99',2);
   const q=project(center);if(q){const size=clamp(Math.min(width,height)*.7/q[2],15,95);ctx.save();ctx.translate(q[0],q[1]);ctx.strokeStyle='#adffe7';ctx.fillStyle='#47bdbb32';ctx.lineWidth=2;ctx.beginPath();ctx.rect(-size/2,-size*.34,size,size*.68);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-size/2,-size*.34);ctx.lineTo(0,size*.08);ctx.lineTo(size/2,-size*.34);ctx.stroke();ctx.shadowBlur=0;ctx.font='600 13px sans-serif';ctx.textAlign='center';ctx.fillStyle='#defff3';ctx.fillText(['나뭇잎의 기록','파도의 엽서','별의 약속'][targetRef.current],0,-size*.34-18);ctx.font='11px sans-serif';ctx.fillText(`${Math.round(dist)} m · 단서 0${targetRef.current+1}`,0,size*.34+22);ctx.restore();}
   ctx.shadowBlur=0;
  }
  frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);ro.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const hold=(key:string)=>({onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);},onPointerUp:()=>keys.current.delete(key),onPointerCancel:()=>keys.current.delete(key),onLostPointerCapture:()=>keys.current.delete(key)});
 function investigate(){if(hud.distance>4)return;keys.current.clear();setReading(true);setFeedback('');setCorrect(false);}
 function next(){setReading(false);setCorrect(false);setFeedback('');if(step<2)setStep(step+1);else setFinished(true);}
 return <div className={`ar-app ${displayOnly?'display-only':''}`}>
  <canvas ref={canvas} aria-label="가상 동네의 1인칭 AR 콘셉트 장면" onPointerDown={e=>{if(blocked.current)return;drag.current={id:e.pointerId,x:e.clientX,yaw:pose.current.yaw};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current?.id===e.pointerId)pose.current.yaw=drag.current.yaw+(e.clientX-drag.current.x)*.006;}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}/>
  <header className="ar-top"><a href="/">✧ 비밀동네</a><span>AR 콘셉트 시뮬레이션</span><button onClick={()=>setHelp(true)} aria-label="체험 설명">?</button></header>
  <div className="ar-mode"><button onClick={()=>setDisplayOnly(!displayOnly)}>{displayOnly?'가상 동네 배경 켜기':'투명 HUD 미리보기'}</button><span>{displayOnly?'검정 부분은 Display에서 투명하게 보이는 영역':'가상 공간 · 실제 GPS / 공간 추적 아님'}</span></div>
  {!reading&&!finished&&<><section className="quest"><span>CASE 001 · 단서 {step+1} / 3</span><h1>{chapters[step].name}</h1><div className="bearing"><b style={{transform:`rotate(${hud.angle}rad)`}}>↑</b><strong>{Math.round(hud.distance)}<small>m</small></strong><p>{hud.distance<=4?'단서 도착 · 조사할 수 있어요':Math.abs(hud.angle)>.5?(hud.angle>0?'오른쪽을 둘러보세요':'왼쪽을 둘러보세요'):'빛나는 길을 따라가세요'}</p></div></section><div className="crosshair">+</div><div className="ar-bottom"><button className="investigate" disabled={hud.distance>4} onClick={investigate}>{hud.distance<=4?'✧ 단서 조사하기':'단서 가까이 이동하세요'}</button><div className="movement"><button aria-label="왼쪽으로 보기" {...hold('a')}>↶</button><button className="forward" aria-label="앞으로 걷기" {...hold('w')}>↑<small>누르고 걷기</small></button><button aria-label="오른쪽으로 보기" {...hold('d')}>↷</button><button aria-label="뒤로 걷기" {...hold('s')}>↓</button></div><p>화면을 드래그해서 둘러보기 · 키보드 WASD / 방향키</p><button className="skip" onClick={()=>{const t=targets[step];pose.current={x:t.x,z:t.z+3,yaw:0};}}>이 단서 앞으로 이동 · 테스트용</button></div></>}
  {reading&&<div className="ar-dialog"><section><span className="kicker">EVIDENCE 0{step+1}</span><h1 ref={title} tabIndex={-1}>{chapters[step].subtitle}</h1><p className="evidence-text">{chapters[step].clue}</p><h2>{chapters[step].question}</h2><div className="ar-options">{chapters[step].options.map((o,i)=><button disabled={correct} key={o} className={correct&&i===chapters[step].answer?'right':''} onClick={()=>{if(i===chapters[step].answer){setCorrect(true);setFeedback(chapters[step].explanation);}else setFeedback('증거를 다시 살펴보세요. 다른 답을 고를 수 있어요.');}}>{o}</button>)}</div>{feedback&&<p role="status" className="ar-feedback">{feedback}</p>}{correct?<button className="ar-primary" onClick={next}>{step===2?'사건 해결하기':'다음 단서를 향해 →'}</button>:<button className="skip" onClick={()=>setReading(false)}>주변으로 돌아가기</button>}</section></div>}
  {finished&&<div className="ar-dialog"><section className="ar-ending"><div className="star">✧</div><span className="kicker">CASE CLOSED · 별 우표 획득</span><h1>기다린 건,<br/>미래의 나였어요.</h1><p>윤서의 세 기록을 모두 찾았습니다.<br/>장소에 남은 이야기를 따라 첫 산책을 마쳤어요.</p><blockquote>“처음 좋아했던 것들을 잊지 말자.”</blockquote><button className="ar-primary" onClick={()=>{pose.current={...START};setStep(0);setFinished(false);}}>다시 산책하기</button><a className="ar-link" href="/">편지를 남길 수 있는 원래 체험으로 →</a><p className="ar-fine">AR 콘셉트 체험의 진행은 이 화면에 머무는 동안만 유지됩니다.</p></section></div>}
  {help&&<div className="ar-dialog"><section><span className="kicker">LOOK AROUND. FOLLOW THE LIGHT.</span><h1>이번에는,<br/>이야기 속으로 걸어가요.</h1><p>가상 동네의 길 위에 안내가 빛나고,<br/>단서가 있는 곳에는 작은 봉투가 떠 있습니다.</p><ul><li>화면 드래그 또는 ← → : 둘러보기</li><li>↑ 버튼 길게 누르기 또는 W : 걷기</li><li>봉투 4m 안쪽에서 : 단서 조사</li></ul><div className="ar-disclaimer">이 장면은 원하는 AR 경험을 판단하기 위한 자체 제작 시뮬레이션입니다. 실제 거리·GPS·카메라를 사용하지 않으며, Meta Display의 공간 앵커 기능을 재현하거나 보장하지 않습니다.</div><button className="ar-primary" onClick={()=>setHelp(false)}>빛을 따라 걸어보기 →</button><a className="ar-link" href="/">기존 사건 화면으로 돌아가기</a></section></div>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<ARDemo/>);
