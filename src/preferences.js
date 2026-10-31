/* Portable launcher preferences only: credentials, services and media files stay local. */
(function(root){'use strict';
var keys=['favorites','performanceProfile','still','menuSound','controllerProfile','inputNames','autoCloseApps'];
function valid(key,value){
 if(value===null)return true;if(typeof value!=='string'||value.length>8192)return false;
 if(['still','menuSound','autoCloseApps'].indexOf(key)>=0)return value==='true'||value==='false';
 if(key==='performanceProfile')return ['eco','balanced','quality','direct'].indexOf(value)>=0;
 if(key==='controllerProfile')return ['auto','standard','ps3-legacy'].indexOf(value)>=0;
 var parsed;try{parsed=JSON.parse(value);}catch(e){return false;}
 if(key==='favorites')return Array.isArray(parsed)&&parsed.length<=64&&parsed.every(function(id,i){return typeof id==='string'&&/^[A-Za-z0-9_.-]{1,128}$/.test(id)&&parsed.indexOf(id)===i;});
 if(key==='inputNames')return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&Object.keys(parsed).length<=32&&Object.keys(parsed).every(function(k){return /^[A-Z_]{1,32}:\d{1,3}$/.test(k)&&typeof parsed[k]==='string'&&parsed[k].length<=40;});
 return false;
}
function parse(text){
 if(typeof text!=='string'||text.length>65536)throw Error('Die Sicherung ist zu groß.');
 var data;try{data=JSON.parse(text);}catch(e){throw Error('Keine gültige JSON-Datei.');}
 if(!data||data.format!=='tizen-deck-preferences'||data.version!==1||!data.values||typeof data.values!=='object'||Array.isArray(data.values))throw Error('Unbekanntes Sicherungsformat.');
 var result={};Object.keys(data.values).forEach(function(k){if(keys.indexOf(k)<0||!valid(k,data.values[k]))throw Error('Ungültige Einstellung: '+k);result[k]=data.values[k];});
 if(!Object.keys(result).length)throw Error('Die Sicherung enthält keine Einstellungen.');return result;
}
function encode(storage){var values={};keys.forEach(function(k){var value=storage.getItem(k);if(!valid(k,value))throw Error('Lokale Einstellung ungültig: '+k);values[k]=value;});return JSON.stringify({format:'tizen-deck-preferences',version:1,created:new Date().toISOString(),values:values},null,2);}
function apply(storage,values){
 // Validate again at the write boundary. Restore every touched key if a write fails.
 values=parse(JSON.stringify({format:'tizen-deck-preferences',version:1,values:values}));var before={},touched=[];
 Object.keys(values).forEach(function(k){before[k]=storage.getItem(k);});
 try{Object.keys(values).forEach(function(k){touched.push(k);if(values[k]===null)storage.removeItem(k);else storage.setItem(k,values[k]);});}
 catch(e){var failed=false;touched.reverse().forEach(function(k){try{if(before[k]===null)storage.removeItem(k);else storage.setItem(k,before[k]);}catch(ignore){failed=true;}});throw Error(failed?'Speichern und Wiederherstellen fehlgeschlagen. Bitte Sicherung behalten.':'Speichern fehlgeschlagen; bisherige Einstellungen wiederhergestellt.');}
}
var api={parse:parse,encode:encode,apply:apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DeckPreferences=api;
})(this);
