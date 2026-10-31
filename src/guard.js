(function(){'use strict';var timer=null,flight=null,leaving=false;
function pulse(visible){var c=window.DECK_DEVICE;if(!c)return;if(flight){flight.abort();flight=null;}var x=new XMLHttpRequest();flight=x;x.open('POST',c.url+'/launcher/pulse',true);x.timeout=4000;x.setRequestHeader('X-Deck-Control',c.token);x.setRequestHeader('Content-Type','application/json');x.onload=x.onerror=x.ontimeout=function(){if(flight===x)flight=null;};x.send(JSON.stringify({visible:visible}));}
function tick(){timer=null;if(document.hidden||leaving)return;pulse(!!document.querySelector('.category.selected')&&!!document.querySelector('.item.selected'));timer=setTimeout(tick,10000);}
function sync(){if(timer!==null){clearTimeout(timer);timer=null;}leaving=false;if(document.hidden)pulse(false);else timer=setTimeout(tick,100);}
window.DeckGuard={leave:function(){leaving=true;if(timer!==null){clearTimeout(timer);timer=null;}pulse(false);},resume:sync};
document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',function(){DeckGuard.leave();});sync();
})();
