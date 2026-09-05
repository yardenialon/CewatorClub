/* Event wiring, cross-tab sync and boot. Loaded last. */
const data=f=>Object.fromEntries(new FormData(f).entries());
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-action]');if(!target)return;const a=target.dataset.action,id=target.dataset.id;
 if(a==='close')closeModal();
 else if(a==='menu')$('#sidebar')?.classList.toggle('open');
 else if(a==='lang'){lang=lang==='he'?'en':'he';closeModal();render();}
 else if(a==='nav'){view='admin';page=target.dataset.page;closeModal();render();window.scrollTo(0,0);}
 else if(a==='mode'){view=target.dataset.view;closeModal();render();window.scrollTo(0,0);}
 else if(a==='market'){market=target.dataset.market;render();}
 else if(a==='newMission')newMission();
 else if(a==='missionDetail')missionDetail(id);
 else if(a==='creatorDetail')creatorDetail(id);
 else if(a==='approveCreator')act('creator.approve',{id});
 else if(a==='verifyMetrics'){if(confirm(t('manualOnly')+'\n\n'+t('verifyMetrics')+'?'))act('creator.verify',{id,confirmed:true});}
 else if(a==='offer')offerMission(id);
 else if(a==='work')workModal(id);
 else if(a==='apply'){view='apply';closeModal();render();window.scrollTo(0,0);}
 else if(a==='buildBrief'){const f=$('#mission-form'),l=f.elements.market.value==='US'?'en':'he';f.elements.brief.value=TRANSLATIONS[l].briefDefault;toast(t('briefGenerated'));}
 else if(a==='scroll-work')$('#my-work')?.scrollIntoView({behavior:'smooth',block:'start'});
 else if(a==='cancelWork'){if(confirm(t('cancelConfirm'))){const reason=prompt(t('cancelReason'),'Demo cancellation');if(reason)act('assignment.cancel',{id,reason});}}
 else if(a==='decline'){if(confirm(t('declineConfirm')))act('assignment.decline',{id});}
 else if(a==='export'){download('simpliigood-creator-club-backup-'+C.today()+'.json',safeJSON(state),'application/json');toast(t('exported'));}
 else if(a==='exportCsv')exportCsv();
 else if(a==='import')$('#import-file')?.click();
 else if(a==='reset'){if(confirm(t('resetConfirm'))){persist(C.createSeed());market='all';creatorId='c3';render();toast(t('saved'));}}
});
document.addEventListener('input',event=>{if(event.target.id==='creator-search'){search=event.target.value;$('#creator-table').innerHTML=creatorsTable();}if(event.target.closest('#offer-form')&&['production','distribution','rights'].includes(event.target.name))updateTotal();});
document.addEventListener('change',async event=>{
 if(event.target.id==='creator-picker'){creatorId=event.target.value;render();}
 if(event.target.closest('#offer-form')&&event.target.name==='creatorId')updateQuote();
 if(event.target.id==='import-file'){
  const file=event.target.files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error();const next=JSON.parse(await file.text());C.validateState(next);if(confirm(t('importConfirm'))){persist(next);render();toast(t('imported'));}}catch(_){toast(t('invalidBackup'),true);}finally{event.target.value='';}
 }
});
document.addEventListener('submit',event=>{
 const f=event.target;if(!(f instanceof HTMLFormElement))return;event.preventDefault();const p=data(f),id=f.dataset.id;
 if(f.id==='mission-form')act('mission.create',p);
 else if(f.id==='offer-form')act('assignment.offer',{...p,missionId:f.dataset.mission});
 else if(f.id==='accept-form')act('assignment.accept',{id,confirmed:f.elements.confirmed.checked});
 else if(f.id==='content-form')act('assignment.submit',{id,...p});
 else if(f.id==='publication-form')act('assignment.publish',{id,url:p.url});
 else if(f.id==='review-form')act('assignment.review',{id,decision:event.submitter?.value,feedback:p.feedback,checks:[0,1,2,3].map(i=>f.elements['check'+i].checked)});
 else if(f.id==='verify-form')act('assignment.verify',{id,confirmed:f.elements.confirmed.checked});
 else if(f.id==='payment-form')act('assignment.record',{id,reference:p.reference,confirmed:f.elements.confirmed.checked});
 else if(f.id==='rates-form'){const rates={};['IL','US'].forEach(m=>{rates[m]={production:{},distribution:[0,1,2,3,4].map(i=>p[m+'-d-'+i])};['reel','story','blog'].forEach(k=>rates[m].production[k]=p[m+'-p-'+k]);});act('settings.rates',{rates});}
 else if(f.id==='apply-form'){
  try{const next=C.dispatch(state,'creator.apply',{...p,consent:f.elements.consent.checked},{role:'public'});persist(next);view='admin';page='creators';market='all';render();toast(t('applicationSaved'));}catch(err){$('#application-errors').textContent=t(err.message);$('#application-errors').classList.remove('hide');}
 }
});
document.addEventListener('keydown',event=>{
 const modal=$('#modal-root .modal');if(!modal)return;if(event.key==='Escape'){closeModal();return;}
 if(event.key==='Tab'){const els=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')].filter(x=>x.offsetParent!==null),first=els[0],last=els.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
});
window.addEventListener('storage',event=>{if(event.key!==KEY||!event.newValue)return;try{const next=JSON.parse(event.newValue);C.validateState(next);state=next;closeModal();render();toast(t('stale'));}catch(_){toast(t('invalidBackup'),true);}});
window.ClubDemo={getState:()=>JSON.parse(JSON.stringify(state)),core:C};
render();if(loadError)toast(t(loadError),true);
