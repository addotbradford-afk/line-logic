(function(){
'use strict';
const card=document.querySelector('.mode-card-guided'),plane=document.getElementById('guidedAircraft');
if(!card||!plane)return;
let frame;
function fly(){
 cancelAnimationFrame(frame);
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const start=performance.now(),first=Math.hypot(22,26),second=Math.hypot(16,12);
 function tick(now){
  const t=Math.min(1,(now-start)/450),distance=t*(first+second);
  let x,y,angle;
  if(distance<first){const p=distance/first;x=13+22*p;y=65-26*p;angle=40.2;}
  else{const p=(distance-first)/second;x=35+16*p;y=39-12*p;angle=53.1;}
  plane.setAttribute('transform',`translate(${x} ${y}) rotate(${angle})`);
  if(t<1)frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
}
card.addEventListener('pointerenter',fly);
card.addEventListener('focus',fly);
})();
