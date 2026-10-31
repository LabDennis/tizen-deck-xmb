const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const show=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){if(this.open)throw new DOMException('TV dialog is already open','InvalidStateError');return show.call(this);};});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
 const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 async function performanceMenu(){for(const k of ['ArrowLeft','ArrowDown','Enter','ArrowDown','ArrowDown','Enter']){await page.keyboard.press(k);await frame();}assert.equal(await page.locator('#dialog-title').innerText(),'Leistungsprofil');}
 await performanceMenu();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 assert.equal(await page.locator('body').getAttribute('data-performance'),'direct');
 assert.equal(await page.evaluate(()=>localStorage.getItem('performanceProfile')),'direct');
 await page.reload();await frame();assert.equal(await page.locator('body').getAttribute('data-performance'),'direct');
 // Direct mode eliminates CSS transitions during both reversals and row changes.
 for(let n=0;n<4;n++)for(const code of [39,39,39,39,39,39,39,37,37,37,37,37,37,37,40,40,40,40,40,38,38,38,38,38]){
  await page.evaluate(k=>document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:k,bubbles:true,cancelable:true})),code);await frame();
  const state=await page.evaluate(()=>({moving:Array.from(document.querySelectorAll('.category,.item,.item .symbol')).filter(e=>getComputedStyle(e).transitionDuration!=='0s').length,selected:document.querySelectorAll('.item.selected').length,viewport:[scrollX,scrollY,document.documentElement.scrollWidth,document.documentElement.scrollHeight]}));
  assert.equal(state.moving,0);assert.equal(state.selected,1);assert.deepEqual(state.viewport,[0,0,1920,1080]);
 }
 const effects=await page.evaluate(()=>({background:getComputedStyle(document.querySelector('.ambient')).transform,wave:getComputedStyle(document.querySelector('.wave')).animationName,filter:getComputedStyle(document.querySelector('.category .symbol')).filter}));
 assert.notEqual(effects.background,'none');assert.equal(effects.wave,'none');assert.equal(effects.filter,'none');
 const backup=await page.evaluate(()=>DeckPreferences.parse(DeckPreferences.encode(localStorage)));assert.equal(backup.performanceProfile,'direct');
 // The previous animated profile remains available and persists independently.
 await page.reload();await performanceMenu();await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');await page.reload();await frame();
 assert.equal(await page.locator('body').getAttribute('data-performance'),'eco');assert.equal(await page.locator('.category').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0.12s');
 assert.deepEqual(errors,[]);console.log('Performance profiles: remote selection, persistence, direct reversals/rows, clipping, backup and animated fallback passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
