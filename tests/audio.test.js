const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../src/menu-audio.js'),'utf8');
function setup(state='running'){
 let now=1000,id=0,timers=new Map(),listeners={},contexts=[],audio=[],resumeResolve;
 class Audio{constructor(src){this.src=src;audio.push(this);}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}}
 class Context{constructor(){this.state=state;this.currentTime=0;this.nodes=[];this.resumes=0;contexts.push(this);}resume(){this.resumes++;return new Promise(r=>{resumeResolve=()=>{this.state='running';r();};});}close(){this.state='closed';return Promise.resolve();}createOscillator(){let n={frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){this.detached=true;},start(){},stop(){}};this.nodes.push(n);return n;}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){this.detached=true;}};}}
 const document={hidden:false,addEventListener:(k,f)=>listeners[k]=f},window={AudioContext:Context,addEventListener:(k,f)=>listeners[k]=f};
 vm.runInNewContext(source,{window,document,Audio,Date:{now:()=>now},localStorage:{getItem:()=>null,setItem(){}},DeckSounds:{restore:(k,fn)=>fn(null)},setTimeout:(f,ms)=>{timers.set(++id,{f,ms});return id;},clearTimeout:i=>timers.delete(i)});
 const api=window.DeckMenuAudio();return{api,audio,contexts,timers,document,listeners,advance(ms){now+=ms;},idle(){const t=[...timers.values()];timers.clear();t.forEach(x=>x.f());},resolve(){resumeResolve();}};
}
(async()=>{
 const a=setup();assert.equal(a.audio.length,1,'default synth must not preload four unused WAV players');
 for(let i=0;i<2000;i++){a.advance(60);a.api.click();const node=a.contexts[0].nodes.at(-1);node.onended();assert.equal(node.onended,null,'ended nodes must release their handler closure');assert(node.detached);}
 assert.equal(a.contexts.length,1);assert.equal(a.timers.size,1,'one idle cleanup timer, not one per voice');
 a.idle();assert.equal(a.contexts[0].state,'closed','idle audio graph must be released');a.advance(60);a.api.click();assert.equal(a.contexts.length,2);
 a.document.hidden=true;a.listeners.visibilitychange();assert.equal(a.contexts[1].state,'closed');assert.equal(a.timers.size,0);
 const b=setup('suspended');b.api.click();for(let i=0;i<30;i++){b.advance(60);b.api.click();}assert.equal(b.contexts[0].resumes,1);assert.equal(b.contexts[0].nodes.length,0);
 b.document.hidden=true;b.listeners.visibilitychange();b.resolve();await Promise.resolve();assert.equal(b.contexts.length,1,'late resume must not resurrect hidden audio');assert.equal(b.contexts[0].nodes.length,0);
 const c=setup();c.api.set('click','file:///custom.wav');assert.equal(c.audio.length,5);c.api.click();assert(c.audio.some(x=>x.src==='file:///custom.wav'&&x.paused===false));c.api.toggle();assert(c.audio.every(x=>x.paused));
 console.log('Menu audio: 2000 completed voices release callbacks, bounded idle cleanup, suspended resume cancellation and USB pool passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
