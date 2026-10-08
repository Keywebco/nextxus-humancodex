/* Astris, Keeper of the Galactic Record. Runs entirely in the browser from the library's own files.
 * No server, no AI model, no tracking: she searches the 4,300 entries and answers only from them.
 * She never invents history. If the library does not cover something, she says so. */
(function(){
  "use strict";
  function $(id){return document.getElementById(id);}
  function esc(t){var d=document.createElement("div");d.textContent=t==null?"":String(t);return d.innerHTML;}
  function fold(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
  var STOP="a an and are as at be but by do does for from has have how i in is it its me my of on or please show tell the them there these this to was were what when where which who why with about any find give some something poems poem entries entry era eras year years".split(" ");
  var LIST=null,SEARCH=null,ERA={};
  async function load(){
    if(LIST)return true;
    try{
      var r=await Promise.all([fetch("data/list.json"),fetch("data/search.json"),fetch("data/manifest.json")]);
      LIST=await r[0].json();SEARCH=await r[1].json();ERA=(await r[2].json()).eras||{};return true;
    }catch(e){return false;}
  }
  function terms(q){
    return fold(q).replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(function(w){return w&&STOP.indexOf(w)<0&&(w.length>1||/\d/.test(w));});
  }
  function score(i,ts,q){
    var e=LIST[i],head=fold(e.t+" "+e.r+" "+(ERA[e.e]||"")+" "+e.d),desc=fold(e.x),body=SEARCH[i]||"",s=0,hit=0;
    for(var k=0;k<ts.length;k++){
      var t=ts[k],h=false,re=new RegExp("(^|[^a-z0-9])"+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"s?([^a-z0-9]|$)");
      if(re.test(head)){s+=6;h=true;}
      if(re.test(desc)){s+=3;h=true;}
      if(body.indexOf(t)>=0){s+=1;h=true;}
      if(h)hit++;
    }
    if(!ts.length||hit===0)return 0;
    if(hit===ts.length)s+=4;
    return s;
  }
  function answer(q){
    var ts=terms(q);
    if(/^\s*(0\d{3}|\d{1,3}|#\d{1,4})\s*$/.test(q)){var n=q.trim().replace("#","").padStart(4,"0"),e=LIST.filter(function(x){return x.n===n;})[0];
      return e?{msg:"Entry "+esc(n)+" is here.",hits:[e]}:{msg:"I have no entry "+esc(n)+". The library runs from 0044 to 4343.",hits:[]};}
    if(!ts.length)return {msg:"Tell me a place, a time, a thing or a feeling, and I will look it up. Try: plague, Egypt, 1066, the first cities.",hits:[]};
    var sc=[];for(var i=0;i<LIST.length;i++){var s=score(i,ts,q);if(s>0)sc.push([s,i]);}
    sc.sort(function(a,b){return b[0]-a[0]||a[1]-b[1];});
    if(!sc.length)return {msg:"The library does not cover that yet. I would rather say so than guess. Try fewer words, a place, or a date. The Research center may have what you need.",hits:[]};
    var top=sc.slice(0,5).map(function(p){return LIST[p[1]];}),all=sc.map(function(p){return LIST[p[1]].n;});
    return {msg:"I found "+sc.length+" entr"+(sc.length===1?"y":"ies")+" that touch on that. The closest "+(top.length===1?"is":"are")+":",hits:top,all:all};
  }
  function render(a){
    var h='<p>'+a.msg+'</p>';
    if(a.hits.length){h+='<ul class="poem-list">'+a.hits.map(function(e){
      return '<li class="poem-row"><a href="#'+esc(e.n)+'"><span class="pn">'+esc(e.n)+'</span><span class="pt">'+esc(e.t)+'</span><span class="pm">'+esc(e.d)+' | '+esc(e.r)+' | '+esc(ERA[e.e]||"")+'</span></a><p>'+esc(e.x)+'</p></li>';}).join("")+'</ul>';}
    if(a.all&&a.all.length>a.hits.length)h+='<p><button class="btn alt" type="button" id="astall">Show all '+a.all.length+' in the list below</button></p>';
    h+='<p class="note">Astris answers only from the library own entries. These are creative poems, not a history textbook.</p>';
    $("astout").innerHTML=h;
    if($("astall"))$("astall").addEventListener("click",function(){if(window.LivingLibrary)window.LivingLibrary.show(a.all);window.scrollTo({top:$("list").offsetTop-80,behavior:"smooth"});});
  }
  async function ask(q){
    $("astout").innerHTML='<p class="note">Looking...</p>';
    if(!(await load())){$("astout").innerHTML='<p class="note">I could not open the library files just now. Browsing and the free downloads still work.</p>';return;}
    render(answer(q));
  }
  var f=$("astform");
  if(f)f.addEventListener("submit",function(ev){ev.preventDefault();var q=$("astq").value.trim();if(q)ask(q);});
})();
