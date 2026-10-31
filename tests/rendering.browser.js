const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(process.env.LAUNCHER_SOURCE||path.resolve(__dirname,'../src'),'index.html')).href);
 const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const press=async k=>{await page.keyboard.press(k);await frame();};
 // Warm all menu groups; navigating elsewhere must not touch an unrelated cached group.
 for(let i=0;i<7;i++)await press('ArrowRight');
 for(let i=0;i<7;i++)await press('ArrowLeft');
 await page.evaluate(()=>{window.hiddenWrites=0;const b=Array.from(document.querySelectorAll('.item')).find(b=>b.textContent.startsWith('Browser'));new MutationObserver(rs=>hiddenWrites+=rs.length).observe(b,{attributes:true,childList:true,subtree:true});});
 for(let i=0;i<30;i++){await press('ArrowRight');await press('ArrowLeft');}
 assert.equal(await page.evaluate(()=>hiddenWrites),0,'unrelated hidden menu must not receive attribute/style writes');
 assert.equal(await page.locator('.item.selected').count(),1);
 const selectedTop=async()=>page.locator('.item.selected').evaluate(e=>e.getBoundingClientRect().top);
 await page.waitForTimeout(200);assert(Math.abs(await selectedTop()-1080*.48)<1,'selected row remains at XMB anchor');
 // Last row remains reachable, scrolling keeps the selection fixed, only visible items can receive Tab.
 for(let i=0;i<14;i++)await press('ArrowDown');
 await page.waitForTimeout(200);assert.match(await page.locator('.item.selected').innerText(),/Über Tizen Deck/);
 assert(Math.abs(await selectedTop()-1080*.48)<1);
 const hiddenFocusable=await page.locator('.item').evaluateAll(bs=>bs.filter(b=>b.tabIndex>=0&&(getComputedStyle(b).visibility!=='visible'||getComputedStyle(b).opacity==='0')).length);
 assert.equal(hiddenFocusable,0,'offscreen or inactive items cannot receive keyboard focus');
 await page.keyboard.press('Enter');assert.match(await page.locator('#dialog-title').innerText(),/Tizen Deck/);await page.keyboard.press('Escape');
 // Favorite changes invalidate only that collection and remain visible when returning to it.
 for(let i=0;i<6;i++)await press('ArrowRight');await page.keyboard.press('Enter');
 await page.locator('#dialog-actions button').filter({hasText:'Plex'}).click();await page.keyboard.press('Escape');await page.keyboard.press('Escape');await frame();
 assert.equal(await page.locator('.item.selected').innerText(),'Plex\nDeine Mediathek');
  await page.screenshot({path:process.env.RENDER_SCREENSHOT||'/tmp/deck-rendering.png'});
 assert.deepEqual(errors,[]);console.log('Rendering: unrelated caches untouched, fixed scroll anchor, visible keyboard focus and favorite invalidation passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
