const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
let selected=false,hidden=false,listeners={},timers=new Map(),n=0,pulses=[];
const document={get hidden(){return hidden;},querySelector:()=>selected?{}:null,addEventListener:(k,f)=>listeners[k]=f};
const window={DECK_DEVICE:{url:'http://controller',token:'test'},addEventListener:(k,f)=>listeners[k]=f};
function XHR(){this.open=()=>{};this.setRequestHeader=()=>{};this.abort=()=>{};this.send=data=>pulses.push(JSON.parse(data));}
const ctx={window,document,XMLHttpRequest:XHR,setTimeout:(fn)=>{timers.set(++n,fn);return n;},clearTimeout:i=>timers.delete(i)};
vm.runInNewContext(fs.readFileSync(__dirname+'/../src/guard.js','utf8'),ctx);
ctx.DeckGuard=window.DeckGuard;
function tick(){const jobs=[...timers.values()];timers.clear();jobs.forEach(f=>f());}
assert.equal(pulses.length,0,'startup waits for rendered menu');tick();assert.equal(pulses.at(-1).visible,false);
selected=true;tick();assert.equal(pulses.at(-1).visible,true);
hidden=true;listeners.visibilitychange();assert.equal(pulses.at(-1).visible,false);assert.equal(timers.size,0);
hidden=false;listeners.visibilitychange();assert.equal(timers.size,1);tick();assert.equal(pulses.at(-1).visible,true);
window.DeckGuard.leave();assert.equal(pulses.at(-1).visible,false);assert.equal(timers.size,0);
console.log('Guard: no ready pulse before selected menu exists; hidden/leave disarm and resume checked');
