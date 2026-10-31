const fs=require('fs'),vm=require('vm'),assert=require('assert');
function setup(){const requests=[],launched=[],notes=[],saved={},listeners={};
 const document={hidden:false,addEventListener:(k,fn)=>listeners[k]=fn};
 const window={DECK_DEVICE:{url:'http://127.0.0.1:8844',token:'test'}};
 const tizen={application:{launch:(id,ok)=>{launched.push(id);ok();}}};
 function XHR(){requests.push(this);this.open=(m,url)=>this.url=url;this.setRequestHeader=()=>{};this.send=body=>this.body=JSON.parse(body);}
 const ctx={window,document,tizen,localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v},XMLHttpRequest:XHR,setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../src/apps.js','utf8'),ctx);const api=window.DeckApps;api.init(s=>notes.push(s));
 function response(data,status=200){let r=requests.at(-1);r.status=status;r.responseText=JSON.stringify(data);r.onload();}
 return{api,requests,launched,notes,saved,response};}
let s=setup();assert(s.api.enabled());assert(s.api.launch({id:'kIciSQlYEM.plex'},()=>{},e=>{throw e;}));assert.equal(s.api.launch({id:'org.tizen.browser'},()=>{},()=>{}),false);assert.equal(s.requests.length,1);assert.equal(s.requests[0].body.keep,'kIciSQlYEM.plex');s.response({closed:[],failed:[]});assert.deepEqual(s.launched,['kIciSQlYEM.plex']);
s.api.setEnabled(false);s.api.launch({id:'org.tizen.browser'},()=>{},()=>{});assert.equal(s.requests.length,1);assert.equal(s.saved.autoCloseApps,'false');
s=setup();s.api.launch({id:'org.tizen.browser'},()=>{},()=>{});s.requests[0].onerror();assert.deepEqual(s.launched,['org.tizen.browser']);assert(s.notes[0].includes('Ohne App-Aufräumen'));s.requests[0].ontimeout();assert.equal(s.launched.length,1,'settled failure cannot launch twice');
s=setup();s.api.launch({id:'org.tizen.browser'},()=>{},()=>{});s.response({error:'focus changed'},400);assert(s.notes[0].includes('focus changed'));assert.equal(s.launched.length,1);
s=setup();s.api.clean(()=>{});s.api.launch({id:'org.tizen.browser'},()=>{},()=>{});assert.equal(s.requests.length,1);s.response({closed:[],failed:[]});assert.equal(s.launched.length,0,'return cleanup must not replace app preparation');assert.equal(s.requests.length,2);assert.equal(s.requests[1].body.keep,'org.tizen.browser');s.response({closed:[],failed:[]});assert.deepEqual(s.launched,['org.tizen.browser']);
console.log('App policy: enabled by default, serialized launches, opt-out, unavailable service and error fallback passed');
