const {chromium}=require('playwright'),{pathToFileURL}=require('url'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.volume=12;window.muted=false;window.privacy=true;window.launched=[];
  window.tizen={application:{launch:(id,ok)=>{launched.push(id);ok();}},tvaudiocontrol:{getVolume:()=>volume,getOutputMode:()=> 'PCM',isMute:()=>muted,setMute:v=>muted=v,setVolumeUp:()=>{volume++;muted=false;},setVolumeDown:()=>{volume--;muted=false;}},systeminfo:{getPropertyValue:(name,ok,fail)=>{if(name==='NETWORK')setTimeout(()=>ok({networkType:'WIFI'}),40);else if(name==='WIFI_NETWORK')setTimeout(()=>ok({ssid:'Test WLAN',ipAddress:'192.0.2.1',gateway:'192.0.2.2',dns:'192.0.2.3'}),10);else fail&&fail({name:'unsupported'});}}};
  window.XMLHttpRequest=function(){this.open=(m,url)=>{this.url=url;};this.setRequestHeader=()=>{};this.abort=()=>{};this.send=body=>{if(body&&this.url.endsWith('/privacy'))privacy=JSON.parse(body).enabled;this.status=200;this.responseText=JSON.stringify({enabled:privacy,services:[{name:'test.service',masked:privacy,active:privacy?'inactive':'active'}],message:'Runtime only'});setTimeout(()=>this.onload(),25);};};
 });
 await page.addInitScript(()=>{const show=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){if(this.open)throw new DOMException('TV dialog is already open','InvalidStateError');return show.call(this);};});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);await page.evaluate(()=>window.DECK_DEVICE={url:'http://localhost:8844',token:'test'});
 await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
 // Use remote navigation to bring the newly offscreen items into view.
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 assert.equal(await page.locator('#dialog-title').innerText(),'Ton & Audioausgabe');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>volume),13);
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>muted),true);
 assert.match(await page.locator('#dialog-text').innerText(),/Stumm/);await page.keyboard.press('Escape');
 await page.keyboard.press('Escape');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.waitForTimeout(100);assert.match(await page.locator('#dialog-text').innerText(),/Test WLAN/);await page.keyboard.press('Escape');
 await page.keyboard.press('Escape');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.getByRole('button',{name:'Datenschutz-Dienste',exact:true}).click();await page.waitForTimeout(60);assert.match(await page.locator('#dialog-text').innerText(),/gesperrt/);
 await page.keyboard.press('Enter');await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>privacy),false);assert.match(await page.locator('#dialog-text').innerText(),/active/);
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');await page.getByRole('button',{name:'Ton & Audioausgabe',exact:true}).click();await page.waitForTimeout(100);assert.equal(await page.locator('#dialog-title').innerText(),'Ton & Audioausgabe');assert.doesNotMatch(await page.locator('#dialog-text').innerText(),/Test WLAN/,'late network reply cannot overwrite another menu');
 assert.deepEqual(errors,[]);console.log('System menus: remote audio/mute, real-state rendering, network, privacy restore and late callbacks passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
