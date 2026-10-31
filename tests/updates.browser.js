const {chromium}=require('playwright'),{pathToFileURL}=require('url'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
 window.requests=[];window.XMLHttpRequest=function(){this.open=(m,u)=>{this.url=u;};this.setRequestHeader=()=>{};this.abort=()=>{};this.send=body=>{requests.push({url:this.url,body});const data=this.url.endsWith('/backend/updates')?{installed:'1.8.1',available:true,version:'1.8.2',can_rollback:true,rollback_version:'1.8.0'}:this.url.endsWith('/backend/install')?{message:'Wechsel läuft'}:this.url.endsWith('/backend/feed')?{configured:true,url:'https://example.test/'}:{installed:'1.7.2',message:'Bereit',can_rollback:true,rollback_version:'1.7.1'};this.status=200;this.responseText=JSON.stringify(data);setTimeout(()=>this.onload(),10);};};
 });
 await page.addInitScript(()=>{const show=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){if(this.open)throw new DOMException('TV dialog is already open','InvalidStateError');return show.call(this);};});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);await page.evaluate(()=>{window.DECK_DEVICE={url:'http://localhost:8844',token:'test'};document.getElementById('dialog').showModal();DeckDevice.updates();});
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.waitForTimeout(30);
 assert.match(await page.locator('#dialog-text').innerText(),/Installierter TV-Dienst: 1.8.1/);
 assert.equal(await page.evaluate(()=>document.activeElement.textContent),'TV-Dienst 1.8.2 installieren');
 await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'TV-Dienst 1.8.0 wiederherstellen');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.waitForTimeout(30);
 assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Launcher laden und prüfen','configured feed must not open the TV keyboard on entry');
 const input=page.getByRole('textbox',{name:'Release-Adresse'});await input.fill('https://updates.example.test/backend/');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.waitForTimeout(30);
 const saved=await page.evaluate(()=>requests.find(r=>r.body&&r.body.includes('updates.example.test')));assert(saved,'remote input can save feed');
 await page.screenshot({path:process.env.UPDATE_SCREENSHOT||'/tmp/deck-update-menu.png'});
 await page.evaluate(()=>DeckDevice.open());await page.waitForTimeout(30);assert.equal(await page.locator('#dialog-title').innerText(),'Webserver-Konfiguration');assert.equal(await page.getByRole('textbox',{name:'Benutzername',exact:true}).count(),1);
 assert.deepEqual(errors,[]);console.log('Update dialog: remote focus/navigation, backend rollback target, HTTPS address editing passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
