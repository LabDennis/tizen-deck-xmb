const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../src/status.js'),'utf8');
function run(info){
 let text='',writes=0,now=100000,timers=new Map(),id=0,listeners={};
 let el={get textContent(){return text;},set textContent(v){writes++;text=v;}};
 let tizen=info?{systeminfo:info}:undefined;
 let document={hidden:false,getElementById:()=>el,addEventListener:(k,v)=>listeners[k]=v},window={tizen};
 vm.runInNewContext(source,{window,tizen,document,Date:{now:()=>now},setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id;},clearTimeout:i=>timers.delete(i),isFinite});
 return {el,timers,listeners,document,window,get writes(){return writes;},advance(ms){const end=now+ms;while(true){let next=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;timers.delete(next[0]);next[1].f();}now=end;}};
}
assert.match(run().el.textContent,/Vorschau/);
let callbacks={},calls={},memoryCalls=0;
let a=run({getTotalMemory:()=>{memoryCalls++;return 1000;},getAvailableMemory:()=>400,getPropertyValue:(n,ok,error)=>{calls[n]=(calls[n]||0)+1;callbacks[n]=ok;}});
callbacks.CPU({load:.25});callbacks.NETWORK({networkType:'WIFI'});callbacks.WIFI_NETWORK({ipAddress:'192.0.2.10'});
assert.equal(a.el.textContent,'IP 192.0.2.10 · CPU 25 % · RAM 60 %');
let writes=a.writes,stale=callbacks.CPU;a.advance(10000);assert.equal(a.writes,writes,'unchanged values must not rewrite DOM');
stale({load:1});assert.match(a.el.textContent,/CPU 25 %/);
callbacks.CPU({load:NaN});assert.match(a.el.textContent,/CPU 25 %/);
a.advance(50000);assert.equal(calls.NETWORK,2,'network queried once per minute');
assert.match(a.el.textContent,/IP 192.0.2.10/);
a.document.hidden=true;a.listeners.visibilitychange();assert.equal(a.timers.size,0);
let old=callbacks.NETWORK;old({networkType:'NONE'});assert.match(a.el.textContent,/IP 192.0.2.10/);
a.document.hidden=false;a.listeners.visibilitychange();assert.equal(a.timers.size,1);callbacks.NETWORK({networkType:'NONE'});assert.match(a.el.textContent,/IP offline/);
// Burst navigation defers ALL native calls, including synchronous RAM reads.
let count=memoryCalls;
for(let i=0;i<800;i++){a.listeners.keydown();a.advance(50);}
assert.equal(memoryCalls,count,'no memory queries while scrolling');
assert.equal(a.timers.size,1,'input bursts cannot accumulate timers');
a.advance(750);assert.equal(memoryCalls,count+1,'refresh after input settles');
let after=memoryCalls;a.advance(120000);assert.ok(memoryCalls-after<=6,'idle polling slows to 30 seconds');
assert.match(a.el.textContent,/IP offline/,'cached address remains stable');
a.document.hidden=true;a.listeners.visibilitychange();a.advance(120000);assert.equal(a.timers.size,0);
let requests=[];let stalled=run({getTotalMemory:()=>1000,getAvailableMemory:()=>500,getPropertyValue:(name,ok,error)=>requests.push({name,ok,error})});
stalled.advance(500000);assert.equal(requests.length,2,'unresponsive APIs cannot accumulate requests');
requests.find(x=>x.name==='CPU').error();stalled.advance(30000);assert.equal(requests.filter(x=>x.name==='CPU').length,2);
let gameCalls=0;let game=run({getTotalMemory:()=>{gameCalls++;return 1000;},getAvailableMemory:()=>500,getPropertyValue:()=>{}});
game.advance(9900);game.window.DeckStatus.activity();game.advance(200);assert.equal(gameCalls,1,'gamepad activity also defers polling');game.advance(750);assert.equal(gameCalls,2);
console.log('Status: idle/burst scheduling, stable cached IP, hidden cleanup, stale callbacks, bounded native requests and gamepad activity passed');
