(function(){
  "use strict";
  function $(id){return document.getElementById(id);}
  function esc(t){var d=document.createElement("div");d.textContent=t==null?"":String(t);return d.innerHTML;}
  var NP=window.NXProviders;
  async function free(){
    var el=$("afree");if(NP.getLicense()){var q0=await NP.quota();el.textContent=q0&&q0.member?(q0.member.error||("Member: "+q0.member.tier+". "+q0.member.remaining+" of "+q0.member.daily+" questions left today.")):"";return;}
    if(NP.mine()){el.textContent="Using your own key. No limit from us.";return;}
    var q=await NP.quota();
    el.textContent=q&&q.owner?"Owner: unlimited.":q?(q.remaining>0?"Free checks left: "+q.remaining+" of "+q.freeLimit+".":"Your free checks are used. Add your own key below, or a subscriber license key."):"The free service is not reachable. Add your own key below.";
  }
  function render(t){
    var pct=t.percent==null?"--":t.percent+"%";
    var judged=t.supports+t.contradicts;
    var judge=t.scored?(NP.mine()?NP.PROVIDERS[NP.load().provider].label+" (your key)":"the Federation's free model"):"no judge (not scored)";
    var list=t.sources.map(function(x){var v=x.verdict||"";var c=v==="SUPPORTS"?"ok":v==="CONTRADICTS"?"bad":"";
      return '<div class="src"><span class="tag '+c+'">'+esc(v||"LISTED")+'</span><a class="t" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a><div class="m">'+esc(x.source)+'</div>'+(x.why?'<p>'+esc(x.why)+'</p>':'')+'</div>';}).join("");
    $("aout").innerHTML='<div class="card"><div class="pct">'+pct+'</div><p><b>'+esc(t.label)+'</b></p><p class="note">Within these parameters: sources searched = Wikipedia and Crossref scholarly papers; '+t.sources.length+' read, '+judged+' relevant; judged by '+esc(judge)+'; checked '+new Date().toISOString().slice(0,10)+'. Best match from the sources checked. Not proof.</p></div>'+list+(t.notes&&t.notes.length?'<p class="note">'+esc(t.notes.join("; "))+'</p>':'');
  }
  $("aform").addEventListener("submit",async function(ev){
    ev.preventDefault();var q=$("aq").value.trim();if(!q)return;
    var b=$("ago");b.disabled=true;b.textContent="Checking...";$("aout").innerHTML='<p class="note" role="status">Searching sources...</p>';
    var ask=async function(m,o){var r=await NP.ask(m,o);return r.text;};
    var t;
    try{t=await window.NXTruthCheck.check(q,ask);}
    catch(e){
      t=await window.NXTruthCheck.check(q,null);
      if(e.code==="need_key"){t.label="FREE CHECKS USED. Sources are listed but not judged. Add your own key below to score them.";}
      else if(e.code==="bad_license"||e.code==="member_daily"){t.label=e.message;}
      else{t.notes=(t.notes||[]).concat(["The judge failed: "+e.message]);}
    }
    render(t);b.disabled=false;b.textContent="Check it";free();
  });
  $("asave").addEventListener("click",function(){var k=$("akey").value.trim();if(!k)return;NP.save($("aprov").value,k,"");free();});
  $("aclear").addEventListener("click",function(){NP.clear();$("akey").value="";free();});
  var s=NP.load();if(s){$("aprov").value=s.provider;$("akey").value=s.key||"";}
  free();
})();
