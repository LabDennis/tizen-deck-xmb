// Run with Playwright available in NODE_PATH. Uses only local project files.
const {chromium}=require('playwright');
const {pathToFileURL}=require('url');
const path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_BIN?{executablePath:process.env.BROWSER_BIN}:{})});
 try {
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.setDefaultTimeout(5000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.padReads=0;Object.defineProperty(navigator,'getGamepads',{value:()=>{window.padReads++;return [];}});});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
 await page.waitForTimeout(1100);
 assert.equal(await page.locator('body').getAttribute('data-performance'),'eco');
 assert.ok(await page.evaluate(()=>padReads)<=3,'idle controller polling must not run at 20 Hz');
 assert.equal(await page.locator('.ambient').evaluate(e=>e.getBoundingClientRect().height),1080);
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 assert.equal(await page.locator('#dialog-title').innerText(),'Leistungsprofil');
 await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');
 assert.equal(await page.locator('body').getAttribute('data-performance'),'balanced');
 await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>document.querySelector('.category.selected').textContent==='Medien');
 assert.equal(await page.locator('.category.selected').innerText(),'Medien');
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Menütöne',exact:true}).click();
 await page.getByRole('button',{name:'Klickton vom USB-Stick',exact:true}).click();
 assert.match(await page.locator('#dialog-text').innerText(),/nur am Monitor/);
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{
  const file={name:'click.wav',isFile:true,fileSize:1024,fullPath:'removable_test/click.wav',toURI:()=> 'file:///mock/click.wav'};
  const usb={name:'USB',fullPath:'removable_test',listFiles:ok=>ok([file,{name:'huge.mp3',isFile:true,fileSize:9000000}]),copyTo:(src,dest,overwrite,ok)=>{window.copyArgs=[src,dest,overwrite];ok();}};
  const folder={fullPath:'wgt-private/deck-sounds'},root={resolve:()=>folder};
  window.tizen={filesystem:{listStorages:ok=>ok([{label:'removable_test',type:'EXTERNAL',state:'MOUNTED'}]),resolve:(path,ok)=>ok(path==='wgt-private'?root:path==='removable_test'?usb:file)}};
 });
 await page.getByRole('button',{name:'Menütöne',exact:true}).click();
 await page.getByRole('button',{name:'Klickton vom USB-Stick',exact:true}).click();
 await page.getByRole('button',{name:'removable_test',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'huge.mp3',exact:true}).count(),0);
 await page.getByRole('button',{name:'click.wav',exact:true}).click();
 await page.getByRole('button',{name:'Als Klickton übernehmen',exact:true}).click();
 assert.match(await page.locator('#dialog-text').innerText(),/Sound übernommen/);
 assert.deepEqual(await page.evaluate(()=>copyArgs),['removable_test/click.wav','wgt-private/deck-sounds/click.wav',true]);
 assert.equal(await page.evaluate(()=>localStorage.getItem('soundFile.click')),'wgt-private/deck-sounds/click.wav');
 await page.getByRole('button',{name:'Klickton zurücksetzen',exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('soundFile.click')),null);
 await page.keyboard.press('Escape');
 const reads=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return padReads;});
 await page.waitForTimeout(1100);assert.equal(await page.evaluate(()=>padReads),reads,'hidden app must stop controller polling');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
 assert.ok(await page.evaluate(()=>padReads)>reads,'foreground must resume polling');
 assert.equal(await page.locator('#splash').count(),0,'finished intro must be removed and stay absent on resume');
 assert.equal(await page.locator('.category.selected').count(),1,'resume must retain the selected category');
 assert.deepEqual(errors,[]);
 console.log('Launcher browser: keyboard navigation, profile dialog, USB import/reset/size filtering, ambient bounds, idle/hidden controller polling and resume passed');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
