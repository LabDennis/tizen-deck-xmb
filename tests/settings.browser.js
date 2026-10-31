const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(4000);
 await page.addInitScript(()=>{const show=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){if(this.open)throw new DOMException('TV dialog is already open','InvalidStateError');return show.call(this);};});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
 const button=name=>page.getByRole('button',{name,exact:true});
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 assert.equal(await page.locator('#dialog-title').innerText(),'Bild & Ton');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 assert.equal(await page.locator('#dialog-title').innerText(),'Leistungsprofil');await page.keyboard.press('Escape');assert.equal(await page.locator('#dialog-title').innerText(),'Bild & Ton');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Leistungsprofil');await page.keyboard.press('Escape');
 for(let i=0;i<3;i++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 assert.equal(await page.locator('#dialog-title').innerText(),'Favoriten');
 await button('☆ Plex').click();await button('☆ Jellyfin').click();await button('☆ Browser').click();
 await button('Reihenfolge ändern').click();await button('3. Browser').click();await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 assert.equal(await button('Nach oben').isDisabled(),true);assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Nach unten');
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.favorites)),['org.tizen.browser','kIciSQlYEM.plex','AprZAARz4r.Jellyfin']);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'1. Browser');await page.keyboard.press('Escape');await page.keyboard.press('Escape');assert.equal(await page.locator('#dialog-title').innerText(),'System');await page.keyboard.press('Escape');
 await page.reload();await page.keyboard.press('ArrowLeft');for(let i=0;i<6;i++)await page.keyboard.press('ArrowRight');await page.waitForTimeout(180);assert.match(await page.locator('.item.selected').innerText(),/^Browser/);
 // Backup uses a mocked removable drive: actual USB remains a hardware test.
 await page.evaluate(()=>{
  window.savedFile='';window.closes=0;const file={name:'settings.json',isFile:true,fileSize:1000,fullPath:'usb/settings.json',openStream:(mode,ok)=>ok({write:text=>savedFile=text,read:()=>savedFile,bytesAvailable:1000,close:()=>closes++})};
  const root={name:'USB',createFile:()=>file,listFiles:ok=>ok([file])};window.tizen={filesystem:{listStorages:ok=>ok([{label:'usb',type:'EXTERNAL',state:'MOUNTED'}]),resolve:(path,ok)=>ok(root)}};
 });
 for(let i=0;i<8;i++)await page.keyboard.press('ArrowLeft');for(let i=0;i<4;i++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await button('Einstellungen sichern / laden').click();
 await button('Auf USB sichern').click();await button('usb').click();assert.match(await page.locator('#dialog-text').innerText(),/Gespeichert/);assert.equal(await page.evaluate(()=>closes),1);
 await page.evaluate(()=>localStorage.setItem('menuSound','false'));await button('Fertig').click();await button('Von USB laden').click();await button('usb').click();await button('settings.json').click();
 assert.match(await page.locator('#dialog-text').innerText(),/7 Launcher-Einstellungen geprüft/);assert.equal(await page.evaluate(()=>localStorage.getItem('menuSound')),'false','preview must not change storage');
 await button('Abbrechen').click();assert.equal(await page.evaluate(()=>localStorage.getItem('menuSound')),'false');
 await button('Von USB laden').click();await button('usb').click();await button('settings.json').click();await button('Übernehmen & Launcher neu laden').click();await page.waitForLoadState();
 assert.equal(await page.evaluate(()=>localStorage.getItem('menuSound')),null);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.favorites)),['org.tizen.browser','kIciSQlYEM.plex','AprZAARz4r.Jellyfin']);
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');assert.equal(await page.locator('#dialog-title').innerText(),'Geräte','controller profile changes must retain parent navigation');
 assert.deepEqual(errors,[]);console.log('Settings: nested remote Back/focus, persistent favorite order, mocked USB export/import preview/cancel/apply passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
