const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const core=require('../game-core.js');
function createContext(width){
 const ids=[...fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').matchAll(/id="([a-zA-Z][^"\s]*)"/g)].map(m=>m[1]);
 const registered={}, elements={};
 function element(id){if(elements[id])return elements[id];const node={id,style:{},value:'',textContent:'',innerHTML:'',disabled:false,className:'',dataset:{},attributes:{},width:0,height:0, listeners:{}, addEventListener(type,cb){(this.listeners[type]||=[]).push(cb)}, getBoundingClientRect(){return {left:0,top:0,width:width-24,height:width<600?360:540}},setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]},focus(){},classList:{set:new Set(['hidden']),add(k){this.set.add(k)},remove(k){this.set.delete(k)},toggle(k,v){if(v)this.add(k);else this.remove(k)},contains(k){return this.set.has(k)}}}; elements[id]=node;return node;}
 ids.forEach(element);
 const methods=new Proxy({}, {get:(_t,k)=> k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):k==='measureText'?()=>({width:100}):()=>{}});
 const ctx=new Proxy({canvas:elements.game}, {get(t,k){return k in t?t[k]:methods[k]},set(t,k,v){t[k]=v;return true}});elements.game.getContext=()=>ctx;
 const modeNodes=['endless','rush','training'].map(m=>{const e=element('mode-'+m);e.dataset.mode=m;return e});
 const document={documentElement:{setAttribute(){}},hidden:false,getElementById:element,querySelectorAll(){return modeNodes},addEventListener(type,cb){(registered[type]||=[]).push(cb)},activeElement:{tagName:'BODY',focus(){}}};
 const frames=[];let ts=0;
 const env={document,ResizeObserver:class{observe(){}},window:{SkyrailCore:core,devicePixelRatio:1,matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}},addEventListener(){}},performance:{now(){return ts}},requestAnimationFrame(cb){frames.push(cb);return frames.length},localStorage:{getItem(){return null},setItem(){}},clearTimeout(){},setTimeout(cb){return 1},console,Math,Date};
 env.window.window=env.window;env.window.localStorage=env.localStorage;env.window.performance=env.performance;env.window.requestAnimationFrame=env.requestAnimationFrame;env.window.setTimeout=env.setTimeout;env.window.clearTimeout=env.clearTimeout;
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const js=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
 vm.runInNewContext(js,env,{filename:'game.js'});
 const click=(id)=>{for(const f of elements[id].listeners.click||[])f({target:elements[id]})};
 const frame=(n)=>{for(let i=0;i<n;i++){ts+=16.67;const f=frames.shift();assert.ok(f);f(ts)}};
 return {elements,registered,click,frame,modeNodes};
}
test('browser UI initialises and supports play, movement, pause/resume, help, theme on 320px and desktop',()=>{
 for(const width of [320,375,768,1280]){
  const g=createContext(width);
  assert.equal(g.elements.startScreen.classList.contains('hidden'),false);
  g.click('playBtn');assert.equal(g.elements.startScreen.classList.contains('hidden'),true);
  g.frame(20);assert.ok(Number(g.elements.distance.textContent)>0);
  g.click('rightBtn');g.click('leftBtn');g.frame(10);
  g.click('pauseBtn');assert.equal(g.elements.pauseScreen.classList.contains('hidden'),false);
  g.click('resumeBtn');assert.equal(g.elements.pauseScreen.classList.contains('hidden'),true);
  g.click('helpBtn');assert.equal(g.elements.helpOverlay.classList.contains('hidden'),false);
  g.click('closeHelp');assert.equal(g.elements.helpOverlay.classList.contains('hidden'),true);
  g.click('themeBtn');g.click('soundBtn');g.frame(10);
 }
});