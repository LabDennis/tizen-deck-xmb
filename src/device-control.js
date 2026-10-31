(function(){'use strict';var generation=0;
window.DeckDevice={open:function(){
 var active=++generation;var dialog=document.getElementById('dialog'),actions=document.getElementById('dialog-actions'),text=document.getElementById('dialog-text');
 actions.textContent='';document.getElementById('dialog-title').textContent='Webserver-Konfiguration';text.textContent='Status wird gelesen …';if(!dialog.open)dialog.showModal();document.getElementById('close').focus();
 var config=window.DECK_DEVICE;if(!config){text.textContent='Der TV-Dienst ist in diesem Paket noch nicht eingerichtet.';return;}
 function request(path,data,done){var xhr=new XMLHttpRequest();xhr.open(data?'POST':'GET',config.url+path,true);xhr.timeout=12000;xhr.setRequestHeader('X-Deck-Control',config.token);if(data)xhr.setRequestHeader('Content-Type','application/json');xhr.onload=function(){if(!dialog.open||active!==generation)return;var r;try{r=JSON.parse(xhr.responseText);}catch(e){text.textContent='Ungültige Antwort vom TV-Dienst';return;}if(xhr.status!==200){text.textContent=r.error||'Anfrage fehlgeschlagen';return;}done(r);};xhr.onerror=xhr.ontimeout=function(){if(!dialog.open||active!==generation)return;text.textContent='TV-Dienst nicht erreichbar. Nach einem vollständigen Neustart ist derzeit eine erneute Dienstaktivierung nötig.';};xhr.send(data?JSON.stringify(data):null);}
 request('/status',null,function(state){
  text.textContent=(state.enabled?'Aktiv: ':'Aus: ')+state.url+'\nTV-Dienst '+(state.version||'unbekannt')+(state.boot_persistent?' · automatischer Systemstart':' · erneute Aktivierung nach Kaltstart nötig')+'\nHTTPS-Zertifikat ist lokal erstellt. Zugangsdaten bleiben auf dem Monitor.';
  function button(label,fn){var b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.appendChild(b);return b;}
  var toggle=button(state.enabled?'Webserver ausschalten':'Webserver einschalten',function(){request('/enabled',{enabled:!state.enabled},function(r){state.enabled=r.enabled;toggle.textContent=state.enabled?'Webserver ausschalten':'Webserver einschalten';text.textContent=(state.enabled?'Aktiv: ':'Aus: ')+state.url;});});
  var name=document.createElement('input');name.type='text';name.value=state.username||'admin';name.maxLength=40;name.setAttribute('aria-label','Benutzername');name.placeholder='Benutzername';actions.appendChild(name);
  var pass=document.createElement('input');pass.type='password';pass.maxLength=256;pass.setAttribute('aria-label','Neues Passwort, mindestens fünf Zeichen');pass.placeholder='Neues Passwort (mindestens 5 Zeichen)';actions.appendChild(pass);
  button('Benutzername und Passwort speichern',function(){request('/credentials',{username:name.value,password:pass.value},function(){pass.value='';text.textContent='Zugang gespeichert. Andere Anmeldungen wurden beendet.\n'+state.url;});});
  toggle.focus();
 });
},updates:function(){
 var active=++generation,dialog=document.getElementById('dialog'),actions=document.getElementById('dialog-actions'),text=document.getElementById('dialog-text'),title=document.getElementById('dialog-title');
 actions.textContent='';title.textContent='Tizen-Deck-Updates';if(!dialog.open)dialog.showModal();document.getElementById('close').focus();
 var version='1.0.0';try{version=tizen.application.getCurrentApplication().appInfo.version;}catch(e){}
 var config=window.DECK_DEVICE,xhr=null,view=0;
 if(!config){text.textContent='Launcher '+version+'\nKein TV-Dienst eingerichtet. Updates können mit dem externen Installer eingespielt werden.';return;}
 function valid(v){return dialog.open&&active===generation&&title.textContent==='Tizen-Deck-Updates'&&v===view;}
 function request(path,data,done,fail){var v=view,x=new XMLHttpRequest();xhr=x;x.open(data?'POST':'GET',config.url+path,true);x.timeout=path.indexOf('/updates/install')===0||path==='/updates/rollback'?135000:30000;x.setRequestHeader('X-Deck-Control',config.token);if(data)x.setRequestHeader('Content-Type','application/json');
  function failure(message){if(!valid(v))return;if(fail){fail(message);return;}text.textContent=message||'Antwort fehlt; Installationsstatus unbekannt. Version erneut prüfen.';actions.textContent='';button('Zur Übersicht',home);focus();}
  x.onload=function(){if(!valid(v))return;var r;try{r=JSON.parse(x.responseText);}catch(e){failure('Ungültige Antwort vom TV-Dienst');return;}if(x.status!==200){failure(r.error||'Anfrage fehlgeschlagen');return;}done(r);};x.onerror=x.ontimeout=function(){failure();};x.send(data?JSON.stringify(data):null);
 }
 function reset(message){view++;if(xhr)try{xhr.abort();}catch(e){}actions.textContent='';text.textContent=message;}
 function button(label,fn){var b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.appendChild(b);return b;}
 function focus(){if(actions.firstChild)actions.firstChild.focus();}
 function home(){reset('Launcher '+version+'\nLauncher und TV-Webdienst lassen sich getrennt aktualisieren.');button('Launcher-Updates',launcher);button('TV-Dienst aktualisieren',backend);button('Updatequelle konfigurieren',feed);focus();}
 function launcher(){reset('Launcher wird geprüft …');request('/updates',null,function(r){text.textContent='Installierter Launcher: '+(r.installed||version)+'\n'+(r.message||'');
  if(r.available)button('Launcher '+r.version+' installieren',function(){reset('Signatur wird erneut geprüft. Der Launcher kann sich während des Updates schließen.');request('/updates/install',{confirm:true},function(v){text.textContent=v.message;button('Erneut prüfen',launcher);focus();});});
  if(r.can_rollback)button('Launcher '+r.rollback_version+' wiederherstellen',function(){reset('Signiertes Rückfallpaket wird installiert …');request('/updates/rollback',{confirm:true},function(v){text.textContent=v.message;button('Erneut prüfen',launcher);focus();});});button('Vom PC laden und prüfen',function(){download('launcher');});button('Erneut prüfen',launcher);button('Zur Übersicht',home);focus();});}
 function backend(){reset('TV-Dienst wird geprüft …');request('/backend/updates',null,drawBackend);}
 function drawBackend(r){actions.textContent='';text.textContent='Installierter TV-Dienst: '+r.installed+(r.version?'\nVorbereitet: '+r.version:'\nKein Backend-Paket vorbereitet.')+(r.result?'\n'+r.result.message:'')+(r.error?'\n'+r.error:'');
  if(!r.busy&&r.available)button('TV-Dienst '+r.version+' installieren',function(){changeBackend('/backend/install');});
  if(!r.busy&&r.can_rollback)button('TV-Dienst '+r.rollback_version+' wiederherstellen',function(){changeBackend('/backend/rollback');});
  button('Vom PC laden und prüfen',function(){download('backend');});button('Status erneut prüfen',backend);button('Zur Übersicht',home);focus();
 }
 function changeBackend(path){reset('Backend-Wechsel wird vorbereitet. Die Verbindung wird kurz unterbrochen.');var v=view,tries=0;
  function again(){if(!valid(v))return;if(++tries>20){text.textContent='Verbindung noch nicht bestätigt. Installationsstatus unbekannt; erneut prüfen.';button('Status erneut prüfen',backend);button('Zur Übersicht',home);focus();return;}setTimeout(function(){if(!valid(v))return;request('/backend/updates',null,function(r){if(r.busy){again();return;}drawBackend(r);},again);},2000);}
  request(path,{confirm:true},function(r){text.textContent=r.message;again();},again);
 }
 function download(component){reset('Signiertes Paket wird von der Updatequelle geladen …');request(component==='launcher'?'/updates/check':'/backend/check',{},function(result){text.textContent=result.message;button(component==='launcher'?'Launcher-Updates':'TV-Dienst aktualisieren',component==='launcher'?launcher:backend);button('Zur Übersicht',home);focus();});}
 function feed(){reset('Release-Einstellungen werden gelesen …');request('/backend/feed',null,function(r){text.textContent='Eigene HTTPS-Updatequelle für Launcher und TV-Dienst. Downloads erfolgen nur auf Abruf; Installation separat.'+(r.pinned?'\nPC-Zertifikat fest hinterlegt.':'')+(r.authenticated?' Privater Lesezugang eingerichtet.':'');var input=document.createElement('input');input.type='url';input.maxLength=1024;input.value=r.url||'';input.placeholder='https://pc:8845/';input.setAttribute('aria-label','Release-Adresse');actions.appendChild(input);
  button('Adresse speichern',function(){request('/backend/feed',{url:input.value},function(){feed();});});
  if(r.configured){button('Launcher laden und prüfen',function(){download('launcher');});button('TV-Dienst laden und prüfen',function(){download('backend');});}
  button('Zur Übersicht',home);if(r.configured)actions.children[2].focus();else focus();});}

 home();
}};
})();
