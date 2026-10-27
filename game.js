/* NEON SKYRAIL — Infinite Hover Racer · Created by Cornelius Aurelius */
(() => {
'use strict';
const core=window.SkyrailCore, $=id=>document.getElementById(id);
const cv=$('game'),ctx=cv.getContext('2d',{alpha:false}),wrap=$('canvasWrap');
let width=800,height=540,dpr=1,state=null,selectedMode='endless',themeIndex=0;
let viewLane=1, last=0,raf=0,toastTime=0,alertTime=0,startX=null,helpOrigin=null,stars=[],sparks=[];
let sound=false,audio=null;
const root=document.documentElement;
const palettes=[
 {name:'NEON BLUE',id:'cyan',sky:['#05091e','#122857','#170e41'],road:'#0a2038',edge:'#47e9ff',edge2:'#9d73ff',hazard:'#ff5b88',glow:'#59eaff',pickup:'#84f7ff'},
 {name:'PLASMA PINK',id:'magenta',sky:['#10071e','#44194b','#1d164b'],road:'#28122f',edge:'#ff6fd4',edge2:'#a99bff',hazard:'#ffcb65',glow:'#ff83e5',pickup:'#ffc4f3'},
 {name:'SOLAR GOLD',id:'gold',sky:['#1c0e1c','#553039','#2b1c31'],road:'#302330',edge:'#ffcf69',edge2:'#ff7e9b',hazard:'#ff506d',glow:'#ffe090',pickup:'#ffe1a6'}
];
const bestKey='ca_skyrail_2026_bests';
function storageGet(){try{return JSON.parse(localStorage.getItem(bestKey)||'{}')}catch{return {}}}
function storageSet(obj){try{localStorage.setItem(bestKey,JSON.stringify(obj))}catch{}}
const format=n=>Math.floor(n).toLocaleString('en-GB');
function showToast(message){const x=$('toast');x.textContent=message;x.classList.add('visible');clearTimeout(toastTime);toastTime=setTimeout(()=>x.classList.remove('visible'),1900)}
function flash(message){const a=$('alert');a.textContent=message;a.classList.add('visible');clearTimeout(alertTime);alertTime=setTimeout(()=>a.classList.remove('visible'),650)}
function playTone(freq,duration=.09,type='sine',gain=.035){if(!sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(50,freq*.68),t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.01)}catch{}}
function toggleSound(){sound=!sound;$('soundBtn').textContent=sound?'♫ SOUND ON':'♪ SOUND OFF';$('soundBtn').setAttribute('aria-pressed',String(sound));showToast(sound?'Sound enabled':'Sound muted');if(sound)playTone(540)}
function setTheme(i){themeIndex=(i+palettes.length)%palettes.length;const t=palettes[themeIndex];root.setAttribute('data-theme',t.id);$('themeBtn').textContent='◈ '+t.name;try{localStorage.setItem('ca_skyrail_theme',String(themeIndex))}catch{}}
function resize(){const rect=wrap.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.floor(width*dpr);cv.height=Math.floor(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);stars=Array.from({length:70},(_,i)=>({x:((i*127+13)%991)/991*width,y:((i*97+31)%871)/871*height*.67,r:i%7===0?1.5:.6}));}
function showScreen(name){for(const id of ['startScreen','pauseScreen','endScreen'])$(id).classList.toggle('hidden',id!==name);}
function setMode(mode){selectedMode=mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));}
function start(){state=core.newGame(selectedMode,(Math.random()*2147483647)|0);viewLane=1;sparks=[];showScreen('');$('pauseBtn').disabled=false;updateHUD();flash('GO!');playTone(650,.22);}
function menu(){state=null;setMode(selectedMode);showScreen('startScreen');$('pauseBtn').disabled=true;updateHUD();}
function finish(){if(!state)return;const b=storageGet();if(state.mode!=='training'&&state.score>(b[state.mode]||0)){b[state.mode]=state.score;storageSet(b);showToast('NEW PERSONAL BEST! ✦')}
 $('endLabel').textContent=state.mode==='rush'&&state.elapsed>=90?'TIME COMPLETE':'FLIGHT TERMINATED';
 $('endTitle').innerHTML=state.mode==='rush'&&state.elapsed>=90?'RUSH <em>COMPLETE</em>':'RUN <em>COMPLETE</em>';
 $('resultDist').textContent=format(state.distance)+'m';$('resultScore').textContent=format(state.score);$('resultCombo').textContent=state.bestCombo+'×';$('pauseBtn').disabled=true;showScreen('endScreen');updateHUD();playTone(150,.26,'sawtooth',.025);}
function togglePause(){if(!state||state.status==='over')return;core.pause(state);if(state.status==='paused'){showScreen('pauseScreen');$('pauseBtn').textContent='▶ RESUME'}else{showScreen('');$('pauseBtn').textContent='Ⅱ PAUSE'}updateHUD();}
function updateHUD(){const s=state,b=storageGet(),running=s&&s.status==='running';$('distance').textContent=String(s?Math.floor(s.distance):0).padStart(4,'0');$('speed').textContent=String(s?Math.floor(s.speed):110);$('score').textContent=String(s?s.score:0).padStart(6,'0');$('best').textContent=String(b[s?.mode||selectedMode]||0).padStart(6,'0');$('integrityText').textContent=!s?'SHIELDS ◆ ◆ ◆':s.mode==='training'?'TRAINING · NO DAMAGE':'SHIELDS '+('◆ '.repeat(Math.max(0,s.lives))).trim();$('comboText').textContent='COMBO '+(s?.combo||0)+'×';$('energyBar').style.width=(s?.energy||0)+'%';$('energyText').textContent=(s?.energy||0)+'% / BOOST AT 100%';$('boostBtn').disabled=!running||s.energy<100||s.boostLeft>0;$('boostBtn').innerHTML=s?.boostLeft>0?'⚡ ACTIVE <small>DOUBLE SCORE</small>':'⚡ BOOST <small>'+(s?.energy||0)+'%</small>';$('modeTag').textContent=({endless:'∞ ENDLESS RUN',rush:'⏱ RUSH '+Math.max(0,90-Math.floor(s?.elapsed||0))+'S',training:'✦ TRAINING'})[s?.mode||selectedMode];const zone=s?Math.min(99,Math.floor(s.distance/270)+1):1;$('zoneTag').textContent='ZONE '+String(zone).padStart(2,'0')+' · '+(['IGNITION','AFTERGLOW','ION STORM','OVERDRIVE','SINGULARITY'][(zone-1)%5]);}
function steer(dir){if(!state||state.status!=='running')return;if(core.shiftLane(state,dir))playTone(260+state.lane*100,.055,'triangle',.022);}
function boost(){if(state&&core.useBoost(state)){flash('OVERDRIVE ×2');playTone(980,.24,'sawtooth',.045);updateHUD();}}
function polygon(pts,fill,stroke,widthLine=1){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=widthLine;ctx.stroke()}}
function grad(stops,x0,y0,x1,y1){const g=ctx.createLinearGradient(x0,y0,x1,y1);for(const [at,color] of stops)g.addColorStop(at,color);return g}
function project(lane,p){const z=Math.max(0,Math.min(1,p));const ease=z*z;const h=height*.83,y=height*.28+(h-height*.28)*ease;const half=width*(.065+.45*ease);const x=width/2+(lane-1)*half*.64;const cell=half*1.88/3;return{x,y,scale:.25+.98*ease,half,cell}}
function drawBackground(t){const p=palettes[themeIndex];ctx.fillStyle=grad([[0,p.sky[0]],[.58,p.sky[1]],[1,p.sky[2]]],0,0,0,height);ctx.fillRect(0,0,width,height);for(const star of stars){ctx.fillStyle='rgba(215,242,255,.48)';ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,7);ctx.fill()}
 const horizon=height*.28;const haze=ctx.createRadialGradient(width/2,horizon,6,width/2,horizon,width*.49);haze.addColorStop(0,p.edge+'88');haze.addColorStop(1,'transparent');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height*.8);
 const cityWidth=Math.max(14,width/42);for(let x=0,i=0;x<width;x+=cityWidth*.95,i++){const b=(Math.sin(i*94.3)*10000)%1;const hs=15+Math.abs(b)*62;ctx.fillStyle='#080f2a';ctx.fillRect(x,horizon-hs,cityWidth*.87,hs);ctx.fillStyle='rgba(68,192,240,.27)';for(let y=horizon-hs+8;y<horizon-4;y+=11)if((y+i)%3<2)ctx.fillRect(x+cityWidth*.3,y,2,3)}
 ctx.strokeStyle=p.edge+'66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(width,horizon);ctx.stroke();}
function drawRoad(s){const p=palettes[themeIndex],center=width/2,top=height*.28,bottom=height*.96,topHalf=width*.062,bottomHalf=width*.52;
 polygon([[center-topHalf,top],[center+topHalf,top],[center+bottomHalf,bottom],[center-bottomHalf,bottom]],p.road,p.edge+'a0',4);
 const texture=ctx.createLinearGradient(0,top,0,bottom);texture.addColorStop(0,'rgba(13,30,65,.02)');texture.addColorStop(1,'rgba(3,10,27,.45)');polygon([[center-topHalf,top],[center+topHalf,top],[center+bottomHalf,bottom],[center-bottomHalf,bottom]],texture);
 ctx.save();ctx.shadowColor=p.edge;ctx.shadowBlur=14;for(const edge of [-1,1]){ctx.beginPath();ctx.moveTo(center+edge*topHalf,top);ctx.lineTo(center+edge*bottomHalf,bottom);ctx.lineWidth=3;ctx.strokeStyle=p.edge;ctx.stroke()}ctx.restore();
 for(const line of [-1/3,1/3]){ctx.beginPath();ctx.moveTo(center+topHalf*line,top);ctx.lineTo(center+bottomHalf*line,bottom);ctx.strokeStyle=p.edge2+'85';ctx.lineWidth=2;ctx.setLineDash([12,15]);ctx.stroke();ctx.setLineDash([])}
 const off=((s?.distance||0)/20)%1;for(let i=0;i<17;i++){const q=(i+off)/17,z=q*q,y=top+(bottom-top)*z,half=topHalf+(bottomHalf-topHalf)*z;ctx.strokeStyle=p.edge+'38';ctx.lineWidth=Math.max(.5,3*z);ctx.beginPath();ctx.moveTo(center-half,y);ctx.lineTo(center+half,y);ctx.stroke()}
 for(const side of [-1,1])for(let i=0;i<12;i++){let q=((i+off)/12);q=q*q;const y=top+(bottom-top)*q,x=center+side*(topHalf+(bottomHalf-topHalf)*q)*1.09;ctx.fillStyle=p.edge;ctx.fillRect(x-2*q,y-7*q,4*q,12*q);}}
function drawObstacle(row){const p=palettes[themeIndex],q=project(1,row.p);if(row.p<0)return;for(const lane of row.blocked){const t=project(lane,row.p),w=t.cell*.75,h=23*t.scale;ctx.save();ctx.shadowBlur=14*t.scale;ctx.shadowColor=p.hazard;ctx.fillStyle=p.hazard+'42';polygon([[t.x-w/2,t.y-h],[t.x+w/2,t.y-h],[t.x+w/2,t.y+h*.3],[t.x-w/2,t.y+h*.3]],'#39172d',p.hazard,Math.max(1,2*t.scale));ctx.fillStyle=p.hazard;ctx.fillRect(t.x-w*.4,t.y-h*.52,w*.8,Math.max(2,4*t.scale));ctx.shadowBlur=0;ctx.fillStyle='#fbe5f1';ctx.font=`900 ${Math.max(7,14*t.scale)}px sans-serif`;ctx.textAlign='center';ctx.fillText('×',t.x,t.y-h*.55);ctx.restore()}
 if(row.prize&&!row.blocked.includes(row.prizeLane)){const t=project(row.prizeLane,row.p),size=13*t.scale;ctx.save();ctx.shadowBlur=18;ctx.shadowColor=p.pickup;polygon([[t.x,t.y-size*2.2],[t.x+size,t.y-size],[t.x,t.y],[t.x-size,t.y-size]],p.pickup,'#ffffff',1.1);ctx.restore();}}
function drawShip(s,dt){const p=palettes[themeIndex],t=project(viewLane,1),x=t.x,y=height*.83,shipW=Math.min(80,width*.105),shipH=shipW*.62;
 const bob=(s?.status==='running'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)?Math.sin(performance.now()*.008)*2:0;
 ctx.save();ctx.translate(x,y+bob);ctx.shadowBlur=25;ctx.shadowColor=p.edge;ctx.globalAlpha=.45;ctx.fillStyle=p.edge;ctx.beginPath();ctx.ellipse(0,shipH*.8,shipW*.42,9,0,0,7);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;
 polygon([[-shipW*.42,shipH*.38],[-shipW*.2,-shipH*.25],[0,-shipH*.72],[shipW*.2,-shipH*.25],[shipW*.42,shipH*.38],[0,shipH*.63]],grad([[0,'#deecff'],[.45,p.edge],[1,'#354fa3']],0,-shipH,0,shipH),p.edge,2);
 polygon([[-shipW*.15,-shipH*.16],[0,-shipH*.51],[shipW*.15,-shipH*.16],[0,shipH*.22]],'#10172a','#e4fbff',1);
 for(const d of [-1,1]){ctx.shadowBlur=14;ctx.shadowColor=p.edge2;ctx.fillStyle=p.edge2;ctx.fillRect(d*shipW*.31-shipW*.045,shipH*.31,shipW*.09,shipH*.2);ctx.shadowBlur=0}
 if(s?.boostLeft>0){ctx.shadowBlur=20;ctx.shadowColor='#f9e28c';polygon([[-shipW*.14,shipH*.46],[0,shipH*1.65],[shipW*.14,shipH*.46]],'#ffd478');ctx.shadowBlur=0}ctx.restore();}
function render(dt=0){const p=palettes[themeIndex];ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);drawBackground();drawRoad(state);if(state){const rows=[...state.rows].sort((a,b)=>a.p-b.p);for(const row of rows)drawObstacle(row)}if(state&&state.status!=='over'){const target=state.lane;viewLane+=(target-viewLane)*Math.min(1,dt*12);drawShip(state,dt)}else if(!state){viewLane+=(1-viewLane)*Math.min(1,dt*10);drawShip(null,dt)}
 // atmospheric vignette and cinematic bottom edge
 const v=ctx.createLinearGradient(0,0,0,height);v.addColorStop(0,'rgba(1,4,15,.10)');v.addColorStop(1,'rgba(1,4,15,.42)');ctx.fillStyle=v;ctx.fillRect(0,0,width,height);
 if(state?.boostLeft>0){ctx.save();ctx.strokeStyle=p.edge+'8a';ctx.lineWidth=3;ctx.strokeRect(5,5,width-10,height-10);ctx.restore()}
}
let hudClock=0;
function frame(time){const dt=last?Math.min(.05,(time-last)/1000):0;last=time;
 if(state?.status==='running'){const ev=core.advance(state,dt);for(const e of ev){if(e.type==='hit'){flash('SHIELD LOST');playTone(160,.25,'sawtooth',.055)}else if(e.type==='dodge'){if(e.combo%8===0){flash(e.combo+'× STREAK!');playTone(740,.08)}}else if(e.type==='prize'){flash('+50 FLUX');playTone(740,.12,'triangle')}else if(e.type==='over'){finish();break}}}
 hudClock+=dt;if(hudClock>=.07){updateHUD();hudClock=0}render(dt);raf=requestAnimationFrame(frame);}
function showHelp(){helpOrigin=document.activeElement;$('helpOverlay').classList.remove('hidden');$('closeHelp').focus();if(state?.status==='running')togglePause();}
function hideHelp(){$('helpOverlay').classList.add('hidden');helpOrigin?.focus();}
$('soundBtn').addEventListener('click',toggleSound);$('themeBtn').addEventListener('click',()=>{setTheme(themeIndex+1);playTone(650)});
$('helpBtn').addEventListener('click',showHelp);$('closeHelp').addEventListener('click',hideHelp);$('helpOkay').addEventListener('click',hideHelp);
$('helpOverlay').addEventListener('click',e=>{if(e.target===$('helpOverlay'))hideHelp()});
document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
$('playBtn').addEventListener('click',start);$('resumeBtn').addEventListener('click',togglePause);$('pauseBtn').addEventListener('click',togglePause);$('quitBtn').addEventListener('click',menu);$('retryBtn').addEventListener('click',start);$('menuBtn').addEventListener('click',menu);
$('leftBtn').addEventListener('click',()=>steer(-1));$('rightBtn').addEventListener('click',()=>steer(1));$('boostBtn').addEventListener('click',boost);
cv.addEventListener('pointerdown',e=>{if(!state||state.status!=='running')return;startX=e.clientX;const rect=cv.getBoundingClientRect();if(e.pointerType==='mouse')steer(e.clientX<rect.left+rect.width/2?-1:1)});
cv.addEventListener('pointerup',e=>{if(startX===null||e.pointerType==='mouse')return;const dx=e.clientX-startX;const rect=cv.getBoundingClientRect();if(Math.abs(dx)>30)steer(Math.sign(dx));else steer(e.clientX<rect.left+rect.width/2?-1:1);startX=null});
cv.addEventListener('pointercancel',()=>startX=null);
document.addEventListener('keydown',e=>{const helpOpen=!$('helpOverlay').classList.contains('hidden');if(helpOpen){if(e.key==='Escape')hideHelp();return}const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;if(['ArrowLeft','ArrowRight',' ','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.repeat&&[' ','Escape','p','P'].includes(e.key))return;switch(e.key){case 'ArrowLeft':case 'a':case 'A':steer(-1);break;case 'ArrowRight':case 'd':case 'D':steer(1);break;case '1':core.setLane(state||{status:'none'},0);break;case '2':core.setLane(state||{status:'none'},1);break;case '3':core.setLane(state||{status:'none'},2);break;case ' ':boost();break;case 'Escape':case 'p':case 'P':togglePause();break}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state?.status==='running')togglePause()});
$('year').textContent=String(new Date().getFullYear());try{setTheme(parseInt(localStorage.getItem('ca_skyrail_theme')||'0',10)||0)}catch{setTheme(0)}
if(window.ResizeObserver)new ResizeObserver(resize).observe(wrap);else window.addEventListener('resize',resize);resize();menu();raf=requestAnimationFrame(frame);
})();