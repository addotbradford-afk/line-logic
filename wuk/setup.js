(async function(){
'use strict';
const AUTH='https://aavinfwtnbwforbkgrzh.supabase.co/auth/v1',KEY='sb_publishable_Ot5qtj32uOZWxY9Z4G6T2g_jXmXi2il',API='https://line-logic-pop-quiz.addotbradford.workers.dev/api/progress';
const message=document.getElementById('setupMessage'),form=document.getElementById('setupForm'),login=document.getElementById('setupLogin'),params=new URLSearchParams(location.hash.slice(1));
const query=new URLSearchParams(location.search),linkHash=query.get('token_hash'),linkType=query.get('type');
const recovery=params.get('type')==='recovery'||linkType==='recovery';
let token=params.get('access_token');history.replaceState(null,'',location.pathname);
async function request(url,options={}){const response=await fetch(url,{...options,headers:{...(url.startsWith(AUTH)?{apikey:KEY}:{}),Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});const data=await response.json();if(!response.ok)throw new Error(data.error||data.msg||data.message||'Unable to complete your request.');return data;}
async function openSetup(){try{
 if(!token)throw new Error('Open the setup link in your invitation email.');
 const user=await request(AUTH+'/user');if(!user.email_confirmed_at)throw new Error('Confirm your email before continuing.');
 const record=await request(API);if(record.master&&record.profile.setup_completed&&!recovery){token=null;message.textContent='Your email is verified. Your master account is ready—sign in with your existing password.';login.hidden=false;login.textContent='Sign in to WUK';return;}
 document.getElementById('setupEmail').value=user.email;document.getElementById('firstName').value=record.profile.first_name||user.user_metadata?.first_name||'';document.getElementById('surname').value=record.profile.surname||user.user_metadata?.surname||'';form.hidden=false;message.textContent='Your email has been verified. Complete your details and choose your password below.';document.querySelector('h1').textContent=recovery?'Set up your account.':'Welcome aboard.';
 form.onsubmit=async event=>{event.preventDefault();const password=document.getElementById('setupPassword'),confirm=document.getElementById('setupConfirm'),button=form.querySelector('button');button.disabled=true;message.textContent='Saving your account…';try{
  if(!document.getElementById('firstName').value.trim()||!document.getElementById('surname').value.trim())throw new Error('Enter your first name and surname.');
  if(password.value!==confirm.value)throw new Error('The passwords do not match.');
  const firstName=document.getElementById('firstName').value.trim(),surname=document.getElementById('surname').value.trim();
  await request(AUTH+'/user',{method:'PUT',body:JSON.stringify({password:password.value,data:{first_name:firstName,surname,full_name:firstName+' '+surname,initials:(firstName[0]+surname[0]).toUpperCase()}})});
  await request(API,{method:'PUT',body:JSON.stringify({firstName,surname})});
  sessionStorage.removeItem('lineLogicWukMasterToken');sessionStorage.removeItem('lineLogicWizzPreviewRole');token=null;form.hidden=true;message.textContent='Your account is ready. Sign in with your email and new password.';login.hidden=false;login.textContent='Sign in to WUK';
 }catch(error){message.textContent=error.message||'Unable to save your account.';}finally{password.value='';confirm.value='';button.disabled=false;}};
}catch(error){token=null;message.textContent=error.message||'Unable to verify your invitation.';login.hidden=false;document.getElementById('requestSetupForm').hidden=false;}}
if(linkHash&&['email','invite','recovery'].includes(linkType)){
 message.textContent='Checking your invitation…';
 try{
  const response=await fetch(AUTH+'/verify',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({token_hash:linkHash,type:linkType})});
  const result=await response.json();
  if(!response.ok||!result.access_token)throw new Error('This invitation has expired or has already been used. Request a new invitation below.');
  token=result.access_token;await openSetup();
 }catch(error){message.textContent=error.message||'Unable to verify your invitation.';document.getElementById('requestSetupForm').hidden=false;login.hidden=false;}
}else{await openSetup();}
const resend=document.getElementById('requestSetupForm');resend.onsubmit=async event=>{event.preventDefault();const button=resend.querySelector('button');button.disabled=true;try{const response=await fetch(AUTH+'/otp?redirect_to='+encodeURIComponent('https://linelogic.uk/?home=1'),{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('requestSetupEmail').value.trim(),create_user:false})});if(!response.ok)throw new Error('Unable to send a new link. Please wait a moment and try again.');message.textContent='Check your inbox for a fresh setup link. Use the newest email.';}catch(error){message.textContent=error.message;}finally{button.disabled=false;}};
})();
