(function(){
const API='https://line-logic-pop-quiz.addotbradford.workers.dev/api/progress';
document.addEventListener('click',event=>{const link=event.target.closest('a.explore[data-scenario-id]');if(!link)return;const token=sessionStorage.getItem('lineLogicWukMasterToken');if(!token)return;const body={kind:'scenario',scenarioId:link.dataset.scenarioId,eventId:crypto.randomUUID()};void fetch(API,{method:'POST',keepalive:true,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(()=>{});});
})();
