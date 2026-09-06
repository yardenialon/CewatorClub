/* Creator application: a conversational, one-question-per-screen flow.
   Collects the same fields creator.apply needs, plus up to five social links. */
const WIZ_STEPS=['intro','name','email','market','links','platform','audience','engagement','niche','interests','fit','deal','consent'];
const WIZ_MAX_INTERESTS=6;
const WIZ_QUESTIONS=WIZ_STEPS.length-2; // intro and consent are not counted as questions
const LINK_META=[['instagram','instagram','linkInstagram','https://instagram.com/…'],['tiktok','tiktok','linkTiktok','https://tiktok.com/@…'],['youtube','youtube','linkYoutube','https://youtube.com/@…'],['facebook','facebook','linkFacebook','https://facebook.com/…'],['website','globe','linkWebsite','https://…']];
const wizChoice=(name,value,label,desc='')=>'<button type="button" class="wiz-choice '+(String(applyData[name])===String(value)?'active':'')+'" data-action="wizChoice" data-name="'+e(name)+'" data-value="'+e(value)+'">'+e(label)+(desc?'<small>'+e(desc)+'</small>':'')+'</button>';
const wizInput=(name,type,ph,opts='')=>'<input id="wiz-input" class="wiz-input" name="'+e(name)+'" type="'+type+'" value="'+e(applyData[name]??'')+'" placeholder="'+e(ph)+'" autocomplete="off" '+opts+'>';

function wizValidate(step){
 const d=applyData;
 const email=String(d.email||'').trim();
 switch(step){
  case 'name': return String(d.name||'').trim().length>=2?'':'wizErrName';
  case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?'':'wizErrEmail';
  case 'market': return ['IL','US'].includes(d.market)?'':'wizErrChoice';
  case 'links': { const links=d.links||{}; const filled=Object.values(links).filter(v=>String(v||'').trim()); if(!filled.length)return 'wizErrLinks'; try{filled.forEach(v=>C.https(String(v).trim()));}catch(_){return 'wizErrLinks';} return ''; }
  case 'platform': return d.platform?'':'wizErrChoice';
  case 'audience': { const n=Number(String(d.audience||'').replace(/[,\s]/g,'')); return Number.isInteger(n)&&n>=0&&String(d.audience||'').trim()!==''?'':'wizErrAudience'; }
  case 'engagement': return d.engagement!==undefined&&d.engagement!==''?'':'wizErrChoice';
  case 'niche': return String(d.niche||'').trim().length>=3?'':'wizErrNiche';
  case 'interests': return (d.interests||[]).length?'':'wizErrInterests';
  case 'fit': return d.fit!==undefined&&d.fit!==''?'':'wizErrChoice';
  case 'deal': return d.dealPreference?'':'wizErrChoice';
  case 'consent': return d.consent?'':'wizErrConsent';
  default: return '';
 }
}

function wizBody(step){
 const d=applyData, links=d.links||{};
 const nav=(hint=true)=>'<div class="wiz-nav"><button type="button" class="btn sun" data-action="wizNext">'+e(t('wizNext'))+icon('arrow')+'</button><button type="button" class="btn ghost" data-action="wizBack">'+e(t('wizBack'))+'</button>'+(hint?'<span class="wiz-hint">'+e(t('wizEnterHint'))+'</span>':'')+'</div>';
 const choicesNav='<div class="wiz-nav"><button type="button" class="btn ghost" data-action="wizBack">'+e(t('wizBack'))+'</button></div>';
 switch(step){
  case 'intro': return '<span class="wizard-step">SimpliiGood / Creator Club</span><h1>'+e(t('wizIntroTitle'))+'</h1><p class="sub">'+e(t('wizIntroSub'))+'</p><div class="wiz-perks"><div class="wiz-perk">'+icon('bag')+e(t('wizPerk1'))+'</div><div class="wiz-perk">'+icon('brief')+e(t('wizPerk2'))+'</div><div class="wiz-perk">'+icon('wallet')+e(t('wizPerk3'))+'</div></div><div class="wiz-nav"><button type="button" class="btn sun" data-action="wizNext">'+e(t('wizStart'))+icon('arrow')+'</button>'+(remote?'<button type="button" class="btn ghost" data-action="mode" data-view="login">'+e(t('loginTitle'))+'</button>':'<button type="button" class="btn ghost" data-action="mode" data-view="admin">'+e(t('backAdmin'))+'</button>')+'</div><p class="wiz-hint" style="margin-top:22px">'+e(t('consentToDemo'))+'</p>';
  case 'name': return '<h1>'+e(t('wizNameQ'))+'</h1><p class="sub">'+e(t('wizNameSub'))+'</p>'+wizInput('name','text',t('wizNamePh'),'maxlength="120"')+nav();
  case 'email': return '<h1>'+e(t('wizEmailQ'))+'</h1><p class="sub">'+e(t('wizEmailSub'))+'</p>'+wizInput('email','email','creator@example.test','maxlength="254" inputmode="email"')+nav();
  case 'market': return '<h1>'+e(t('wizMarketQ'))+'</h1><p class="sub">'+e(t('wizMarketSub'))+'</p><div class="wiz-choices">'+wizChoice('market','IL',t('israel'),'ILS')+wizChoice('market','US',t('usa'),'USD')+'</div>'+choicesNav;
  case 'links': return '<h1>'+e(t('wizLinksQ'))+'</h1><p class="sub">'+e(t('wizLinksSub'))+'</p><div class="wiz-links">'+LINK_META.map(([k,ic,label,ph],i)=>'<div class="wiz-link">'+icon(ic)+'<label for="wiz-link-'+k+'">'+e(t(label))+'</label><input id="wiz-link-'+k+'" '+(i===0?'data-first="1"':'')+' name="'+k+'" type="url" value="'+e(links[k]||'')+'" placeholder="'+e(ph)+'" autocomplete="off" maxlength="2000" data-wiz="links.'+k+'"></div>').join('')+'</div>'+nav();
  case 'platform': return '<h1>'+e(t('wizPlatformQ'))+'</h1><p class="sub">'+e(t('wizPlatformSub'))+'</p><div class="wiz-choices">'+['Instagram','TikTok','YouTube','Facebook','Blog','Newsletter'].map(p=>wizChoice('platform',p,p)).join('')+'</div>'+choicesNav;
  case 'audience': return '<h1>'+e(t('wizAudienceQ'))+'</h1><p class="sub">'+e(t('wizAudienceSub'))+'</p>'+wizInput('audience','text','12,000','inputmode="numeric" maxlength="12" dir="ltr"')+nav();
  case 'engagement': return '<h1>'+e(t('wizEngagementQ'))+'</h1><p class="sub">'+e(t('wizEngagementSub'))+'</p><div class="wiz-choices">'+wizChoice('engagement',0.5,t('wizEng1'))+wizChoice('engagement',2,t('wizEng2'))+wizChoice('engagement',4,t('wizEng3'))+wizChoice('engagement',6,t('wizEng4'))+wizChoice('engagement','unknown',t('wizEng0'))+'</div>'+choicesNav;
  case 'niche': return '<h1>'+e(t('wizNicheQ'))+'</h1><p class="sub">'+e(t('wizNicheSub'))+'</p>'+wizInput('niche','text',t('wizNichePh'),'maxlength="300"')+nav();
  case 'interests': { const sel=d.interests||[]; return '<h1>'+e(t('wizInterestsQ'))+'</h1><p class="sub">'+e(t('wizInterestsSub').replace('{max}',WIZ_MAX_INTERESTS))+'</p><div class="wiz-groups">'+C.INTEREST_CLUSTERS.map(cl=>'<div class="wiz-group"><span class="wiz-group-name">'+e(t('cluster_'+cl))+'</span><div class="wiz-chips">'+C.INTERESTS.filter(i=>i.cluster===cl).map(i=>'<button type="button" class="wiz-chip '+(sel.includes(i.id)?'active':'')+'" data-action="wizToggle" data-value="'+e(i.id)+'" aria-pressed="'+sel.includes(i.id)+'">'+e(t('int_'+i.id))+'</button>').join('')+'</div></div>').join('')+'</div><p class="wiz-hint" id="wiz-count">'+e(t('wizInterestsCount').replace('{n}',sel.length).replace('{max}',WIZ_MAX_INTERESTS))+'</p>'+nav(false); }
  case 'fit': return '<h1>'+e(t('wizFitQ'))+'</h1><p class="sub">'+e(t('wizFitSub'))+'</p><div class="wiz-choices">'+wizChoice('fit',95,t('wizFit1'))+wizChoice('fit',80,t('wizFit2'))+wizChoice('fit',60,t('wizFit3'))+wizChoice('fit',40,t('wizFit4'))+'</div>'+choicesNav;
  case 'deal': return '<h1>'+e(t('wizDealQ'))+'</h1><p class="sub">'+e(t('wizDealSub'))+'</p><div class="wiz-choices">'+wizChoice('dealPreference','fee',t('dealFee'),t('wizDealFeeD'))+wizChoice('dealPreference','affiliate',t('dealAffiliate'),t('wizDealAffD'))+wizChoice('dealPreference','either',t('dealEither'),t('wizDealEitherD'))+'</div>'+choicesNav;
  case 'consent': {
   const filledLinks=LINK_META.filter(([k])=>links[k]).map(([k,,label])=>t(label)).join(', ');
   const row=(k,v)=>'<div><span>'+e(t(k))+'</span><span><bdi>'+e(v)+'</bdi></span></div>';
   return '<h1>'+e(t('wizConsentQ'))+'</h1><p class="sub">'+e(t('wizConsentSub'))+'</p><form id="wiz-form"><div class="wiz-summary">'+row('wizSummaryName',d.name)+row('email',d.email)+row('market',t(d.market==='IL'?'israel':'usa'))+row('platform',d.platform)+row('followers',String(d.audience))+row('wizSummaryLinks',filledLinks)+row('niche',d.niche)+row('wizSummaryInterests',(d.interests||[]).map(id=>t('int_'+id)).join(', '))+row('dealPreference',t({fee:'dealFee',affiliate:'dealAffiliate',either:'dealEither'}[d.dealPreference]))+'</div><label class="check"><input type="checkbox" name="consent" data-wiz="consent" '+(d.consent?'checked':'')+'> <span>'+e(t('consent'))+'</span></label><div class="wiz-nav"><button type="submit" class="btn sun">'+e(t('wizSend'))+icon('arrow')+'</button><button type="button" class="btn ghost" data-action="wizBack">'+e(t('wizBack'))+'</button></div></form>';
  }
  default: return '';
 }
}

function renderApply(){
 document.documentElement.dir=lang==='he'?'rtl':'ltr';
 const step=WIZ_STEPS[applyStep], qIndex=applyStep; // intro = 0
 const progress=applyDone?100:Math.round((applyStep/(WIZ_STEPS.length-1))*100);
 const stepLabel=step==='intro'||step==='consent'||applyDone?'':'<span class="wizard-step">'+e(t('wizStepOf').replace('{n}',qIndex).replace('{total}',WIZ_QUESTIONS))+'</span>';
 const body=applyDone?'<div class="wiz-done">'+icon('heart')+'<h1>'+e(t('wizDoneTitle'))+'</h1><p class="sub">'+e(t('wizDoneSub'))+'</p><div class="wiz-nav"><button type="button" class="btn sun" id="wiz-done" data-action="wizDone">'+e(t('wizDoneAction'))+'</button></div></div>':stepLabel+wizBody(step)+(applyError?'<div class="wiz-error" role="alert">'+e(t(applyError))+'</div>':'');
 $('#app').innerHTML='<div class="wizard"><header class="wizard-top"><a class="pub-brand" href="#top" data-action="mode" data-view="landing">'+brandLogo('light')+'<span class="brand-sub">CREATOR CLUB</span></a><button class="lang-btn" data-action="lang" aria-label="Change language">'+(lang==='he'?'EN':'HE')+'</button><div class="wizard-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+progress+'"><span style="width:'+progress+'%"></span></div></header><div class="wizard-body"><div class="wizard-card" data-step="'+e(step)+'">'+body+'</div></div></div>';
 setTimeout(()=>($('#wiz-input')||$('[data-first="1"]'))?.focus(),0);
}

function wizCapture(){ // pull free-text values from the DOM before moving on
 const inp=$('#wiz-input'); if(inp) applyData[inp.name]=inp.value;
 document.querySelectorAll('[data-wiz]').forEach(el=>{const key=el.dataset.wiz; const val=el.type==='checkbox'?el.checked:el.value; if(key.startsWith('links.')){applyData.links=applyData.links||{};applyData.links[key.slice(6)]=val;}else applyData[key]=val;});
}
function wizNext(){
 wizCapture();
 const step=WIZ_STEPS[applyStep], err=wizValidate(step);
 if(err){applyError=err;render();return;}
 applyError='';
 if(applyStep<WIZ_STEPS.length-1){applyStep++;render();window.scrollTo(0,0);}
}
function wizBack(){wizCapture();applyError='';if(applyStep>0)applyStep--;render();}
function wizPick(name,value){const parsed=value==='unknown'?value:(isNaN(Number(value))||value===''?value:Number(value));applyData[name]=parsed;applyError='';if(applyStep<WIZ_STEPS.length-1)applyStep++;render();window.scrollTo(0,0);}
function wizToggle(id){ // multi-select chip: toggle in place, do not advance
 const sel=applyData.interests||[]; const i=sel.indexOf(id);
 if(i>=0)sel.splice(i,1); else if(sel.length<WIZ_MAX_INTERESTS)sel.push(id); else {applyError='';toast(t('wizInterestsCount').replace('{n}',sel.length).replace('{max}',WIZ_MAX_INTERESTS),true);return;}
 applyData.interests=sel; applyError='';
 const btn=document.querySelector('.wiz-chip[data-value="'+CSS.escape(id)+'"]'); if(btn){btn.classList.toggle('active',sel.includes(id));btn.setAttribute('aria-pressed',String(sel.includes(id)));}
 const count=$('#wiz-count'); if(count)count.textContent=t('wizInterestsCount').replace('{n}',sel.length).replace('{max}',WIZ_MAX_INTERESTS);
}
function wizReset(){applyStep=0;applyData={};applyError='';applyDone=false;}

function submitApplication(){
 wizCapture();
 const err=wizValidate('consent'); if(err){applyError=err;render();return;}
 const d=applyData;
 const links={}; for(const [k] of LINK_META){const v=String((d.links||{})[k]||'').trim(); if(v)links[k]=v;}
 const payload={name:String(d.name||'').trim(),email:String(d.email||'').trim(),market:d.market,platform:d.platform,audience:Number(String(d.audience).replace(/[,\s]/g,'')),engagement:d.engagement==='unknown'?2:Number(d.engagement),fit:Number(d.fit),niche:String(d.niche||'').trim(),links,interests:d.interests||[],dealPreference:d.dealPreference,consent:!!d.consent};
 const done=()=>{applyDone=true;applyError='';render();window.scrollTo(0,0);};
 const showError=msg=>{applyError=msg;render();};
 if(remote){remoteAct('creator.apply',payload,{onSuccess:done,onError:showError});return;}
 try{const next=C.dispatch(state,'creator.apply',payload,{role:'public'});persist(next);done();}catch(e2){showError(e2.message);}
}
