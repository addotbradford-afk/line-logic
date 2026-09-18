(function(){
'use strict';
const ROLE='lineLogicWizzPreviewRole',TOKEN='lineLogicWukMasterToken',AUTH='https://aavinfwtnbwforbkgrzh.supabase.co/auth/v1',KEY='sb_publishable_Ot5qtj32uOZWxY9Z4G6T2g_jXmXi2il',QUIZ='https://line-logic-pop-quiz.addotbradford.workers.dev';
const overlay=document.getElementById('accessOverlay'),userButton=document.getElementById('userAccessButton'),form=document.getElementById('masterLoginForm');
let role=null,masterToken=null;
function read(key){try{return sessionStorage.getItem(key)}catch{return null}}
function save(key,value){try{value?sessionStorage.setItem(key,value):sessionStorage.removeItem(key)}catch{}}
async function verify(token){const response=await fetch(QUIZ+'/api/wuk-master',{headers:{Authorization:'Bearer '+token}});if(!response.ok)throw new Error('Master account verification is unavailable.');return (await response.json()).master===true;}
function unlock(next,fresh){role=next;document.documentElement.dataset.lineLogicRole=next;document.body.classList.remove('access-locked');if(overlay)overlay.hidden=true;document.querySelector('.session-control')?.remove();
 const control=document.createElement('aside');control.className='session-control';control.setAttribute('aria-label','Current Line Logic access');const label=document.createElement('span');label.className='session-role';label.textContent=next==='admin'?'MASTER':'USER';control.append(label);
 if(next==='admin'){const link=document.createElement('a');link.className='session-master-link';link.textContent='Quiz Master';link.href=QUIZ+'/admin/sign-in#wuk_access_token='+encodeURIComponent(masterToken);control.append(link);}
 const out=document.createElement('button');out.className='session-sign-out';out.type='button';out.textContent='Sign out';out.onclick=async()=>{const token=masterToken;save(ROLE,null);save(TOKEN,null);if(token){try{await fetch(AUTH+'/logout',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token}})}catch{}}location.replace('./?login=1');};control.append(out);(document.querySelector('.site-session-slot')||document.body).append(control);
 requestAnimationFrame(()=>window.dispatchEvent(new CustomEvent('lineLogicAccessGranted',{detail:{freshLogin:fresh}})));
}
function show(){if(!overlay){location.replace('./?login=1');return}overlay.hidden=false;document.body.classList.add('access-locked');userButton.focus();}
window.LineLogicAccess=Object.freeze({getRole:()=>role,isAdmin:()=>role==='admin'});
if(userButton)userButton.onclick=()=>{save(ROLE,'user');save(TOKEN,null);masterToken=null;unlock('user',true);};
if(form)form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button'),message=document.getElementById('masterLoginMessage'),password=document.getElementById('masterPassword');button.disabled=true;message.textContent='Signing in…';try{
 const response=await fetch(AUTH+'/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('masterEmail').value.trim(),password:password.value})});password.value='';const data=await response.json();if(!response.ok||!data.access_token)throw new Error('Email or password was not recognised.');if(!await verify(data.access_token))throw new Error('This account does not have master access.');masterToken=data.access_token;save(TOKEN,masterToken);save(ROLE,'user');message.textContent='';unlock('admin',true);
 }catch(error){password.value='';message.textContent=error.message||'Unable to sign in.';}finally{button.disabled=false;}};
(async()=>{const token=read(TOKEN);if(token){try{if(await verify(token)){masterToken=token;unlock('admin',false);return}}catch{save(TOKEN,null);show();return}save(TOKEN,null);save(ROLE,null);}
 if(new URLSearchParams(location.search).get('login')==='1'){show();return;}if(read(ROLE)==='user'){unlock('user',false);return;}show();})();
})();
