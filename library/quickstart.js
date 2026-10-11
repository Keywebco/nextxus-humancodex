/* Quick-start: one tap to a period most people already know. Each button opens a real library entry (verified against list.json).
 * Free, no key, no tracking. Opens the entry through the page's own #NNNN link, so it touches nothing else. */
(function(){
  "use strict";
  var PICKS=[["The Battle of Hastings, 1066","1927"],["Columbus sails, 1492","2283"],["Pompeii and Vesuvius, 79 CE","1429"],["The Black Death, 1347","2114"],["Cleopatra, 51 BCE","1333"],["The Mongol storm, 1219","2004"],["The Titanic, 1912","3311"],["Pearl Harbor, 1941","3541"],["Around the Moon, 1968","3744"]];
  var host=document.getElementById("count");if(!host||!host.parentNode)return;
  var box=document.createElement("div");box.id="quickstart";box.className="card";box.style.margin="14px 0";
  var h=document.createElement("p");h.innerHTML="<b>Start somewhere you know.</b> Tap a moment in history:";box.appendChild(h);
  var row=document.createElement("div");row.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
  PICKS.forEach(function(p){
    var a=document.createElement("a");a.className="btn alt";a.href="#"+p[1];a.textContent=p[0];
    a.addEventListener("click",function(){setTimeout(function(){var el=document.getElementById("poem");if(el&&!el.hidden)el.scrollIntoView({behavior:"smooth",block:"start"});},250);});
    row.appendChild(a);
  });
  box.appendChild(row);
  host.parentNode.insertBefore(box,host);
})();
