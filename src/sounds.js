/* USB imports use Tizen's public filesystem API; only app-private copies persist. */
(function(){'use strict';
var preview=new Audio(),timer=null,epoch=0;
function stop(){epoch++;preview.pause();preview.removeAttribute('src');if(timer!==null)clearTimeout(timer);timer=null;}
function fs(){if(!window.tizen||!tizen.filesystem)throw new Error('USB-Sounds sind nur am Monitor verfügbar.');return tizen.filesystem;}
function valid(file,kind){return file.isFile&&/\.(wav|mp3)$/i.test(file.name)&&file.fileSize>0&&file.fileSize<=(kind==='click'?2:8)*1024*1024;}
function restore(kind,done){var path;try{path=localStorage.getItem('soundFile.'+kind);}catch(e){}if(!path||path.indexOf('wgt-private/deck-sounds/'+kind+'.')!==0){done(null);return;}try{fs().resolve(path,function(f){done(valid(f,kind)?f.toURI():null);},function(){done(null);},'r');}catch(e){done(null);}}
function open(ui){
 var dialog=document.getElementById('dialog'),actions=document.getElementById('dialog-actions'),text=document.getElementById('dialog-text');
 ui.modal('Menütöne','Eigene WAV- oder MP3-Dateien vom USB-Stick importieren. Die Kopie bleibt auf dem Monitor, auch wenn du den Stick abziehst.');
 function current(){return dialog.open&&document.getElementById('dialog-title').textContent==='Menütöne';}
 function button(label,fn){var b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.appendChild(b);}
 function page(message){stop();actions.textContent='';text.textContent=message;}
 function focus(){if(actions.firstChild)actions.firstChild.focus();}
 function fail(e){if(current()){text.textContent='Sound nicht übernommen: '+(e.message||e.name||e);}}
 function menu(){page('WAV / MP3 · Klick bis 2 MB, Intro bis 8 MB. Die Vorschau endet nach spätestens 5 Sekunden.');button(ui.enabled()?'Menütöne ausschalten':'Menütöne einschalten',function(){ui.toggle();menu();});
  ['click','intro'].forEach(function(kind){button((kind==='click'?'Klickton':'Introton')+' vom USB-Stick',function(){storages(kind);});button((kind==='click'?'Klickton':'Introton')+' zurücksetzen',function(){try{localStorage.removeItem('soundFile.'+kind);}catch(e){}ui.reset(kind);menu();});});focus();}
 function storages(kind){page('USB-Sticks werden gesucht …');var seq=epoch;
  try{fs().listStorages(function(all){if(!current()||seq!==epoch)return;page('USB-Stick auswählen:');all.filter(function(s){return s.type==='EXTERNAL'&&s.state==='MOUNTED';}).forEach(function(s){button(s.label,function(){browse(s.label,kind,[]);});});if(!actions.children.length)text.textContent='Kein USB-Stick gefunden. Stick anschließen und erneut suchen.';button('Erneut suchen',function(){storages(kind);});button('Zurück',menu);focus();},fail);}catch(e){fail(e);button('Zurück',menu);focus();}}
 function browse(path,kind,parents){page('Ordner wird gelesen …');var seq=epoch;
  try{fs().resolve(path,function(dir){if(!current()||seq!==epoch)return;dir.listFiles(function(files){if(!current()||seq!==epoch)return;page('Ordner: '+dir.name+' · WAV / MP3 auswählen');files=files.filter(function(f){return f.isDirectory||valid(f,kind);}).sort(function(a,b){return Number(b.isDirectory)-Number(a.isDirectory)||a.name.localeCompare(b.name);});
   files.slice(0,80).forEach(function(f){button((f.isDirectory?'Ordner: ':'')+f.name,function(){if(f.isDirectory)browse(f.fullPath,kind,parents.concat(path));else choose(f,kind,dir,path,parents);});});
   if(files.length>80)text.textContent+=' · Nur die ersten 80 Einträge; Sounds bitte in einen eigenen Ordner legen.';
   button('Zurück',function(){if(parents.length)browse(parents[parents.length-1],kind,parents.slice(0,-1));else storages(kind);});focus();},fail);},fail,'r');}catch(e){fail(e);}}
 function choose(file,kind,dir,path,parents){page(file.name+' · '+Math.ceil(file.fileSize/1024)+' KB');button('Vorschau (max. 5 Sekunden)',function(){stop();preview.src=file.toURI();preview.onerror=function(){fail(new Error('Audioformat kann nicht abgespielt werden.'));};try{var p=preview.play();if(p&&p.catch)p.catch(fail);timer=setTimeout(stop,5000);}catch(e){fail(e);}});
  button('Als '+(kind==='click'?'Klickton':'Introton')+' übernehmen',function(){page('Sound wird auf den Monitor kopiert …');var seq=epoch;
   try{fs().resolve('wgt-private',function(root){if(!current()||seq!==epoch)return;var folder;try{folder=root.resolve('deck-sounds');}catch(e){folder=root.createDirectory('deck-sounds');}
    var ext=file.name.split('.').pop().toLowerCase(),dest=folder.fullPath+'/'+kind+'.'+ext;
    dir.copyTo(file.fullPath,dest,true,function(){if(!current()||seq!==epoch)return;fs().resolve(dest,function(saved){try{localStorage.setItem('soundFile.'+kind,'wgt-private/deck-sounds/'+kind+'.'+ext);ui.set(kind,saved.toURI());menu();text.textContent='Sound übernommen. Der USB-Stick kann entfernt werden.';}catch(e){fail(e);}},fail,'r');},fail);
   },fail,'rw');}catch(e){fail(e);}});
  button('Zurück',function(){browse(path,kind,parents);});focus();}
 menu();
}
document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});
document.getElementById('dialog').addEventListener('close',stop);
window.DeckSounds={open:open,restore:restore,valid:valid};
})();
