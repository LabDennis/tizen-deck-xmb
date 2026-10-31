const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.elementCreates=0;window.voicesCreated=0;window.resumeCalls=0;
  const create=document.createElement.bind(document);document.createElement=function(...args){elementCreates++;return create(...args);};
  // Reproduce an audio context which never resumes: no queued oscillators allowed.
  window.AudioContext=class{constructor(){this.state='suspended';}resume(){resumeCalls++;return new Promise(()=>{});}createOscillator(){voicesCreated++;throw Error('Suspended audio must not allocate voices');}};
 });
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
 const press=code=>page.evaluate(c=>document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:c,bubbles:true,cancelable:true})),code);
 const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 for(let i=0;i<2;i++){await press(37);await frame();await press(39);await frame();await press(39);await frame();await press(37);await frame();}
 const created=await page.evaluate(()=>{window.menuRemovals=0;new MutationObserver(records=>{records.forEach(r=>menuRemovals+=r.removedNodes.length);}).observe(document.getElementById('items'),{childList:true});return elementCreates;});
 await page.evaluate(()=>{for(let i=0;i<400;i++)for(const code of [37,39])document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:code,bubbles:true,cancelable:true}));});
 await frame();assert.equal(await page.locator('.category.selected').innerText(),'Medien');
 assert.equal(await page.locator('.item.selected').count(),1);
 assert.equal(await page.evaluate(()=>elementCreates),created,'burst must reuse existing menu elements');
 for(let i=0;i<30;i++){await press(37);await frame();await press(39);await frame();}
 assert.equal(await page.evaluate(()=>elementCreates),created,'rendered category changes must reuse nodes too');
 assert.equal(await page.evaluate(()=>menuRemovals),0,'switching categories must not detach cached native nodes');
 assert.equal(await page.locator('.item[aria-hidden="true"][tabindex="0"]').count(),0,'inactive cache cannot receive keyboard focus');
 assert.equal(await page.evaluate(()=>voicesCreated),0);assert.equal(await page.evaluate(()=>resumeCalls),1);
 // A pointer click on the still-painted old item must launch that item, not a new category's row.
 await page.evaluate(()=>{const old=document.querySelector('.item.selected');document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:39,bubbles:true,cancelable:true}));old.click();});
 assert.match(await page.locator('#toast').innerText(),/Plex würde/);
 // Enter must use the newest logical selection even before the next paint.
 await page.evaluate(()=>{for(const code of [39,39,39,39,13])document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:code,bubbles:true,cancelable:true}));});
 assert.equal(await page.evaluate(()=>DeckFlappy.state()),'ready');
 assert.deepEqual(errors,[]);
 console.log('Navigation burst: 800 inputs, stable menu allocation, current selection on Enter and suspended audio passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
