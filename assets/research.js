/* HumanCodex Research Center. One search across free, keyless sources.
 * Every result is linked to its source and labeled with where it came from. Nothing is summarized by a model here:
 * this page only shows what the sources themselves say. If a source is down, the others still show. */
(function(){
  "use strict";
  function $(id){return document.getElementById(id);}
  function esc(t){var d=document.createElement("div");d.textContent=t==null?"":String(t);return d.innerHTML;}
  function strip(h){return String(h||"").replace(/<[^>]+>/g," ").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/&#039;/g,"'").replace(/\s+/g," ").trim();}
  async function jget(u){var r=await fetch(u);if(!r.ok)throw new Error("HTTP "+r.status);return r.json();}
  function card(tag,title,url,meta,text){return '<div class="src"><span class="tag">'+esc(tag)+'</span><a class="t" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(title)+'</a>'+(meta?'<div class="m">'+esc(meta)+'</div>':'')+(text?'<p>'+esc(text)+'</p>':'')+'</div>';}

  var SOURCES={
    wiki:{label:"Encyclopedia (Wikipedia)",run:async function(q){
      var s=await jget("https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="+encodeURIComponent(q)+"&srlimit=6&format=json&origin=*");
      return ((s.query&&s.query.search)||[]).map(function(x){return card("Encyclopedia",x.title,"https://en.wikipedia.org/wiki/"+encodeURIComponent(x.title.replace(/ /g,"_")),"Wikipedia",strip(x.snippet));});}},
    papers:{label:"Scientific papers (OpenAlex)",run:async function(q){
      var d=await jget("https://api.openalex.org/works?search="+encodeURIComponent(q)+"&per-page=6&select=title,id,publication_year,doi,primary_location,cited_by_count");
      return (d.results||[]).map(function(w){var u=w.doi||w.id;var src=w.primary_location&&w.primary_location.source&&w.primary_location.source.display_name;return card("Paper",w.title||"(untitled)",u,[w.publication_year,src,(w.cited_by_count||0)+" citations"].filter(Boolean).join(" | "),"");});}},
    crossref:{label:"Journal records (Crossref)",run:async function(q){
      var d=await jget("https://api.crossref.org/works?rows=5&select=title,URL,container-title,issued,abstract&query="+encodeURIComponent(q));
      return ((d.message&&d.message.items)||[]).filter(function(x){return x.title&&x.title[0];}).map(function(x){var y=x.issued&&x.issued["date-parts"]&&x.issued["date-parts"][0]&&x.issued["date-parts"][0][0];return card("Journal",x.title[0],x.URL,[y,x["container-title"]&&x["container-title"][0]].filter(Boolean).join(" | "),strip(x.abstract).slice(0,240));});}},
    archive:{label:"Books and records (Internet Archive)",run:async function(q){
      var d=await jget("https://archive.org/advancedsearch.php?q="+encodeURIComponent(q)+"&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=year&fl%5B%5D=creator&rows=6&output=json");
      return ((d.response&&d.response.docs)||[]).map(function(x){return card("Archive",x.title||x.identifier,"https://archive.org/details/"+encodeURIComponent(x.identifier),[x.year,Array.isArray(x.creator)?x.creator[0]:x.creator].filter(Boolean).join(" | "),"");});}},
    wikidata:{label:"Entities (Wikidata)",run:async function(q){
      var d=await jget("https://www.wikidata.org/w/api.php?action=wbsearchentities&search="+encodeURIComponent(q)+"&language=en&format=json&origin=*&limit=5");
      return (d.search||[]).map(function(x){return card("Entity",x.label||x.id,"https://www.wikidata.org/wiki/"+x.id,x.id,x.description||"");});}}
  };

  async function nasa(q){
    var d=await jget("https://images-api.nasa.gov/search?media_type=image&q="+encodeURIComponent(q));
    var items=((d.collection&&d.collection.items)||[]).slice(0,12).filter(function(i){return i.links&&i.links[0]&&i.data&&i.data[0];});
    return items.map(function(i){var da=i.data[0];return '<a href="https://images.nasa.gov/details/'+encodeURIComponent(da.nasa_id)+'" target="_blank" rel="noopener" title="'+esc(da.title)+'"><img loading="lazy" src="'+esc(i.links[0].href)+'" alt="'+esc(da.title)+'"></a>';});
  }

  async function search(q){
    var out=$("results");out.innerHTML='<p class="note" role="status">Searching six free sources for "'+esc(q)+'"...</p>';
    var keys=Object.keys(SOURCES);
    var jobs=keys.map(function(k){return SOURCES[k].run(q);}).concat([nasa(q)]);
    var res=await Promise.allSettled(jobs);
    var html='<div class="res-cols">',failed=[],total=0;
    keys.forEach(function(k,i){
      var r=res[i];
      if(r.status==="fulfilled"){total+=r.value.length;html+='<section><h2>'+esc(SOURCES[k].label)+'</h2>'+(r.value.length?r.value.join(""):'<p class="note">Nothing found here.</p>')+'</section>';}
      else failed.push(SOURCES[k].label);
    });
    html+='</div>';
    var im=res[keys.length];
    if(im.status==="fulfilled"&&im.value.length){total+=im.value.length;html+='<h2>Images (NASA)</h2><div class="gallery">'+im.value.join("")+'</div>';}
    else if(im.status==="rejected")failed.push("NASA images");
    if(failed.length)html+='<p class="note">These sources did not answer this time: '+esc(failed.join(", "))+'. The others are shown.</p>';
    html+='<p class="note">Everything above is what the sources themselves return, linked so you can read the original. We do not rewrite it, and a link here does not mean we agree with it. Want a verdict on a single claim? Use <a href="../ask/index.html">Ask</a>.</p>';
    out.innerHTML=(total?'<p class="note" role="status">'+total+' results from '+(keys.length+1-failed.length)+' sources.</p>':'')+html;
  }

  /* "On this day" in history, from Wikipedia */
  async function onThisDay(){
    var el=$("otd");if(!el)return;
    try{
      var d=new Date(),mm=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");
      var j=await jget("https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/"+mm+"/"+dd);
      var ev=(j.events||[]).filter(function(e){return e.year<1900;}).slice(0,6);
      if(!ev.length)ev=(j.events||[]).slice(0,6);
      el.innerHTML=ev.map(function(e){var p=e.pages&&e.pages[0];var u=p&&p.content_urls&&p.content_urls.desktop&&p.content_urls.desktop.page;return '<li><time>'+esc(e.year)+'</time>'+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(e.text)+'</a>':esc(e.text))+'</li>';}).join("");
    }catch(e){el.innerHTML='<li>Today in history is not reachable right now. Search above still works.</li>';}
  }

  var f=$("rform");
  if(f){f.addEventListener("submit",function(ev){ev.preventDefault();var q=$("rq").value.trim();if(q){history.replaceState(null,"","?q="+encodeURIComponent(q));search(q);}});
    var m=/[?&]q=([^&]+)/.exec(location.search);if(m){$("rq").value=decodeURIComponent(m[1]);search($("rq").value);}}
  onThisDay();
  document.querySelectorAll("[data-q]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();$("rq").value=a.getAttribute("data-q");$("rform").dispatchEvent(new Event("submit",{cancelable:true,bubbles:true}));});});
})();
