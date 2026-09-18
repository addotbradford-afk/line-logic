(function(){
'use strict';
const landing=document.getElementById('landing'),frame=document.getElementById('wizzIntro'),skip=document.getElementById('skipWizzIntro');
let started=false,finished=false,fallback;
function finish(){if(finished||!started)return;finished=true;clearTimeout(fallback);document.body.classList.remove('wuk-intro-playing');const heading=document.querySelector('.home-header h1');if(landing.hidden){heading.setAttribute('tabindex','-1');heading.focus();return;}const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;landing.classList.add('is-leaving');setTimeout(function(){landing.hidden=true;frame.removeAttribute('src');heading.setAttribute('tabindex','-1');heading.focus();},reduce?0:650);}
function begin(event){if(started)return;started=true;if(!event.detail?.freshLogin){finish();return;}document.body.classList.add('wuk-intro-playing');landing.hidden=false;frame.src='wizz-intro.html';skip.focus();fallback=setTimeout(finish,10000);}
frame.addEventListener('load',function(){if(!started||finished)return;clearTimeout(fallback);fallback=setTimeout(finish,6600);});
window.addEventListener('lineLogicAccessGranted',begin);
window.addEventListener('message',function(e){if(e.source===frame.contentWindow&&e.data==='lineLogicIntroComplete')finish();});
skip.addEventListener('click',finish);
})();
