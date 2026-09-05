/* Reusable UI building blocks: icons, form fields, modal, toast, command dispatch. */
const icons={
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5.7"/>',
 brief:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V3h8v3M3 12h18M10 11v3h4v-3"/>',
 check:'<path d="m5 12 4 4L19 6"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
 wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h18M16 12h5v5h-5a2.5 2.5 0 0 1 0-5Z"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="3" fill="currentColor" stroke="none"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 leaf:'<path d="M20 4c-12-2-18 5-14 12S22 17 20 4ZM5 21 16 9"/>',
 video:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m10 8 6 4-6 4Z"/>',
 book:'<path d="M12 5c-4-3-7-2-10-1v15c3-1 6-2 10 1 4-3 7-2 10-1V4c-3-1-6-2-10 1Zm0 0v15"/>',
 bag:'<path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
 x:'<path d="m6 6 12 12M6 18 18 6"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',
 external:'<path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
 sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>'
};
function icon(name){return '<svg class="icon '+(name==='arrow'?'arrow-icon':'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[name]||icons.leaf)+'</svg>';}
function btn(label,action,data='',cls=''){return '<button type="button" class="btn '+cls+'" data-action="'+action+'" '+data+'>'+e(t(label))+'</button>';}
function field(label,name,value='',type='text',opts=''){return '<div class="field"><label for="'+e(name)+'">'+e(t(label))+'</label><input id="'+e(name)+'" name="'+e(name)+'" type="'+type+'" value="'+e(value)+'" '+opts+'></div>';}
function select(label,name,choices,value){return '<div class="field"><label for="'+e(name)+'">'+e(t(label))+'</label><select id="'+e(name)+'" name="'+e(name)+'">'+choices.map(([v,l])=>'<option value="'+e(v)+'" '+(v===value?'selected':'')+'>'+e(l)+'</option>').join('')+'</select></div>';}
function checkbox(name,label){return '<label class="check"><input type="checkbox" name="'+e(name)+'"> <span>'+e(t(label))+'</span></label>';}
function link(url,label){try{url=C.https(url);}catch(_){return ''; }return '<a class="btn secondary sm" href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+icon('external')+e(t(label))+'</a>';}
const marketTabs=()=>'<div class="filter-tabs" aria-label="'+e(t('market'))+'">'+['all','IL','US'].map(m=>'<button class="'+(market===m?'active':'')+'" data-action="market" data-market="'+m+'">'+e(m==='all'?t('all'):marketName(m))+'</button>').join('')+'</div>';
const empty=()=>'<div class="empty">'+icon('leaf')+'<p style="margin-top:12px">'+e(t('noResults'))+'</p></div>';
function persist(next){try{localStorage.setItem(KEY,safeJSON(next));state=next;return true;}catch(_){state=next;toast(t('storageFailed'),true);return false;}}
function act(command,payload,actor){
  try{
    try{const raw=localStorage.getItem(KEY);if(raw){const latest=JSON.parse(raw);C.validateState(latest);if(latest.revision>state.revision)state=latest;}}catch(_){}
    const next=C.dispatch(state,command,payload,actor||{role:view==='creator'?'creator':'admin',creatorId});persist(next);closeModal();render();toast(t(actionSuccess(command)));return true;
  }catch(err){modalError(t(err.message)||err.message);return false;}
}
function actionSuccess(command){const m={'creator.apply':'applicationSaved','creator.approve':'applicantSaved','assignment.offer':'reserveSuccess','mission.create':'missionCreated','assignment.decline':'declined'};return m[command]||'saved';}
function actionLabel(command){return t({'creator.apply':'signup','creator.approve':'approveCreator','creator.verify':'verifyMetrics','mission.create':'newMission','assignment.offer':'offer','assignment.accept':'acceptOffer','assignment.decline':'decline','assignment.submit':'submitContent','assignment.review':'approval','assignment.publish':'publication','assignment.verify':'verifyPublication','assignment.record':'recordPayment','assignment.cancel':'cancelWork','settings.rates':'rates','demoData':'demoData'}[command]||command);}
function toast(message,error=false){const el=$('#toast');el.textContent=message;el.className='toast'+(error?' error':'');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.add('hide'),5000);}
function modalError(message){const target=$('#modal-errors');if(target){target.textContent=message;target.classList.remove('hide');target.scrollIntoView({block:'nearest'});}else toast(message,true);}
function openModal(heading,body,wide=false){
  modalReturnFocus=document.activeElement;
  $('#modal-root').innerHTML='<div class="modal-backdrop" data-overlay="true"><section class="modal '+(wide?'wide-modal':'')+'" role="dialog" aria-modal="true" aria-labelledby="modal-heading"><div class="modal-header"><h2 id="modal-heading">'+e(heading)+'</h2><button class="close-btn" data-action="close" aria-label="'+e(t('close'))+'">'+icon('x')+'</button></div><div class="modal-body"><div id="modal-errors" class="inline-error hide" role="alert"></div>'+body+'</div></section></div>';
  document.body.classList.add('modal-open');setTimeout(()=>$('#modal-root button, #modal-root input, #modal-root select')?.focus(),0);
}
function closeModal(){const had=!!$('#modal-root').innerHTML;$('#modal-root').innerHTML='';document.body.classList.remove('modal-open');if(had&&modalReturnFocus?.isConnected)modalReturnFocus.focus();}
