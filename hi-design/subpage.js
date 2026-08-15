(function(){
  var chrome=document.getElementById('siteChrome');
  var nav=document.getElementById('mainNav');
  var toggle=document.getElementById('navToggle');
  var label=toggle.querySelector('.menu-label');
  function close(){nav.classList.remove('is-open');document.body.classList.remove('nav-open');toggle.setAttribute('aria-expanded','false');label.textContent='菜单'}
  toggle.addEventListener('click',function(){var open=nav.classList.toggle('is-open');document.body.classList.toggle('nav-open',open);toggle.setAttribute('aria-expanded',String(open));label.textContent=open?'关闭':'菜单'});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  document.querySelectorAll('.nav-link').forEach(function(link){link.addEventListener('click',close)});
  function update(){chrome.classList.toggle('is-condensed',window.scrollY>80)}
  window.addEventListener('scroll',update,{passive:true});update();
})();
