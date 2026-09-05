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
  if(!ses||ses.mode!=='remote')return false;
  remote=ses;
  if(ses.authenticated){
    const r=await api('/api/state');state=r.state;
    if(ses.role==='creator'){view='creator';creatorId=ses.creatorId;}else if(view!=='apply')view='admin';
  } else if(view!=='apply')view='login';
  if(query.get('auth')==='invalid'){loginError='linkInvalid';history.replaceState(null,'',location.pathname);}
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
