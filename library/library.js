/* Living Library: browse and search 4,300 poems through history.
 * Runs entirely in your browser. The free allowance is counted on the Federation server per visitor (not on this page),
 * because a counter kept in the page is easy to reset. The raw YAML is always free to download, read and print. */
(function(){
  "use strict";
  function $(id){return document.getElementById(id);}
  function esc(t){var d=document.createElement("div");d.textContent=t==null?"":String(t);return d.innerHTML;}
  function fold(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
  var LIST=[],SEARCH=null,VOL={1:"Deep Time to the First Villages",2:"Bronze and Iron",3:"Faiths and the Medieval World",4:"Plague, Sail, and Reason",5:"Steam, Steel, and the Wars",6:"The Cold Peace to Tomorrow"};
  var PAGE=0,SIZE=20,CUR=[];
  var API="https://ring-of-12-api.onrender.com";

  async function jget(u){var r=await fetch(u);if(!r.ok)throw new Error("HTTP "+r.status);return r.json();}
  function hdr(){var h={"Content-Type":"application/json"};try{var o=localStorage.getItem("nx_owner_token");if(o)h["x-owner-token"]=o;}catch(e){}return h;}

  function row(e){
    return '<li class="poem-row"><a href="#'+e.n+'" data-n="'+e.n+'"><span class="pn">'+esc(e.n)+'</span><span class="pt">'+esc(e.t)+'</span><span class="pm">'+esc(e.d)+' | '+esc(e.r)+'</span></a><p>'+esc(e.x)+'</p></li>';
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
    var out=LIST.filter(function(e){return (!v||String(e.v)===v);});
    if(/^\d{1,4}$/.test(q)){var n=q.padStart(4,"0");out=out.filter(function(e){return e.n===n;});}
    else if(q){out=out.filter(function(e){return fold(e.t+" "+e.d+" "+e.r+" "+e.x).indexOf(q)>=0;});}
    show(out);
  }

  /* ----- one poem, fetched from the free YAML (no gate to read a poem you already found) ----- */
  async function openPoem(n){
    var e=LIST.filter(function(x){return x.n===n;})[0];if(!e)return;
    var box=$("poem");box.hidden=false;box.innerHTML='<p class="note">Opening '+esc(n)+'...</p>';
    try{
      var txt=await (await fetch("data/vol-"+e.v+".yaml")).text();
      var i=txt.indexOf('number: "'+n+'"');var j=txt.indexOf('\n  - number:',i+5);if(j<0)j=txt.length;
      var blk=txt.slice(i,j);
      var p=blk.indexOf("poem: |\n");var d=blk.indexOf("\n    description:");
      var poem=blk.slice(p+8,d).split("\n").map(function(l){return l.replace(/^      /,"");}).join("\n").trim();
      box.innerHTML='<h2 style="margin-top:0">'+esc(e.n)+' | '+esc(e.t)+'</h2><p class="pm">'+esc(e.d)+' | '+esc(e.r)+' | Volume '+e.v+': '+esc(VOL[e.v])+'</p><pre class="poemtext" data-readable>'+esc(poem)+'</pre><p><b>About this poem.</b> '+esc(e.x)+'</p><p class="note">This is a first draft. Every poem in the library is open to revision.</p><p><button class="btn alt" id="close" type="button">Close</button></p>';
      $("close").addEventListener("click",function(){box.hidden=true;history.replaceState(null,"","#");});
      box.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(err){box.innerHTML='<p class="note">Could not open that poem: '+esc(err.message)+'. The raw files are on the <a href="https://github.com/Keywebco/nextxus-humancodex/tree/main/library/data">free download page</a>.</p>';}
  }

  /* ----- full-text search across every line of every poem: the gated "inquiry" ----- */
  async function inquire(q){
    var st=$("gate");st.textContent="Checking your free inquiries...";
    var code=""; try{code=localStorage.getItem("nx_library_code")||"";}catch(e){}
    var r;
    try{
      r=await fetch(API+"/library/inquire",{method:"POST",headers:hdr(),body:JSON.stringify({code:code})});
    }catch(e){st.textContent="The inquiry service is not reachable right now. Browsing and opening poems still work, and the full YAML is free to download.";return null;}
    var b={};try{b=await r.json();}catch(e){}
    if(r.status===402){st.innerHTML='Your 3 free full-text inquiries are used. Enter a library code below to keep searching, or download the free YAML and search it yourself. Browsing by number, title, date and region stays free.';$("codebox").hidden=false;return null;}
    if(r.status===401){st.textContent=b.message||"That code was not accepted.";$("codebox").hidden=false;return null;}
    if(!r.ok){st.textContent=b.message||"The inquiry service had a problem. Try again in a moment.";return null;}
    st.textContent=b.unlimited?"Code accepted. Unlimited inquiries.":"Free inquiries left: "+b.remaining+" of "+b.limit+".";
    if(!SEARCH){try{SEARCH=await jget("data/search.json");}catch(e){st.textContent="Could not load the search data.";return null;}}
    var terms=fold(q).split(/\s+/).filter(Boolean);
    var hits=[];for(var i=0;i<SEARCH.length;i++){var s=SEARCH[i],ok=true;for(var k=0;k<terms.length;k++){if(s.indexOf(terms[k])<0){ok=false;break;}}if(ok)hits.push(LIST[i]);}
    return hits;
  }

  async function init(){
    try{LIST=await jget("data/list.json");}catch(e){$("list").innerHTML='<li class="note">The library list did not load. The raw YAML is still free to download below.</li>';return;}
    show(LIST);
    $("vol").addEventListener("change",filterBrowse);
    $("q").addEventListener("input",filterBrowse);
    $("prev").addEventListener("click",function(){PAGE--;draw();window.scrollTo({top:$("list").offsetTop-80,behavior:"smooth"});});
    $("next").addEventListener("click",function(){PAGE++;draw();window.scrollTo({top:$("list").offsetTop-80,behavior:"smooth"});});
    $("list").addEventListener("click",function(ev){var a=ev.target.closest("a[data-n]");if(a){ev.preventDefault();history.replaceState(null,"","#"+a.getAttribute("data-n"));openPoem(a.getAttribute("data-n"));}});
    $("sform").addEventListener("submit",async function(ev){
      ev.preventDefault();var q=$("fq").value.trim();if(!q)return;
      var b=$("sgo");b.disabled=true;var hits=await inquire(q);b.disabled=false;
      if(hits){$("q").value="";$("vol").value="";show(hits);$("count").textContent=hits.length+" poem"+(hits.length===1?"":"s")+" contain every word you typed.";window.scrollTo({top:$("list").offsetTop-80,behavior:"smooth"});}
    });
    $("csave").addEventListener("click",async function(){var c=$("code").value.trim();if(!c)return;try{localStorage.setItem("nx_library_code",c);}catch(e){}$("gate").textContent="Code saved on this device. Search again.";});
    $("cclear").addEventListener("click",function(){try{localStorage.removeItem("nx_library_code");}catch(e){}$("code").value="";$("gate").textContent="Code removed from this device.";});
    try{$("code").value=localStorage.getItem("nx_library_code")||"";}catch(e){}
    var m=/^#(\d{4})$/.exec(location.hash);if(m)openPoem(m[1]);
  }
  init();
})();
