// Optional local profiler, not a TV FPS test. Requires Playwright/Chromium.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});const all=[];
try{for(const mode of ['normal','muted','static']){
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),cdp=await page.context().newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');
 await page.addInitScript(mode=>{localStorage.setItem('menuSound',String(mode!=='muted'));window.perfCounts={osc:0,gain:0,mutations:0,adds:0,removes:0};const C=window.AudioContext;if(C){for(const [fn,key] of [['createOscillator','osc'],['createGain','gain']]){const orig=C.prototype[fn];C.prototype[fn]=function(){perfCounts[key]++;return orig.apply(this,arguments);};}}},mode);
 await page.goto(pathToFileURL(path.resolve(process.argv[2]||path.resolve(__dirname,'../src'),'index.html')).href);await page.waitForTimeout(2600);
 if(mode==='static')await page.addStyleTag({content:'*{transition:none!important;animation:none!important}'});
 await page.evaluate(()=>{new MutationObserver(rs=>{for(const r of rs){perfCounts.mutations++;perfCounts.adds+=r.addedNodes.length;perfCounts.removes+=r.removedNodes.length;}}).observe(document.getElementById('items'),{attributes:true,childList:true,subtree:true});});
 function metrics(r){return Object.fromEntries(r.metrics.map(m=>[m.name,m.value]));}
 const start=metrics(await cdp.send('Performance.getMetrics'));
 const result=await page.evaluate(async()=>{const frames=[],latencies=[],longtasks=[];let active=true,last=performance.now(),id;
 function frame(t){if(t>last)frames.push(t-last);last=t;if(active)id=requestAnimationFrame(frame);}id=requestAnimationFrame(frame);
 let obs;try{obs=new PerformanceObserver(list=>{for(const e of list.getEntries())longtasks.push(e.duration)});obs.observe({entryTypes:['longtask']});}catch(e){}
 for(let i=0;i<240;i++){const t=performance.now();document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:i%2?39:37,bubbles:true,cancelable:true}));await new Promise(r=>requestAnimationFrame(()=>{latencies.push(performance.now()-t);r()}));await new Promise(r=>setTimeout(r,60));}
 await new Promise(r=>setTimeout(r,500));active=false;cancelAnimationFrame(id);if(obs)obs.disconnect();
 function stats(a){a.sort((a,b)=>a-b);return {n:a.length,p50:a[Math.floor(a.length*.5)]||0,p95:a[Math.floor(a.length*.95)]||0,max:a[a.length-1]||0,over34:a.filter(x=>x>34).length};}
 return {frames:stats(frames),latency:stats(latencies),longtasks:stats(longtasks),counts:perfCounts};});
 const end=metrics(await cdp.send('Performance.getMetrics'));await cdp.send('HeapProfiler.collectGarbage');const gc=metrics(await cdp.send('Performance.getMetrics'));
 const record={mode,result,start,end,gc};all.push(record);fs.writeFileSync(process.argv[3]||'navigation-profile-result.json',JSON.stringify(all,null,2));console.log(JSON.stringify({mode,result,delta:Object.fromEntries(['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration','JSHeapUsedSize','Nodes'].map(k=>[k,end[k]-start[k]])),heapAfterGC:gc.JSHeapUsedSize},null,2));await page.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
