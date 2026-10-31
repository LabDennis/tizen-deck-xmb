const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({headless:true});try{
 const page=await b.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(4000);
 await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
 await page.evaluate(()=>{
  window.failure='';window.streamClosed=0;window.testData=JSON.stringify({format:'tizen-deck-preferences',version:1,values:{menuSound:'false'}});
  const file={name:'settings.json',isFile:true,fileSize:200,fullPath:'usb/settings.json',openStream:(mode,ok)=>{if(failure===mode+'-open')throw Error('USB removed on open');ok({bytesAvailable:200,read:()=>testData,write:()=>{},close:()=>{streamClosed++;if(failure===mode+'-close')throw Error('USB removed on close');}});}};
  const root={name:'USB',createFile:()=>file,listFiles:ok=>ok([file])};window.tizen={filesystem:{resolve:(path,ok)=>ok(root),listStorages:ok=>ok([{label:'usb',type:'EXTERNAL',state:'MOUNTED'}])}};
 });
 await page.keyboard.press('ArrowLeft');for(let i=0;i<4;i++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 const button=name=>page.getByRole('button',{name,exact:true});
 for(const mode of ['w-open','w-close','r-open','r-close']){
  await page.evaluate(mode=>window.failure=mode,mode);await button('Einstellungen sichern / laden').click();await button(mode[0]==='w'?'Auf USB sichern':'Von USB laden').click();await button('usb').click();if(mode[0]==='r')await button('settings.json').click();
  assert.match(await page.locator('#dialog-text').innerText(),/Nicht übernommen: USB removed/);assert.equal(await button('Übernehmen & Launcher neu laden').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('menuSound')),null);await page.keyboard.press('Escape');
 }
 assert.equal(await page.evaluate(()=>streamClosed),2);assert.deepEqual(errors,[]);console.log('Backup I/O: USB removal on open/close reports failure, closes streams and never imports partial data');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
