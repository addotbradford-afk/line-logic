(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const dialog = $('#loginDialog'), form = $('#loginForm');
  const email = $('#username'), password = $('#password');
  const passwordLabel = $('label[for="password"]');
  const submit = form.querySelector('.submit');
  const message = $('#loginMessage');
  const links = $('.account-links');
  let mode = 'signin', session = null, busy = false;
  let recovery = new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery';
  const secure = location.protocol === 'https:';
  const client = secure && window.supabase ? window.supabase.createClient(
    'https://aavinfwtnbwforbkgrzh.supabase.co',
    'sb_publishable_Ot5qtj32uOZWxY9Z4G6T2g_jXmXi2il'
  ) : null;

  function render(next) {
    mode = next;
    message.textContent = '';
    password.value = '';
    const account = mode === 'account';
    const reset = mode === 'reset';
    const update = mode === 'update';
    $('#loginTitle').textContent = ({signin:'Welcome back',signup:'Create your account',reset:'Reset your password',update:'Choose a new password',account:'Your account'})[mode];
    $('.login-intro').textContent = ({signin:'Sign in to your Line Logic account.',signup:'Use your email address to create an account.',reset:'We’ll email you a password-reset link.',update:'Enter your new password below.',account:session?.user?.email || 'You are signed in.'})[mode];
    email.hidden = account || update;
    $('label[for="username"]').hidden = email.hidden;
    email.required = !email.hidden;
    password.hidden = reset || account;
    passwordLabel.hidden = password.hidden;
    password.required = !password.hidden;
    password.minLength = mode === 'signup' || update ? 8 : 1;
    password.autocomplete = mode === 'signup' || update ? 'new-password' : 'current-password';
    submit.textContent = ({signin:'Sign in',signup:'Create account',reset:'Send reset link',update:'Save password',account:'Open Wizz UK training'})[mode];
    links.hidden = account || update;
    $('#backToSignIn').hidden = mode === 'signin' || account || update;
    $('#signOut').hidden = !account;
    submit.disabled = !client || busy;
    email.disabled = !client;
    password.disabled = !client;
    if (!client) message.textContent = secure ? 'Account services are temporarily unavailable. Please try again later.' : 'Secure sign-in will be available once the website’s HTTPS connection is ready.';
  }
  function open(next) {
    render(next);
    if (!dialog.open) dialog.showModal();
  }
  $('#signIn').onclick = () => open(recovery ? 'update' : session ? 'account' : 'signin');
  $('#signUp').onclick = () => render('signup');
  $('#forgotPassword').onclick = () => render('reset');
  $('#backToSignIn').onclick = () => render('signin');
  dialog.addEventListener('close', () => {password.value = '';});
  $('#signOut').onclick = async () => {
    if (!client || busy) return;
    const {error} = await client.auth.signOut();
    if (error) {message.textContent = 'Could not sign out. Please try again.'; return;}
    session = null;
    recovery = false;
    $('#signIn span').textContent = 'Sign in';
    render('signin');
  };
  form.onsubmit = async event => {
    event.preventDefault();
    if (!client || busy) return;
    if (mode === 'account') {location.assign('/wizzuk/?home=1'); return;}
    busy = true;
    submit.disabled = true;
    message.textContent = 'Please wait…';
    const address = email.value.trim();
    const secret = password.value;
    try {
      if (mode === 'signin') {
        const {data,error} = await client.auth.signInWithPassword({email:address,password:secret});
        if (error) throw error;
        session = data.session;
        render('account');
      } else if (mode === 'signup') {
        const {data,error} = await client.auth.signUp({email:address,password:secret,options:{emailRedirectTo:'https://linelogic.uk/?home=1'}});
        if (error) throw error;
        if (data.session) {session = data.session; render('account');}
        else {message.textContent = 'Check your email for a confirmation link. Once confirmed, you can sign in.';}
      } else if (mode === 'reset') {
        const {error} = await client.auth.resetPasswordForEmail(address,{redirectTo:'https://linelogic.uk/?home=1'});
        if (error) throw error;
        message.textContent = 'If an account exists for that address, you’ll receive a password-reset email.';
      } else if (mode === 'update') {
        if (!recovery || !session) throw new Error('Recovery session required');
        const {error} = await client.auth.updateUser({password:secret});
        if (error) throw error;
        recovery = false;
        render('account');
        message.textContent = 'Your password has been updated.';
      }
    } catch (error) {
      message.textContent = error.code === 'invalid_credentials' ? 'Email or password not recognised.' : error.code === 'email_not_confirmed' ? 'Please confirm your email before signing in.' : error.code === 'weak_password' ? 'Please choose a stronger password.' : error.status === 429 ? 'Too many attempts. Please wait before trying again.' : 'We couldn’t complete that request. Please try again, or check your confirmation email.';
    } finally {
      password.value = '';
      busy = false;
      submit.disabled = !client;
    }
  };
  if (client) {
    client.auth.onAuthStateChange((event,current) => {
      session = current;
      $('#signIn span').textContent = current ? 'Account' : 'Sign in';
      if (event === 'PASSWORD_RECOVERY') {recovery = true; open('update');}
      else if (event === 'INITIAL_SESSION' && recovery && current) open('update');
    });
    client.auth.getSession().then(({data,error}) => {
      if (error) return;
      session = data.session;
      $('#signIn span').textContent = session ? 'Account' : 'Sign in';
      if (recovery && session) open('update');
    });
  }
  render('signin');
})();
