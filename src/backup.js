(function(){'use strict';
var generation=0;
function open(ui){
 var dialog=document.getElementById('dialog'),actions=document.getElementById('dialog-actions'),text=document.getElementById('dialog-text');
 var current=++generation;
 ui.modal('Einstellungen sichern / laden','');
 function active(){return current===generation&&dialog.open&&document.getElementById('dialog-title').textContent==='Einstellungen sichern / laden';}
 function error(e){if(active())text.textContent='Nicht übernommen: '+(e.message||e.name||String(e));}
 function page(message){current=++generation;actions.textContent='';text.textContent=message;}
 function button(label,fn){var b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.appendChild(b);return b;}
 function focus(){if(actions.firstChild)actions.firstChild.focus();}
 function preview(raw){if(!active())return;var values;try{values=DeckPreferences.parse(raw);}catch(e){error(e);return;}
  page(Object.keys(values).length+' Launcher-Einstellungen geprüft. Favoriten, Darstellung, Menütöne, Controllerprofil, Eingangsnamen und App-Verhalten werden übernommen. Der Launcher lädt anschließend neu.');
  button('Übernehmen & Launcher neu laden',function(){try{DeckPreferences.apply(localStorage,values);location.reload();}catch(e){error(e);}});
  button('Abbrechen',menu);focus();
 }
 function read(file){
  if(!file.isFile||file.fileSize<=0||file.fileSize>65536){error(Error('Datei leer oder größer als 64 KB.'));return;}
  var ticket=generation;
  try{file.openStream('r',function(stream){var raw,failure=null;
   try{if(active()&&ticket===generation)raw=stream.read(stream.bytesAvailable);}catch(e){failure=e;}
   try{stream.close();}catch(e){failure=failure||e;}
   if(!active()||ticket!==generation)return;if(failure)error(failure);else preview(raw);
  },error,'UTF-8');}catch(e){error(e);}
 }
 function browse(path,parents){page('Sicherung auswählen …');var ticket=generation;
  try{tizen.filesystem.resolve(path,function(dir){if(!active()||ticket!==generation)return;try{dir.listFiles(function(files){if(!active()||ticket!==generation)return;
   page('Ordner: '+dir.name+' · Tizen-Deck-Sicherung (.json) auswählen');
   files.filter(function(f){return f.isDirectory||(/\.json$/i.test(f.name)&&f.fileSize<=65536);}).sort(function(a,b){return Number(b.isDirectory)-Number(a.isDirectory)||a.name.localeCompare(b.name);}).slice(0,80).forEach(function(f){button((f.isDirectory?'Ordner: ':'')+f.name,function(){if(f.isDirectory)browse(f.fullPath,parents.concat(path));else read(f);});});
   button('Zurück',function(){if(parents.length)browse(parents[parents.length-1],parents.slice(0,-1));else storages(false);});focus();
  },error);}catch(e){error(e);}},error,'r');}catch(e){error(e);}
 }
 function write(path){
  var raw;try{raw=DeckPreferences.encode(localStorage);}catch(e){error(e);return;}
  page('Sicherung wird geschrieben …');var ticket=generation;
  try{tizen.filesystem.resolve(path,function(dir){if(!active()||ticket!==generation)return;
   var name='tizen-deck-settings-'+Date.now()+'.json',file;try{file=dir.createFile(name);}catch(e){error(e);return;}
   try{file.openStream('w',function(stream){var failure=null;
    try{stream.write(raw);}catch(e){failure=e;}
    try{stream.close();}catch(e){failure=failure||e;}
    if(!active()||ticket!==generation)return;if(failure){error(failure);return;}
    text.textContent='Gespeichert: '+name;button('Fertig',menu).focus();
   },error,'UTF-8');}catch(e){error(e);}
  },error,'rw');}catch(e){error(e);}
 }
 function storages(exporting){page('USB-Sticks werden gesucht …');var ticket=generation;
  try{tizen.filesystem.listStorages(function(all){if(!active()||ticket!==generation)return;page('USB-Stick auswählen:');
   all.filter(function(s){return s.type==='EXTERNAL'&&s.state==='MOUNTED';}).forEach(function(s){button(s.label,function(){if(exporting)write(s.label);else browse(s.label,[]);});});
   if(!actions.children.length)text.textContent='Kein USB-Stick gefunden. Anschließen und erneut suchen.';
   button('Erneut suchen',function(){storages(exporting);});button('Zurück',menu);focus();
  },error);}catch(e){error(e);}
 }
 function download(){try{
  var url=URL.createObjectURL(new Blob([DeckPreferences.encode(localStorage)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='tizen-deck-settings.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);text.textContent='Download gestartet.';
 }catch(e){error(e);}}
 function choose(){Array.prototype.forEach.call(actions.querySelectorAll('input[type=file]'),function(old){old.remove();});var input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.hidden=true;input.style.display='none';actions.appendChild(input);var ticket=generation;
  input.onchange=function(){var file=input.files[0];input.remove();if(!file||!active()||ticket!==generation)return;if(file.size>65536){error(Error('Datei größer als 64 KB.'));return;}var reader=new FileReader();reader.onload=function(){if(active()&&ticket===generation)preview(reader.result);};reader.onerror=error;reader.readAsText(file);};input.click();
 }
 function menu(){page('Sichert Favoriten, Darstellung, Menütöne an/aus, Controllerprofil, Eingangsnamen und das Verhalten von Hintergrund-Apps. Zugangsdaten, Dienste, Timer und eigene Audiodateien sind nicht enthalten.');
  var tv=!!(window.tizen&&tizen.filesystem);
  button(tv?'Auf USB sichern':'Datei herunterladen',function(){if(tv)storages(true);else download();});
  button(tv?'Von USB laden':'Datei auswählen',function(){if(tv)storages(false);else choose();});focus();
 }
 menu();
}
window.DeckBackup={open:open};
})();
