const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage();await page.addInitScript(()=>{
  let factory;window.clicks=0;window.requestedFrames=0;
  Object.defineProperty(window,'DeckMenuAudio',{get:()=>factory,set:fn=>{factory=(...args)=>{const audio=fn(...args);audio.click=()=>{clicks++;};return audio;};}});
  const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>{requestedFrames++;return raf(fn);};
 });
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
 const settle=()=>page.waitForTimeout(50);
 await page.keyboard.press('ArrowLeft');await settle();
 async function unchanged(codes){const before=await page.evaluate(()=>[clicks,requestedFrames]);await page.evaluate(codes=>{for(let n=0;n<100;n++)for(const code of codes)document.dispatchEvent(new KeyboardEvent('keydown',{keyCode:code,bubbles:true,cancelable:true}));},codes);await settle();assert.deepEqual(await page.evaluate(()=>[clicks,requestedFrames]),before,'clamped navigation must not play audio or request a frame');}
 await unchanged([37,38]);await page.keyboard.press('ArrowDown');await settle();const selected=await page.locator('.item.selected').innerText();await unchanged([37]);assert.equal(await page.locator('.item.selected').innerText(),selected,'left edge must preserve the chosen row');
 for(let i=0;i<30;i++)await page.keyboard.press('ArrowDown');await settle();await unchanged([40]);
 for(let i=0;i<10;i++)await page.keyboard.press('ArrowRight');await settle();await unchanged([39,40]);
 const count=await page.evaluate(()=>clicks);await page.keyboard.press('ArrowLeft');await settle();assert.equal(await page.evaluate(()=>clicks),count+1,'valid movement still clicks once');
 await page.keyboard.press('Escape');await unchanged([37,39]);await page.keyboard.press('Escape');
 console.log('Boundaries: no-op arrows stay silent, schedule no paint and preserve row; real movement still clicks');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
