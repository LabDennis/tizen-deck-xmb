/* Shared clock rendering, isolated from navigation. */
(function(){'use strict';
var dateFormat=new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit'});
var timeFormat=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'});
window.DeckClock={read:function(d){
 var minutes=d.getMinutes()+d.getSeconds()/60,date=dateFormat.format(d),time=timeFormat.format(d);
 return {hour:(d.getHours()%12)*30+minutes*.5,minute:minutes*6,date:date,time:time,text:date+'   '+time};
}};
})();
