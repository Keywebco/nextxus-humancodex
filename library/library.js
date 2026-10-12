/* Living Library: browse and search 4,300 poems through history.
 * Browsing and searching run entirely in your browser from the files on this site: free, no key, no server. The raw YAML is always free to download, read and print.
 * If a data file fails to load, the page retries and then shows a plain message with a try-again button. */
(function(){
  "use strict";
  function $(id){return document.getElementById(id);}
  function esc(t){var d=document.createElement("div");d.textContent=t==null?"":String(t);return d.innerHTML;}
  function fold(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
  var ERA={"01a":"Deep Time (early)","01b":"Deep Time (later)","02":"First Villages","03a":"Bronze Age (early)","03b":"Bronze Age (later)","04a":"Iron Age (early)","04b":"Iron Age (later)","05":"Classical World","06":"Empires of Faith","07a":"Medieval World (early)","07b":"Medieval World (later)","08a":"Plague and Rebirth (early)","08b":"Plague and Rebirth (later)","09a":"Sail and Gunpowder (early)","09b":"Sail and Gunpowder (later)","10a":"Reason and Revolution (early)","10b":"Reason and Revolution (later)","11a":"Steam and Steel (early)","11b":"Steam and Steel (later)","12":"The Wars","13":"The Cold Peace","14":"The Digital Beyond"};
  var LIST=[],SEARCH=null,VOL={1:"Deep Time to the First Villages",2:"Bronze and Iron",3:"Faiths and the Medieval World",4:"Plague, Sail, and Reason",5:"Steam, Steel, and the Wars",6:"The Cold Peace to Tomorrow"};
  var PAGE=0,SIZE=20,CUR=[];

  async function jget(u){var last;for(var i=0;i<3;i++){try{var r=await fetch(u);if(!r.ok)throw new Error("HTTP "+r.status);return await r.json();}catch(e){last=e;await new Promise(function(ok){setTimeout(ok,1200*(i+1));});}}throw last;}

  function row(e){
    return '<li class="poem-row"><a href="#'+e.n+'" data-n="'+e.n+'"><span class="pn">'+esc(e.n)+'</span><span class="pt">'+esc(e.t)+'</span><span class="pm">'+esc(e.d)+' | '+esc(e.r)+' | '+esc(ERA[e.e]||"")+'</span></a><p>'+esc(e.x)+'</p></li>';
  }
  function show(list){
    CUR=list;PAGE=0;draw();
  }
  function draw(){
    var from=PAGE*SIZE,part=CUR.slice(from,from+SIZE);
    $("count").textContent=CUR.length+" poem"+(CUR.length===1?"":"s")+" shown. Page "+(PAGE+1)+" of "+Math.max(1,Math.ceil(CUR.length/SIZE))+".";
    $("list").innerHTML=part.length?part.map(row).join(""):'<li class="note">Nothing matches that. Try fewer words, or a number like 0044.</li>';
    $("prev").disabled=PAGE===0;$("next").disabled=from+SIZE>=CUR.length;
  }
  function filterBrowse(){
    var v=$("vol").value,q=fold($("q").value).trim();
    var er=$("era").value;var out=LIST.filter(function(e){return (!v||String(e.v)===v)&&(!er||e.e===er);});
    if(/^\d{1,4}$/.test(q)){var n=q.padStart(4,"0");out=out.filter(function(e){return e.n===n;});}
    else if(q){out=out.filter(function(e){return fold(e.t+" "+e.d+" "+e.r+" "+e.x+" "+(ERA[e.e]||"")).indexOf(q)>=0;});}
    show(out);
  }

  /* ----- one poem, fetched from the free YAML (no gate to read a poem you already found) ----- */
  async function openPoem(n){
    var e=LIST.filter(function(x){return x.n===n;})[0];if(!e)return;
    var box=$("poem");box.hidden=false;box.innerHTML='<p class="note">Opening '+esc(n)+'...</p>';
    try{
      var REV=null;try{REV=await jget("data/revised.json");}catch(x){REV=null;}
      var rv=REV&&REV[n];var head='<h2 style="margin-top:0">'+esc(e.n)+' | '+esc(e.t)+'</h2><p class="pm">'+esc(e.d)+' | '+esc(e.r)+' | '+esc(ERA[e.e]||"")+' | Volume '+e.v+': '+esc(VOL[e.v])+'</p>';
      var foot='<p class="note">Entry '+esc(e.n)+' keeps this number and this place. The text may be improved over time. Keep a copy of the version you first read.</p><p><button class="btn alt" id="close" type="button">Close</button></p>';
      if(rv){
        box.innerHTML=head+'<div data-readable><p>'+esc(rv.event)+'</p><p>'+esc(rv.announce)+'</p><pre class="poemtext">'+esc(rv.piece)+'</pre></div>'+foot;
      }else{
        var txt=await (await fetch("data/vol-"+e.v+".yaml")).text();
        var i=txt.indexOf('number: "'+n+'"');var j=txt.indexOf('\n  - number:',i+5);if(j<0)j=txt.length;
        var blk=txt.slice(i,j);
        var p=blk.indexOf("poem: |\n");var d=blk.indexOf("\n    description:");
        var poem=blk.slice(p+8,d).split("\n").map(function(l){return l.replace(/^      /,"");}).join("\n").trim();
        box.innerHTML=head+'<pre class="poemtext" data-readable>'+esc(poem)+'</pre><p><b>About this poem.</b> '+esc(e.x)+'</p>'+foot;
      }
      $("close").addEventListener("click",function(){box.hidden=true;history.replaceState(null,"","#");});
      box.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(err){box.innerHTML='<p class="note">Could not open that poem: '+esc(err.message)+'. The raw files are on the <a href="https://github.com/Keywebco/nextxus-humancodex/tree/main/library/data">free download page</a>.</p>';}
  }

  /* ----- full-text search across every line of every poem. Free and unlimited: it runs in your browser from the files on this site,
   * so it keeps working with no server, no key and nobody tending it. (The old server gate is dormant in the ring-of-12-api repo.) ----- */
  async function inquire(q){
    var st=$("gate");st.textContent="Searching...";
    if(!SEARCH){try{SEARCH=await jget("data/search.json");}catch(e){st.textContent="The poem search could not load just now, so nothing was searched. Please check your connection and try again. The full YAML is free to download below.";$("list").innerHTML="";$("count").textContent="Search did not run.";return null;}}
    var terms=fold(q).split(/\s+/).filter(Boolean);
    var hits=[];for(var i=0;i<SEARCH.length;i++){var s=SEARCH[i],ok=true;for(var k=0;k<terms.length;k++){if(s.indexOf(terms[k])<0){ok=false;break;}}if(ok)hits.push(LIST[i]);}
    st.textContent="";
    return hits;
  }

  async function init(){
    try{LIST=await jget("data/list.json");}catch(e){$("count").textContent="The library did not load.";$("list").innerHTML='<li class="note">The library list did not load, usually a slow or dropped connection. <button class="btn" type="button" id="retry">Tap here to try again</button> The raw YAML is still free to download below.</li>';var rb=$("retry");if(rb)rb.addEventListener("click",function(){location.reload();});return;}
    show(LIST);
    $("vol").addEventListener("change",filterBrowse);$("era").addEventListener("change",filterBrowse);
    $("q").addEventListener("input",filterBrowse);
    $("prev").addEventListener("click",function(){PAGE--;draw();window.scrollTo({top:$("list").offsetTop-80,behavior:"smooth"});});
    $("next").addEventListener("click",function(){PAGE++;draw();window.scrollTo({top:$("list").offsetTop-80,behavior:"smooth"});});
    $("list").addEventListener("click",function(ev){var a=ev.target.closest("a[data-n]");if(a){ev.preventDefault();history.replaceState(null,"","#"+a.getAttribute("data-n"));openPoem(a.getAttribute("data-n"));}});
    $("sform").addEventListener("submit",async function(ev){
      ev.preventDefault();var q=$("fq").value.trim();if(!q)return;
      var b=$("sgo");b.disabled=true;var hits=await inquire(q);b.disabled=false;
      if(hits){$("q").value="";$("vol").value="";$("era").value="";show(hits);$("count").textContent=hits.length+" poem"+(hits.length===1?"":"s")+" contain every word you typed.";window.scrollTo({top:$("list").offsetTop-80,behavior:"smooth"});}
    });
    var m=/^#(\d{4})$/.exec(location.hash);if(m)openPoem(m[1]);
  }
  window.addEventListener("hashchange",function(){var m=/^#(\d{4})$/.exec(location.hash);if(m)openPoem(m[1]);});
  window.LivingLibrary={show:function(ns){var s={};ns.forEach(function(n){s[n]=1;});show(LIST.filter(function(e){return s[e.n];}));$("count").textContent=ns.length+" entries from Astris.";}};
  init();
})();
