(async function(){
'use strict';
const AUTH='https://aavinfwtnbwforbkgrzh.supabase.co/auth/v1',KEY='sb_publishable_Ot5qtj32uOZWxY9Z4G6T2g_jXmXi2il',API='https://line-logic-pop-quiz.addotbradford.workers.dev/api/progress';
const message=document.getElementById('setupMessage'),form=document.getElementById('setupForm'),login=document.getElementById('setupLogin'),params=new URLSearchParams(location.hash.slice(1));
let token=params.get('access_token');history.replaceState(null,'',location.pathname);
async function request(url,options={}){const response=await fetch(url,{...options,headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',...options.headers}});const data=await response.json();if(!response.ok)throw new Error(data.error||data.msg||data.message||'Unable to complete your request.');return data;}
try{
 if(!token)throw new Error('Open the setup link in your invitation email.');
 const user=await request(AUTH+'/user');if(!user.email_confirmed_at)throw new Error('Confirm your email before continuing.');
 await request(API);
 document.getElementById('setupEmail').value=user.email;document.getElementById('firstName').value=user.user_metadata?.first_name||'';document.getElementById('surname').value=user.user_metadata?.surname||'';form.hidden=false;message.textContent='Your email has been verified.';
 form.onsubmit=async event=>{event.preventDefault();const password=document.getElementById('setupPassword'),confirm=document.getElementById('setupConfirm'),button=form.querySelector('button');button.disabled=true;message.textContent='Saving your account…';try{
  if(password.value!==confirm.value)throw new Error('The passwords do not match.');
  const firstName=document.getElementById('firstName').value.trim(),surname=document.getElementById('surname').value.trim();
  await request(API,{method:'PUT',body:JSON.stringify({firstName,surname})});
  await request(AUTH+'/user',{method:'PUT',body:JSON.stringify({password:password.value,data:{first_name:firstName,surname,full_name:firstName+' '+surname,initials:(firstName[0]+surname[0]).toUpperCase()}})});
  sessionStorage.removeItem('lineLogicWukMasterToken');sessionStorage.removeItem('lineLogicWizzPreviewRole');token=null;form.hidden=true;message.textContent='Your account is ready. Sign in with your email and new password.';login.hidden=false;login.textContent='Sign in to WUK';
 }catch(error){message.textContent=error.message||'Unable to save your account.';}finally{password.value='';confirm.value='';button.disabled=false;}};
}catch(error){token=null;message.textContent=error.message||'Unable to verify your invitation.';login.hidden=false;}
})();
