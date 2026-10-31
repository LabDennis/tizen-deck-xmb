const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(process.env.LAUNCHER_SOURCE||path.resolve(__dirname,'../src'),'index.html')).href);
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 async function bounds(){const v=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,x:scrollX,y:scrollY,bx:document.body.scrollLeft,by:document.body.scrollTop}));assert.equal(v.sw,v.w,'offscreen categories must not enlarge the document');assert.equal(v.sh,v.h,'offscreen rows must not enlarge the document');assert.deepEqual([v.x,v.y,v.bx,v.by],[0,0,0,0],'navigation must never pan the page');}
 // Settings contains many rows and puts the last category beyond the right edge.
 await page.keyboard.press('ArrowLeft');await settle();await bounds();
 await page.locator('.category').last().focus();await bounds();
 assert.notEqual(await page.evaluate(()=>document.activeElement.textContent),'Zuletzt','offscreen category must not receive focus');
 // Repeated full sweeps cover both edges, rather than alternating only two groups.
 for(let round=0;round<8;round++){
  for(const direction of ['ArrowRight','ArrowLeft']){
   for(let i=0;i<12;i++){await page.keyboard.press(direction);await settle();await bounds();}
  }
 }
 for(let i=0;i<20;i++){await page.keyboard.press('ArrowDown');await settle();await bounds();}
 await page.keyboard.press('Enter');assert.match(await page.locator('#dialog-title').innerText(),/Tizen Deck/);await page.keyboard.press('Escape');
 // The viewport clipping must not break scrolling inside ordinary dialogs.
 await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 assert.equal(await page.locator('#dialog-title').innerText(),'Favoriten');
 for(let i=0;i<24;i++)await page.keyboard.press('ArrowDown');
 assert(await page.locator('#dialog-actions').evaluate(e=>e.scrollTop)>0);await bounds();
 assert.deepEqual(errors,[]);console.log('Viewport: offscreen focus, 192 rapid edge-to-edge inputs and long rows cannot scroll or enlarge the page');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
