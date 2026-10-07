(function(){
  "use strict";
  function $(id){return document.getElementById(id);}
  var NP=window.NXProviders;
  async function show(){
    var el=$("mstat");$("mlic").value=NP.getLicense();
    if(!NP.getLicense()){el.textContent="Not signed in.";return;}
    el.textContent="Checking with Gumroad...";
    var q=await NP.quota();
    if(!q){el.textContent="The member service is not reachable right now. Try again in a minute.";return;}
    if(!q.member||q.member.error){el.textContent=(q.member&&q.member.error)||"That license key was not recognized.";return;}
    el.textContent="Signed in. "+q.member.tier+". "+q.member.remaining+" of "+q.member.daily+" questions left today.";
  }
  $("msave").addEventListener("click",function(){NP.setLicense($("mlic").value);show();});
  $("mclear").addEventListener("click",function(){NP.setLicense("");$("mlic").value="";show();});
  show();
})();
