(function(){
'use strict';
const form=document.getElementById('masterLoginForm'),link=document.getElementById('forgotPassword');
if(!form||!link)return;
const email=document.getElementById('masterEmail'),password=document.getElementById('masterPassword'),message=document.getElementById('masterLoginMessage'),submit=form.querySelector('button[type="submit"]'),title=document.getElementById('accessTitle'),intro=document.querySelector('.access-intro');
const AUTH='https://aavinfwtnbwforbkgrzh.supabase.co/auth/v1',KEY='sb_publishable_Ot5qtj32uOZWxY9Z4G6T2g_jXmXi2il';
const params=new URLSearchParams(location.hash.slice(1));
let recoveryToken=params.get('type')==='recovery'?params.get('access_token'):null,mode='signin';
if(params.get('type')==='recovery'||params.get('error'))history.replaceState(null,'',location.pathname+'?login=1');
const confirmLabel=document.createElement('label');confirmLabel.htmlFor='confirmPassword';confirmLabel.textContent='Confirm password';
const confirm=document.createElement('input');confirm.id='confirmPassword';confirm.type='password';confirm.autocomplete='new-password';confirm.minLength=8;
form.insertBefore(confirmLabel,submit);form.insertBefore(confirm,submit);
function render(next){mode=next;password.value='';confirm.value='';message.textContent='';const reset=next==='reset',update=next==='update';email.hidden=update;email.required=!update;form.querySelector('label[for="masterEmail"]').hidden=update;password.hidden=reset;password.required=!reset;password.minLength=update?8:1;password.autocomplete=update?'new-password':'current-password';form.querySelector('label[for="masterPassword"]').hidden=reset;confirm.hidden=confirmLabel.hidden=!update;confirm.required=update;submit.textContent=reset?'Send reset link':update?'Save password':'Sign in';title.textContent=reset?'Reset your password':update?'Choose a new password':'Welcome';intro.textContent=reset?'Enter your account email and we’ll send you a reset link.':update?'Set a new password for your Line Logic account.':'Continue to your Wizz Air UK training.';link.textContent=next==='signin'?'Forgot password?':'Back to sign in';link.href=next==='signin'?'?login=1&reset=1':'?login=1';}
link.onclick=event=>{event.preventDefault();render(mode==='signin'?'reset':'signin');(mode==='reset'?email:password).focus();};
form.addEventListener('submit',async event=>{
 if(mode==='signin')return;
 event.preventDefault();event.stopImmediatePropagation();submit.disabled=true;
 try{
  if(mode==='reset'){
   const response=await fetch(AUTH+'/recover?redirect_to='+encodeURIComponent('https://linelogic.uk/?home=1'),{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:email.value.trim()})});
   if(!response.ok)throw new Error(response.status===429?'Please wait a moment before requesting another link.':'Unable to send the reset link. Please try again.');
   message.textContent='If an account exists for that email, you’ll receive a password-reset link.';
  }else{
   if(password.value!==confirm.value)throw new Error('The passwords do not match.');
   if(!recoveryToken)throw new Error('Please request a new password-reset link.');
   const response=await fetch(AUTH+'/user',{method:'PUT',headers:{apikey:KEY,Authorization:'Bearer '+recoveryToken,'Content-Type':'application/json'},body:JSON.stringify({password:password.value})});
   if(!response.ok)throw new Error(response.status===401||response.status===403?'This reset link has expired. Please request a new one.':'Unable to save this password. Please choose a stronger password or request a new link.');
   try{sessionStorage.removeItem('lineLogicWukMasterToken');sessionStorage.removeItem('lineLogicWizzPreviewRole');}catch{}
   recoveryToken=null;render('signin');message.textContent='Password updated. Sign in with your new password.';
  }
 }catch(error){message.textContent=error.message||'Unable to complete your request.';}finally{password.value='';confirm.value='';submit.disabled=false;}
},true);
render(recoveryToken?'update':new URLSearchParams(location.search).get('reset')==='1'?'reset':'signin');
if(params.get('error')){render('reset');message.textContent='This reset link has expired. Request a new one below.';}
})();
