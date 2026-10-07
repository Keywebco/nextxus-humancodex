/* HumanCodex voice layer. Free, no key, no server: uses the browser's own speech tools.
 *  - Mic button beside every text box marked data-voice: speak instead of type.
 *  - "Read aloud" buttons: hear any result or page section.
 *  - "Read answers automatically" switch, remembered on this device.
 * Honest limits: speech-to-text works in Chrome, Edge and Safari; Firefox does not offer it. Text-to-speech works in
 * all major browsers. Voices differ by device. If a browser cannot do something, the button says so instead of failing. */
(function(){
  "use strict";
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  var synth=window.speechSynthesis;
  var AUTO="nx_voice_auto";
  function auto(){try{return localStorage.getItem(AUTO)==="1";}catch(e){return false;}}
  function setAuto(v){try{localStorage.setItem(AUTO,v?"1":"0");}catch(e){}}
  function say(text){
    if(!synth||!text)return false;
    try{synth.cancel();var t=String(text).replace(/\s+/g," ").trim().slice(0,3500);var u=new SpeechSynthesisUtterance(t);u.rate=0.95;u.lang=document.documentElement.lang||"en";synth.speak(u);return true;}catch(e){return false;}
  }
  function stop(){try{synth&&synth.cancel();}catch(e){}}
  function status(msg){var el=document.getElementById("nx-voice-status");if(el)el.textContent=msg;}

  function micFor(input){
    var b=document.createElement("button");b.type="button";b.className="btn alt nx-mic";b.setAttribute("aria-label","Speak instead of typing");b.textContent="\uD83C\uDF99 Speak";
    if(!SR){b.disabled=true;b.textContent="\uD83C\uDF99 Speak (not in this browser)";b.title="Speech input works in Chrome, Edge and Safari.";return b;}
    var rec=null,on=false;
    b.addEventListener("click",function(){
      if(on&&rec){rec.stop();return;}
      rec=new SR();rec.lang=document.documentElement.lang||"en-US";rec.interimResults=true;rec.maxAlternatives=1;
      rec.onstart=function(){on=true;b.textContent="\u23F9 Stop listening";status("Listening. Speak now.");};
      rec.onresult=function(e){var s="";for(var i=0;i<e.results.length;i++)s+=e.results[i][0].transcript;input.value=s;};
      rec.onerror=function(e){on=false;b.textContent="\uD83C\uDF99 Speak";status(e.error==="not-allowed"?"Microphone permission was blocked. Allow it in your browser, then try again.":"Voice input stopped: "+e.error+".");};
      rec.onend=function(){on=false;b.textContent="\uD83C\uDF99 Speak";status("Done listening. You can edit the text, then press the button.");
        if(input.getAttribute("data-voice")==="submit"&&input.value.trim()&&input.form){input.form.dispatchEvent(new Event("submit",{cancelable:true,bubbles:true}));}};
      try{rec.start();}catch(err){status("Could not start the microphone: "+err.message);}
    });
    return b;
  }

  function readBtn(getText,label){
    var b=document.createElement("button");b.type="button";b.className="btn alt nx-read";b.textContent=label||"\uD83D\uDD0A Read aloud";
    if(!synth){b.disabled=true;b.textContent="\uD83D\uDD0A Read aloud (not in this browser)";return b;}
    b.addEventListener("click",function(){
      if(synth.speaking){stop();b.textContent=label||"\uD83D\uDD0A Read aloud";return;}
      var t=typeof getText==="function"?getText():getText;
      if(say(t)){b.textContent="\u23F9 Stop reading";var u=setInterval(function(){if(!synth.speaking){clearInterval(u);b.textContent=label||"\uD83D\uDD0A Read aloud";}},400);}
    });
    return b;
  }

  function init(){
    /* voice bar at the top of the page */
    var bar=document.createElement("div");bar.className="nx-voicebar";bar.setAttribute("role","region");bar.setAttribute("aria-label","Voice controls");
    var label=document.createElement("label");label.style.cssText="display:inline-flex;gap:8px;align-items:center";
    var cb=document.createElement("input");cb.type="checkbox";cb.checked=auto();cb.addEventListener("change",function(){setAuto(cb.checked);if(!cb.checked)stop();});
    label.appendChild(cb);label.appendChild(document.createTextNode(" Read answers aloud automatically"));
    bar.appendChild(readBtn(function(){var m=document.getElementById("main")||document.body;return m.innerText||m.textContent||"";},"\uD83D\uDD0A Read this page"));
    bar.appendChild(label);
    var st=document.createElement("span");st.id="nx-voice-status";st.setAttribute("role","status");st.setAttribute("aria-live","polite");st.className="note";st.style.margin="0 0 0 8px";bar.appendChild(st);
    var main=document.getElementById("main");if(main)main.insertBefore(bar,main.firstChild);
    /* mic beside each marked input */
    document.querySelectorAll("input[data-voice]").forEach(function(inp){var m=micFor(inp);inp.parentNode.insertBefore(m,inp.nextSibling);});
    /* read-aloud on result blocks as they appear */
    var seen=new WeakSet();
    function decorate(root){
      root.querySelectorAll("[data-readable]").forEach(function(el){
        if(seen.has(el))return;seen.add(el);
        var holder=document.createElement("div");holder.style.margin="6px 0";holder.appendChild(readBtn(function(){return (el.innerText||el.textContent||"").replace(/Read aloud|Stop reading/g,"");}));
        el.parentNode.insertBefore(holder,el);
      });
    }
    var mo=new MutationObserver(function(){decorate(document);
      if(auto()){var el=document.querySelector("[data-readable]");if(el&&!el.__spoken){el.__spoken=1;say(el.innerText||el.textContent);}}});
    mo.observe(document.body,{childList:true,subtree:true});decorate(document);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.NXVoice={say:say,stop:stop,canListen:!!SR,canSpeak:!!synth};
})();
