(function(){
"use strict";
const competencies=[["KNO","Knowledge"],["PRO","Application of Procedures"],["COM","Communication"],["FPA","Flight Path Management – Automation"],["FPM","Flight Path Management – Manual"],["LTW","Leadership & Teamwork"],["PSD","Problem Solving & Decision-Making"],["SAW","Situation Awareness"],["WLM","Workload Management"]];
const scenarios=Array.isArray(window.LINE_LOGIC_SCENARIOS)?window.LINE_LOGIC_SCENARIOS:[];
const q=document.getElementById("q"),focus=document.getElementById("focus"),menu=document.getElementById("menu"),summary=document.getElementById("summary"),results=document.getElementById("results"),count=document.getElementById("count"),chips=document.getElementById("chips"),clear=document.getElementById("clear"),modal=document.getElementById("modal"),modalCard=modal.querySelector(".modal-card"),modalContent=document.getElementById("modal-content");
let previousFocus=null;
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
const norm=value=>String(value??"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const dots=level=>`<div class="complexity"><span>Complexity</span>${[1,2,3].map(n=>`<span class="dot ${n<=level?"on":""}" aria-hidden="true"></span>`).join("")}<span class="sr-only">${level} out of 3</span></div>`;

[...new Set(scenarios.flatMap(s=>s.focus||[]))].sort().forEach(f=>{let o=document.createElement("option");o.value=f;o.textContent=f;focus.appendChild(o)});
competencies.forEach(([c,n])=>{let l=document.createElement("label");l.innerHTML=`<input type="checkbox" value="${c}"><span><b>${c}</b> — ${n}</span>`;menu.appendChild(l)});
const selected=()=>[...menu.querySelectorAll("input:checked")].map(x=>x.value);
const text=s=>norm([s.id,s.title,s.location,s.overview,s.safetyData,...(s.focus||[]),...(s.competencies||[]),...(s.keywords||[])].join(" "));

function render(){
 const terms=norm(q.value).split(" ").filter(Boolean),f=focus.value,cs=selected();
 const list=scenarios.filter(s=>terms.every(term=>text(s).includes(term))&&(!f||(s.focus||[]).includes(f))&&(!cs.length||cs.every(c=>(s.competencies||[]).includes(c))));
 count.textContent=`${list.length} scenario${list.length===1?"":"s"} found`;summary.textContent=cs.length?cs.join(" · ")+" ▾":"All competencies ▾";clear.classList.toggle("visible",Boolean(q.value||f||cs.length));
 chips.innerHTML="";[...(f?[f]:[]),...cs].forEach(x=>{let e=document.createElement("span");e.className="chip";e.textContent=x;chips.appendChild(e)});
 results.innerHTML=list.length?"":'<div class="empty">No Line Logic scenarios match those filters.</div>';
 list.forEach(s=>{let d=document.createElement("article");d.className="card";d.tabIndex=0;d.setAttribute("role","button");d.setAttribute("aria-label",`Preview ${s.id}: ${s.title}`);d.dataset.id=s.id;d.innerHTML=`<div class="id">${esc(s.id)}</div><div class="title">${esc(s.title)}</div><div class="loc">${esc(s.location||"")}</div>${dots(s.complexity)}<div class="tags">${(s.focus||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div><div class="tags comp" style="margin-top:7px">${(s.competencies||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div><span class="open">PREVIEW SCENARIO →</span>`;results.appendChild(d)});
}

function openModal(id){
 const s=scenarios.find(item=>item.id===id);if(!s)return;previousFocus=document.activeElement;
 const hasUrl=typeof s.url==="string"&&s.url.trim();
 const explore=hasUrl?`<a class="explore" href="${esc(s.url)}" target="_top">EXPLORE SCENARIO <span>→</span></a>`:`<button class="explore" type="button" disabled>EXPLORE SCENARIO <span class="pending">LINK COMING SOON</span></button>`;
 modalContent.innerHTML=`<div class="id">${esc(s.id)}</div><div class="title" id="modal-title">${esc(s.title)}</div><div class="loc">${esc(s.location||"")}</div>${dots(s.complexity)}<p class="modal-overview">${esc(s.overview||"")}</p><div class="section-label">OPERATIONAL FOCUS</div><div class="tags">${(s.focus||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div><div class="details-grid"><div><div class="section-label">PILOT COMPETENCIES</div><div class="tags comp">${(s.competencies||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div></div><div><div class="section-label">SAFETY DATA</div><div class="detail-value">${esc(s.safetyData||"Not specified")}</div></div></div>${explore}`;
 modal.hidden=false;document.body.classList.add("modal-open");modalCard.focus();
}
function closeModal(){if(modal.hidden)return;modal.hidden=true;document.body.classList.remove("modal-open");if(previousFocus)previousFocus.focus()}

q.oninput=render;focus.onchange=render;menu.onchange=render;
clear.onclick=()=>{q.value="";focus.value="";menu.querySelectorAll("input").forEach(x=>x.checked=false);render();q.focus()};
results.addEventListener("click",e=>{const card=e.target.closest(".card");if(card)openModal(card.dataset.id)});
results.addEventListener("keydown",e=>{const card=e.target.closest(".card");if(card&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openModal(card.dataset.id)}});
modal.addEventListener("click",e=>{if(e.target.closest("[data-close]"))closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
render();
})();
