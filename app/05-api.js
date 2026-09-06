/* Remote mode: when index.html is served by server/index.js, state lives on the server
   and every command is posted to it. Opened as a file, none of this runs. */
async function api(path,opts={}){
  const r=await fetch(path,{credentials:'same-origin',headers:{'content-type':'application/json'},...opts});
  let j={};try{j=await r.json();}catch(_){}
  if(!r.ok)throw new Error(j.error||('http'+r.status));
  return j;
}
async function remoteBoot(){
  if(!/^https?:$/.test(location.protocol))return false;
  let ses;try{ses=await api('/api/session');}catch(_){return false;}
  if(ses&&ses.logo)serverLogo=true; // both serve.py and server/index.js say whether assets/logo.png exists
  if(!ses||ses.mode!=='remote')return false;
  remote=ses;
  if(ses.authenticated){
    const r=await api('/api/state');state=r.state;
    if(ses.role==='creator'){view='creator';creatorId=ses.creatorId;}else if(view!=='apply')view='admin';
  } else if(!['apply','login','landing'].includes(view))view='landing';
  if(query.get('auth')==='invalid'){loginError='linkInvalid';if(!ses.authenticated)view='login';history.replaceState(null,'',location.pathname);}
  return true;
}
function remoteAct(command,payload,handlers={}){
  api('/api/command',{method:'POST',body:JSON.stringify({command,payload})}).then(j=>{
    if(j.state)state=j.state;
    if(handlers.onSuccess)handlers.onSuccess(j);else{closeModal();render();toast(t(actionSuccess(command)));}
  }).catch(err=>{
    const msg=t(err.message)||err.message;
    if(handlers.onError)handlers.onError(msg);else modalError(msg);
    if(err.message==='signInRequired'){remote.authenticated=false;closeModal();view='login';render();}
  });
}
function requestLink(email){return api('/api/auth/request',{method:'POST',body:JSON.stringify({email})});}
function logout(){api('/api/auth/logout',{method:'POST'}).then(()=>{location.href='/';}).catch(()=>{location.href='/';});}

/* Brand assets. The logo is optional (assets/logo.png); until it exists every screen shows a wordmark. */
let serverLogo=false;
function probeLogo(){
  return new Promise(resolve=>{
    if(!LOGO_SRC||(!LOGO_SRC.startsWith('data:')&&!serverLogo))return resolve(false); // never request a file the server does not have
    const img=new Image();img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve(false);img.src=LOGO_SRC;
  }).then(ok=>{logoOk=ok;return ok;});
}
function loadFonts(){ // self-hosted Heebo; only when served over http(s) so the offline file stays request-free
  if(!/^https?:$/.test(location.protocol))return;
  const face=(file,range)=>"@font-face{font-family:'Heebo';font-style:normal;font-weight:100 900;font-display:swap;src:url(assets/fonts/"+file+") format('woff2');unicode-range:"+range+"}";
  const style=document.createElement('style');
  style.textContent=face('heebo-hebrew.woff2','U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F')+face('heebo-latin.woff2','U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD');
  document.head.appendChild(style);
}
