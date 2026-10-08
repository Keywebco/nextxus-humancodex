/* Reading controls: remembered on this device. Large type by default, because the library is for everyone. */
(function(){
  var R=document.documentElement,K="nx_read";
  function get(){try{return JSON.parse(localStorage.getItem(K)||"{}");}catch(e){return {};}}
  function set(o){try{localStorage.setItem(K,JSON.stringify(o));}catch(e){}}
  function apply(){var o=get();R.style.fontSize=(o.size||20)+"px";R.setAttribute("data-theme",o.theme||"dark");}
  function bump(d){var o=get();o.size=Math.max(16,Math.min(34,(o.size||20)+d));set(o);apply();}
  function theme(t){var o=get();o.theme=t;set(o);apply();}
  document.getElementById("tup").addEventListener("click",function(){bump(2);});
  document.getElementById("tdown").addEventListener("click",function(){bump(-2);});
  document.getElementById("tdark").addEventListener("click",function(){theme("dark");});
  document.getElementById("tlight").addEventListener("click",function(){theme("light");});
  document.getElementById("thigh").addEventListener("click",function(){theme("high");});
  document.getElementById("tprint").addEventListener("click",function(){window.print();});
  apply();
})();
