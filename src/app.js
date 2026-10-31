(function(){'use strict';
var device=!!(window.tizen&&tizen.application),cat=1,row=0,toastTimer;
var groups=[
{name:'Einstellungen',icon:'⚙',items:[
 {name:'Samsung Home',icon:'▣',id:'com.samsung.tv.csfs',text:'Das originale Samsung-Menü als Rückfallebene.'},
 {name:'Bild & Ton',icon:'♪',action:'settingsav',text:'Darstellung, Leistung, Bewegung und Audio.'},
 {name:'Geräte',icon:'♧',action:'settingsdevices',text:'Bluetooth, Controller und Eingänge.'},
 {name:'Netzwerk & Webserver',icon:'◎',action:'settingsnetwork',text:'Verbindung und Webserver-Konfiguration.'},
 {name:'System',icon:'⚙',action:'settingssystem',text:'Updates, Favoriten, Sicherung und Hintergrund-Apps.'},
 {name:'Über Tizen Deck',icon:'ⓘ',action:'about',text:'Version und Hinweise zum Launcher.'}]},
{name:'Medien',icon:'▷',items:[{name:'Plex',icon:'›',id:'kIciSQlYEM.plex',text:'Deine Filme, Serien und Musik auf deinem Plex-Server.',sub:'Deine Mediathek'},{name:'Jellyfin',icon:'▷',id:'AprZAARz4r.Jellyfin',text:'Deine Mediathek auf deinem Jellyfin-Server.'},{name:'YouTube',icon:'▶',id:'9Ur5IzDKqV.TizenYouTube',text:'Öffnet die installierte YouTube-App.'}]},
{name:'Internet',icon:'◎',items:[{name:'Browser',icon:'◎',id:'org.tizen.browser',text:'Öffnet den vorhandenen Browser des Monitors.',sub:'Web auf dem großen Bildschirm'}]},
{name:'Remote',icon:'▣',items:[{name:'Moonlight',icon:'☾',id:'MoonLightS.MoonlightWasm',text:'Streame Spiele und den Desktop von deinem PC. Sunshine und die Kopplung richtest du in Moonlight ein.',sub:'PC-Streaming'},{name:'Bildschirm spiegeln',icon:'▣',id:'org.tizen.ScreenMirroring-app-tv',text:'Öffnet Samsungs vorhandene Bildschirmspiegelung. Unterstützung hängt vom sendenden Gerät ab.'},{name:'Eingänge',icon:'▣',action:'inputs',text:'Anschlüsse, Verbindungsstatus und eigene Gerätenamen. OK wechselt zum Eingang.'},{name:'Remote Workspace',icon:'▤',id:'com.samsung.tv.coba.remoteworkspace',text:'Öffnet den vorhandenen Arbeitsbereich für entfernte Computer.'}]}
];
var savedFavorites=[],recentIds=[];
try{savedFavorites=JSON.parse(localStorage.getItem('favorites')||'[]');recentIds=JSON.parse(localStorage.getItem('recentApps')||'[]');}catch(e){}
if(!Array.isArray(savedFavorites))savedFavorites=[];if(!Array.isArray(recentIds))recentIds=[];
var appCatalog=[{name:'Bildeinstellungen',icon:'☼',id:'org.tizen.menu',text:'Samsung-Einstellungen für Bild und Ton.'}];groups.forEach(function(g){g.items.forEach(function(a){if(a.id&&!appCatalog.some(function(b){return b.id===a.id;}))appCatalog.push(a);});});
var favoriteGroup={name:'Favoriten',icon:'ⓘ',items:[]},recentGroup={name:'Zuletzt',icon:'≈',items:[]};
groups.push({name:'Musik',icon:'♪',items:[{name:'Plex Musik',icon:'♪',id:'kIciSQlYEM.plex',text:'Öffnet Plex. Dort deine Musikbibliothek auswählen.'}]},{name:'Extras',icon:'♧',items:[{name:'Flappy Smasnug',icon:'♧',action:'flappy',text:'Ein Bildschirm zwischen Fernbedienungen. OK lässt ihn fliegen.',sub:'Lokales Spiel'},{name:'Uhr & Timer',icon:'≈',action:'timetools',text:'Große Uhr, Stoppuhr mit Zwischenzeiten und Countdown.',sub:'Zeit im Blick'}]},favoriteGroup,recentGroup);
function refreshCollections(){
 function resolve(ids){return ids.map(function(id){return appCatalog.filter(function(a){return a.id===id;})[0];}).filter(Boolean);}
 favoriteGroup.items=resolve(savedFavorites);recentGroup.items=resolve(recentIds);
 if(!favoriteGroup.items.length)favoriteGroup.items=[{name:'Favoriten hinzufügen',icon:'ⓘ',action:'favorites',text:'Wähle deine häufig verwendeten Apps.'}];
 if(!recentGroup.items.length)recentGroup.items=[{name:'Noch keine Apps gestartet',icon:'ⓘ',action:'empty',text:'Erfolgreich gestartete Apps erscheinen hier.'}];
}
function recordLaunch(item){recentIds=[item.id].concat(recentIds.filter(function(id){return id!==item.id;})).slice(0,8);try{localStorage.setItem('recentApps',JSON.stringify(recentIds));}catch(e){}refreshCollections();renderedCategory=-1;}
refreshCollections();
var iconNames={'⚙':'settings','☼':'settings','♪':'sound','≈':'wave','ⓘ':'info','♧':'game','☾':'moon','▷':'video','▶':'video','›':'plex','◎':'network','▣':'display','▤':'display'};
function setIcon(span,symbol){var img=document.createElement('img');img.src='icons/'+(iconNames[symbol]||'info')+'.svg';img.alt='';span.appendChild(img);}
var $=function(id){return document.getElementById(id);};
var splash=$('splash'),splashStartedAt=Date.now(),splashTimer=null;
function dismissSplash(){if(splash&&splash.parentNode)splash.parentNode.removeChild(splash);splash=null;if(splashTimer!==null)clearTimeout(splashTimer);splashTimer=null;}
if(splash)splash.addEventListener('animationend',function(e){if(e.target===splash&&e.animationName==='splash-out')dismissSplash();});
splashTimer=setTimeout(dismissSplash,2300);
function notice(s){$('toast').textContent=s;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(function(){$('toast').style.display='none';},5000);}
var dialogBack=null;
function modal(title,text){dialogBack=null;$('close').textContent='OK · Zurück';$('dialog-actions').textContent='';$('dialog-title').textContent=title;$('dialog-text').textContent=text;if(!$('dialog').open)$('dialog').showModal();$('close').focus();}
var menuAudio=DeckMenuAudio();
function playClick(){menuAudio.click();}
var renderedCategory=-1,renderedRow=-1,navCategory=-1,itemCache=[],renderFrame=null,visibleCache=null;
// Input updates the selection immediately; only the latest state paints per frame.
function render(){if(renderFrame===null)renderFrame=requestAnimationFrame(function(){renderFrame=null;renderNow();});}
function flushRender(){if(renderFrame!==null)cancelAnimationFrame(renderFrame);renderFrame=null;renderNow();}
function attr(el,name,value){if(el.getAttribute(name)!==value)el.setAttribute(name,value);}
function className(el,value){if(el.className!==value)el.className=value;}
function renderNow(){
 row=Math.max(0,Math.min(row,groups[cat].items.length-1));
 var nav=$('categories'),list=$('items');
 if(!nav.children.length){groups.forEach(function(g,i){var b=document.createElement('button');b.className='category';b.setAttribute('aria-label',g.name);var icon=document.createElement('span');icon.className='symbol';setIcon(icon,g.icon);b.appendChild(icon);var label=document.createElement('span');label.className='label';label.textContent=g.name;b.appendChild(label);b.onclick=function(){playClick();cat=i;row=0;render();};nav.appendChild(b);});}
 if(navCategory!==cat){
  if(navCategory>=0){className(nav.children[navCategory],'category');attr(nav.children[navCategory],'aria-pressed','false');}
  className(nav.children[cat],'category selected');attr(nav.children[cat],'aria-pressed','true');
  groups.forEach(function(g,i){
   var b=nav.children[i],offset=(i-cat)*11,off=34+offset<=0||26+offset>=100;
   b.style.transform='translateX('+offset+'vw)';attr(b,'aria-hidden',String(off));
   var tab=off?-1:0;if(b.tabIndex!==tab)b.tabIndex=tab;
  });navCategory=cat;
 }
 if(renderedCategory===cat&&renderedRow===row)return;
 var cache=itemCache[cat];
 // Already hidden categories are never rewritten during unrelated navigation.
 if(visibleCache&&(renderedCategory!==cat||visibleCache!==cache||cache.items!==groups[cat].items)){
  visibleCache.buttons.forEach(function(b){className(b,'item');attr(b,'aria-pressed','false');attr(b,'aria-hidden','true');if(b.tabIndex!==-1)b.tabIndex=-1;});
 }
 if(!cache||cache.items!==groups[cat].items){
  if(cache)cache.buttons.forEach(function(b){if(b.parentNode)b.parentNode.removeChild(b);});
  cache={items:groups[cat].items,buttons:[]};var category=cat;
  groups[cat].items.forEach(function(item,i){
   var b=document.createElement('button');b.className='item';b.tabIndex=-1;
   var icon=document.createElement('span');icon.className='symbol';setIcon(icon,item.icon);b.appendChild(icon);
   var label=document.createElement('span');label.textContent=item.name;
   if(item.sub){var small=document.createElement('small');small.textContent=item.sub;label.appendChild(small);}
   b.appendChild(label);b.onclick=function(){playClick();cat=category;row=i;launch();};cache.buttons.push(b);list.appendChild(b);
  });itemCache[cat]=cache;
 }
 cache.buttons.forEach(function(b,i){
  var off=i<row||i>row+3;
  className(b,'item'+(i===row?' selected':''));attr(b,'aria-pressed',String(i===row));attr(b,'aria-hidden',String(off));
  var tab=off?-1:0;if(b.tabIndex!==tab)b.tabIndex=tab;
  var transform='translateY('+((i-row)*13)+'vh)';if(b.style.transform!==transform)b.style.transform=transform;
 });
 visibleCache=cache;renderedCategory=cat;renderedRow=row;
 var item=groups[cat].items[row];$('eyebrow').textContent=groups[cat].name;$('title').textContent=item.name;$('description').textContent=item.text;$('badge').textContent=item.id?'APP ÖFFNEN':'LOKALE EINSTELLUNG';
}
function openFlappy(){
 DeckFlappy.open({soundOn:menuAudio.enabled,onclose:function(){
  if(clockTimer!==null)clearTimeout(clockTimer);
  clockTimer=null;
  if(!document.hidden)tickClock();
 }});
 if(clockTimer!==null)clearTimeout(clockTimer);
 clockTimer=null;
}
function soundMenu(){
 DeckSounds.open({modal:modal,enabled:menuAudio.enabled,toggle:menuAudio.toggle,set:menuAudio.set,reset:menuAudio.reset});
}
function toggleMotion(){
 var off=!document.body.classList.contains('still');
 document.body.classList.toggle('still',off);
 try{localStorage.setItem('still',String(off));}catch(e){}
 notice(off?'Wellenbewegung aus':'Wellenbewegung an');
}
function aboutMenu(){
 modal('Tizen Deck · 1.0.0','Lokaler TV-Launcher im XMB-Stil.\nPfeiltasten navigieren · OK startet · Zurück öffnet das Beenden-Menü.\nSamsung Home bleibt unter Einstellungen erreichbar. Die Belegung der Home-Taste wird am Gerät eingerichtet.\nOptionaler Webserver direkt auf dem Monitor.\nHome-Zuordnung und Launcher-Autostart werden separat am Gerät eingerichtet. Der Webserver startet nach einem vollständigen Neustart noch nicht automatisch.');
}
var actions={
 audio:DeckSystem.audio,network:DeckSystem.network,privacy:DeckSystem.privacy,
 settingsav:function(){settingsMenu('av');},settingsdevices:function(){settingsMenu('devices');},
 settingsnetwork:function(){settingsMenu('network');},settingssystem:function(){settingsMenu('system');},
 backup:function(){DeckBackup.open({modal:modal,notice:notice});},
 picture:function(){if(!device){notice('Vorschau: Samsung-Bildeinstellungen');return;}DeckApps.launch(appCatalog[0],function(){$('dialog').close();},function(e){notice(e.message||e.name);});},
 flappy:openFlappy,apppolicy:appPolicyMenu,performance:performanceMenu,
 inputs:function(){DeckInputs.open({modal:modal,notice:notice});},
 deckupdates:DeckDevice.updates,webinterface:DeckDevice.open,
 bluetooth:bluetoothMenu,favorites:manageFavorites,sound:soundMenu,
 controller:showControllers,motion:toggleMotion,about:aboutMenu,timetools:DeckTimeTools.open,empty:function(){}
};
var settingsSections={
 av:{name:'Bild & Ton',items:[['Bildeinstellungen','picture'],['Ton & Audioausgabe','audio'],['Leistungsprofil','performance'],['Bewegung','motion'],['Menütöne','sound']]},
 devices:{name:'Geräte',items:[['Bluetooth & Geräte','bluetooth'],['Controller','controller'],['Eingänge','inputs']]},
 network:{name:'Netzwerk & Webserver',items:[['Netzwerk','network'],['Webserver-Konfiguration','webinterface']]},
 system:{name:'System',items:[['Favoriten verwalten','favorites'],['Einstellungen sichern / laden','backup'],['Tizen-Deck-Updates','deckupdates'],['Apps im Hintergrund','apppolicy'],['Datenschutz-Dienste','privacy']]}
};
function settingsMenu(section,focusAction){
 var menu=settingsSections[section];modal(menu.name,'Auswählen mit ▲ ▼ und OK. Zurück führt zur Übersicht.');
 var focus=null;
 menu.items.forEach(function(item){var button=document.createElement('button');button.textContent=item[0];button.onclick=function(){
  actions[item[1]]();
  if($('dialog').open&&$('dialog-title').textContent!==menu.name){dialogBack=function(){settingsMenu(section,item[1]);};$('close').textContent='Zurück · '+menu.name;}
 };$('dialog-actions').appendChild(button);if(item[1]===focusAction)focus=button;});
 (focus||$('dialog-actions').firstChild).focus();
}
function launch(){
 flushRender();
 var item=groups[cat].items[row],action=actions[item.action];
 if(action){action();return;}
 if(!device){notice('Vorschau: '+item.name+' würde auf dem TV gestartet.');return;}
 try{
  DeckApps.launch(item,function(){recordLaunch(item);notice(item.name+' gestartet');},
   function(e){notice('Start fehlgeschlagen: '+(e.message||e.name));});
 }catch(e){notice('Start fehlgeschlagen: '+e.message);}
}
$('dialog-actions').addEventListener('focusin',function(e){var box=$('dialog-actions'),b=e.target;if(b.tagName!=='BUTTON'&&b.tagName!=='INPUT')return;var top=b.offsetTop,bottom=top+b.offsetHeight;if(top<box.scrollTop)box.scrollTop=top;else if(bottom>box.scrollTop+box.clientHeight)box.scrollTop=bottom-box.clientHeight;});
function backDialog(){if(dialogBack){var back=dialogBack;dialogBack=null;back();}else $('dialog').close();}
$('close').onclick=backDialog;
$('dialog').addEventListener('close',function(){if(!$('dialog').open&&document.activeElement&&$('dialog').contains(document.activeElement))document.activeElement.blur();});
function moveSelection(key){
 var nextCat=cat,nextRow=row;
 if(key===37||key===39){nextCat=Math.max(0,Math.min(groups.length-1,cat+(key===37?-1:1)));if(nextCat!==cat)nextRow=0;}
 else if(key===38||key===40)nextRow=Math.max(0,Math.min(groups[cat].items.length-1,row+(key===38?-1:1)));
 if(nextCat===cat&&nextRow===row)return false;
 cat=nextCat;row=nextRow;playClick();render();return true;
}
function handleKey(key){
 if(DeckFlappy.active()){DeckFlappy.key(key,false);return;}
 var dialog=$('dialog');
 if(dialog.open){
  if($('dialog-actions').children.length&&key===13&&document.activeElement&&document.activeElement.tagName==='BUTTON'){playClick();document.activeElement.click();return;}
  if($('dialog-actions').children.length&&(key===38||key===40)){
   var buttons=Array.prototype.filter.call(dialog.querySelectorAll('button,input'),function(b){return !b.disabled&&b.type!=='file';});
   var at=buttons.indexOf(document.activeElement),next=buttons[Math.max(0,Math.min(buttons.length-1,at+(key===38?-1:1)))];
   if(next&&next!==document.activeElement){playClick();next.focus();}return;
  }
  if($('dialog-title').textContent==='Controller'&&(key===37||key===39)){playClick();cycleProfile();return;}
  if(key===10009||key===27||key===13){playClick();backDialog();}return;
 }
 if(key>=37&&key<=40){moveSelection(key);return;}
 if(key===13){playClick();launch();return;}
 if(key===10009||key===27){playClick();modal('Launcher verlassen','Das originale Menü findest du unter Einstellungen → Samsung Home. Plex und Moonlight kannst du jederzeit aus dem Launcher öffnen.');}
}
var lastInput={key:0,time:0,source:''};
function input(key,source){if(source==='gamepad'&&window.DeckStatus)DeckStatus.activity();hidePointer();var now=Date.now();if(key===lastInput.key&&source!==lastInput.source&&now-lastInput.time<100)return;lastInput={key:key,time:now,source:source};handleKey(key);}
var pointerTimer,wheelTime=0;
function hidePointer(){document.body.classList.remove('pointer-active');}
function showPointer(){document.body.classList.add('pointer-active');clearTimeout(pointerTimer);pointerTimer=setTimeout(hidePointer,2500);}
document.addEventListener('mousemove',showPointer);
document.addEventListener('mousedown',showPointer);
document.addEventListener('mouseleave',hidePointer);
document.addEventListener('keydown',function(e){
 if(e.altKey||e.ctrlKey||e.metaKey)return;
 if(DeckFlappy.active()){hidePointer();if(DeckFlappy.key(e.keyCode,e.repeat))e.preventDefault();return;}
 if(document.activeElement&&document.activeElement.tagName==='INPUT'&&[38,40,27,10009].indexOf(e.keyCode)<0)return;
 // Tab keeps native focus navigation; activate the focused button with Enter/Space.
 if(e.keyCode===9){hidePointer();return;}
 if((e.keyCode===13||e.keyCode===32)&&document.activeElement&&document.activeElement.tagName==='BUTTON'&&(!$('dialog').contains(document.activeElement)||$('dialog').open)){
  e.preventDefault();hidePointer();playClick();document.activeElement.click();return;
 }
 var key=e.keyCode===32?13:e.keyCode;
 if([37,38,39,40,13,10009,27].indexOf(key)>=0){e.preventDefault();if(!$('dialog').open&&document.activeElement)document.activeElement.blur();input(key,'keyboard');}
});
document.addEventListener('wheel',function(e){
 e.preventDefault();if(DeckFlappy.active()||$('dialog').open)return;
 var now=Date.now();if(now-wheelTime<150||Math.max(Math.abs(e.deltaX),Math.abs(e.deltaY))<3)return;
 wheelTime=now;if(document.activeElement)document.activeElement.blur();
 moveSelection(Math.abs(e.deltaX)>Math.abs(e.deltaY)?(e.deltaX>0?39:37):(e.deltaY>0?40:38));showPointer();
},{passive:false});
document.addEventListener('contextmenu',function(e){e.preventDefault();input(27,'mouse');});
function clock(){
 if(document.hidden)return;
 var value=DeckClock.read(new Date());
 attr($('hour-hand'),'transform','rotate('+value.hour+' 16 16)');
 attr($('minute-hand'),'transform','rotate('+value.minute+' 16 16)');
 if($('clock').textContent!==value.text)$('clock').textContent=value.text;
}
try{document.body.classList.toggle('still',localStorage.getItem('still')==='true');}catch(e){}var padNav=new DeckGamepad(),padProfile='auto';
try{padProfile=localStorage.getItem('controllerProfile')||'auto';}catch(e){}
function getPads(){try{return navigator.getGamepads?navigator.getGamepads():[];}catch(e){return [];}}
function showControllers(){var pads=getPads(),lines=[];for(var i=0;i<pads.length;i++){if(pads[i])lines.push(pads[i].id+' · '+(pads[i].mapping||'ohne Standardbelegung'));}modal('Controller', (lines.length?lines.join('\n'):'Kein Controller erkannt. Per USB oder über Samsung Bluetooth koppeln, dann eine Taste drücken.')+'\n\nProfil: '+padProfile+'\nA/Kreuz: Öffnen · B/Kreis: Zurück\nLinks/rechts: Profil wechseln (Auto → Standard → PS3 Legacy).\nUnbekannte Belegungen benötigen ein passendes Profil.');}
function cycleProfile(){var profiles=['auto','standard','ps3-legacy'];padProfile=profiles[(profiles.indexOf(padProfile)+1)%profiles.length];padNav.reset();try{localStorage.setItem('controllerProfile',padProfile);}catch(err){}var back=dialogBack,label=$('close').textContent;$('dialog').close();showControllers();dialogBack=back;$('close').textContent=label;}
// Samsung menu mode can also synthesize ordinary keyboard events; input() deduplicates those.
var padTimer=null;
function pollPads(){
 padTimer=null;if(document.hidden)return;
 var pads=getPads(),connected=false;
 for(var p=0;p<pads.length;p++)if(pads[p]&&pads[p].connected!==false)connected=true;
 var events=padNav.read(pads,Date.now(),padProfile);
 for(var i=0;i<events.length;i++)input(events[i],'gamepad');
 padTimer=setTimeout(pollPads,connected?50:1000);
}
function syncVisibility(){
 document.body.classList.toggle('app-hidden',document.hidden);padNav.reset();if(document.hidden&&renderFrame!==null){cancelAnimationFrame(renderFrame);renderFrame=null;}
 if(padTimer!==null){clearTimeout(padTimer);padTimer=null;}
 if(clockTimer!==null){clearTimeout(clockTimer);clockTimer=null;}
 if(!document.hidden){if(Date.now()-splashStartedAt>=2300)dismissSplash();flushRender();pollPads();if(!DeckFlappy.active())tickClock();}
}
window.addEventListener('gamepadconnected',function(){
 if(padTimer!==null)clearTimeout(padTimer);pollPads();
 notice('Controller erkannt. Details unter Einstellungen → Geräte → Controller.');
});
var performanceProfile='eco';
try{performanceProfile=localStorage.getItem('performanceProfile')||'eco';}catch(e){}
function applyPerformance(profile){
 if(['balanced','quality','eco','direct'].indexOf(profile)<0)profile='eco';
 performanceProfile=profile;document.body.setAttribute('data-performance',profile);
 try{localStorage.setItem('performanceProfile',profile);}catch(e){}
}
function performanceMenu(){
 modal('Leistungsprofil','Ausgewogen: reduzierte Wellen-Effekte. Volle Effekte: alle Wellen und Schatten. Sparsam: ruhiger Hintergrund und kurze Menüübergänge. Direkt: sofortige Auswahl ohne gleitende Übergänge; Menütöne bleiben erhalten.');
 [{id:'balanced',name:'Ausgewogen'},{id:'quality',name:'Volle Effekte'},{id:'eco',name:'Sparsam'},{id:'direct',name:'Direkt · schnellste Reaktion'}].forEach(function(p){
  var b=document.createElement('button');b.textContent=(performanceProfile===p.id?'● ':'○ ')+p.name;
  b.onclick=function(){applyPerformance(p.id);$('dialog').close();notice(p.name+' aktiviert');};$('dialog-actions').appendChild(b);
 });$('dialog-actions').children[['balanced','quality','eco','direct'].indexOf(performanceProfile)].focus();
}
applyPerformance(performanceProfile);
function appPolicyMenu(){
 modal('Apps im Hintergrund','Standardmäßig werden Plex, Jellyfin, YouTube, Browser, Moonlight und die Remote-Apps bei Rückkehr zu Deck bzw. vor einem App-Wechsel geschlossen. Wiedergabe und ungespeicherte App-Sitzungen enden dabei. Für Musik im Hintergrund ausschalten. Benötigt den laufenden TV-Dienst.'+(DeckApps.error()?'\nLetzter Status: '+DeckApps.error():''));
 var b=document.createElement('button');function label(){b.textContent='Automatisch schließen: '+(DeckApps.enabled()?'Ein':'Aus');b.setAttribute('aria-pressed',String(DeckApps.enabled()));}label();b.onclick=function(){DeckApps.setEnabled(!DeckApps.enabled());label();};$('dialog-actions').appendChild(b);b.focus();
 var clean=document.createElement('button');clean.textContent='Jetzt aufräumen';clean.onclick=function(){if(!DeckApps.enabled()){notice('Zum Aufräumen zuerst einschalten.');return;}DeckApps.clean(function(error,result){notice(error||((result.closed||[]).length+' App-Sitzungen beendet'+((result.restarted||[]).length?' · Samsung hält Reserveprozesse vor':'')));});};$('dialog-actions').appendChild(clean);
}
function bluetoothMenu(){
 modal('Bluetooth & Geräte','Gerät in den Kopplungsmodus versetzen und in der Samsung-Geräteliste auswählen.');
 [{name:'Audio / Headset',id:'org.tizen.btaudiolist'},{name:'Tastatur, Maus & Controller · Einstellungen',id:'org.tizen.menu'}].forEach(function(a){var b=document.createElement('button');b.textContent=a.name;b.onclick=function(){if(!device){notice('Vorschau: '+a.name);return;}try{if(window.DeckGuard)DeckGuard.leave();tizen.application.launch(a.id,function(){$('dialog').close();},function(e){if(window.DeckGuard)DeckGuard.resume();notice('Gerätemenü nicht verfügbar: '+(e.message||e.name));});}catch(e){if(window.DeckGuard)DeckGuard.resume();notice(e.message);}};$('dialog-actions').appendChild(b);});$('dialog-actions').firstChild.focus();
}
function saveFavorites(){
 try{localStorage.setItem('favorites',JSON.stringify(savedFavorites));}catch(e){notice('Favoriten konnten nicht gespeichert werden.');}
 refreshCollections();renderedCategory=-1;render();
}
function manageFavorites(){
 modal('Favoriten','OK fügt eine App hinzu oder entfernt sie. Die Reihenfolge kannst du separat ändern.');
 dialogBack=function(){settingsMenu('system','favorites');};$('close').textContent='Zurück · System';
 var sort=document.createElement('button');sort.textContent='Reihenfolge ändern';sort.disabled=!savedFavorites.length;sort.onclick=function(){sortFavorites();};$('dialog-actions').appendChild(sort);
 appCatalog.forEach(function(item){var b=document.createElement('button');function label(){b.textContent=(savedFavorites.indexOf(item.id)>=0?'★ ':'☆ ')+item.name;}label();b.onclick=function(){var at=savedFavorites.indexOf(item.id);if(at>=0)savedFavorites.splice(at,1);else savedFavorites.push(item.id);saveFavorites();label();sort.disabled=!savedFavorites.length;};$('dialog-actions').appendChild(b);});
 (sort.disabled?sort.nextSibling:sort).focus();
}
function sortFavorites(selectedId){
 modal('Favoriten sortieren','App auswählen, dann nach oben oder unten verschieben. Änderungen werden sofort gespeichert.');
 var focus=null;
 savedFavorites.forEach(function(id,i){var item=appCatalog.filter(function(a){return a.id===id;})[0];if(!item)return;
  var b=document.createElement('button');b.textContent=(i+1)+'. '+item.name;b.onclick=function(){moveFavorite(id);};$('dialog-actions').appendChild(b);if(id===selectedId)focus=b;
 });
 dialogBack=manageFavorites;$('close').textContent='Zurück · Favoriten';(focus||$('dialog-actions').firstChild||$('close')).focus();
}
function moveFavorite(id,focused){
 var at=savedFavorites.indexOf(id),item=appCatalog.filter(function(a){return a.id===id;})[0];
 if(at<0||!item){sortFavorites();return;}
 modal(item.name,'Position '+(at+1)+' von '+savedFavorites.length+' · OK verschiebt die App um einen Platz.');
 [-1,1].forEach(function(delta){var b=document.createElement('button');b.textContent=delta<0?'Nach oben':'Nach unten';b.disabled=at+delta<0||at+delta>=savedFavorites.length;
  b.onclick=function(){savedFavorites.splice(at,1);savedFavorites.splice(at+delta,0,id);saveFavorites();moveFavorite(id,delta);};$('dialog-actions').appendChild(b);
 });
 dialogBack=function(){sortFavorites(id);};$('close').textContent='Zurück · Reihenfolge';
 var preferred=$('dialog-actions').children[focused===1?1:0];(preferred&&!preferred.disabled?preferred:$('dialog-actions').querySelector('button:not(:disabled)')||$('close')).focus();
}
var clockTimer=null;
function tickClock(){clockTimer=null;if(document.hidden||DeckFlappy.active())return;clock();clockTimer=setTimeout(tickClock,15000-Date.now()%15000);}
DeckApps.init(notice);
DeckTimeTools.init({modal:modal,notice:notice,ping:playClick});
$('platform').textContent=device?'AUF DEINEM MONITOR':'BROWSER-VORSCHAU';renderNow();syncVisibility();document.addEventListener('visibilitychange',syncVisibility);
})();
