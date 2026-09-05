/* Shared UI state, preferences and locale-aware formatters. Loaded first. */
const APP_VERSION='0.2';
const C=ClubCore, F=ClubFormat, KEY='simpliigood.creatorclub.v1', PREF='simpliigood.creatorclub.prefs';
const $=sel=>document.querySelector(sel);
const e=F.escapeHtml;
const safeJSON=v=>JSON.stringify(v,null,2);
let loadError='', prefs={};
try{prefs=JSON.parse(localStorage.getItem(PREF)||'{}');}catch(_){}
let lang=prefs.lang==='en'?'en':'he', view='admin', page='dashboard', market='all', search='', creatorId='c3', modalReturnFocus=null;
const query=new URLSearchParams(location.search);if(query.get('lang')==='en')lang='en';if(query.get('view')==='creator')view='creator';if(query.get('view')==='apply')view='apply';
let showArchived=false;
let state;
try {const raw=localStorage.getItem(KEY);state=raw?JSON.parse(raw):C.createSeed();C.validateState(state);}catch(err){state=C.createSeed();loadError='invalidBackup';}
function t(k){return TRANSLATIONS[lang][k]||k;}
const title=m=>C.titleText(m,lang,TRANSLATIONS), brief=m=>C.briefText(m,lang,TRANSLATIONS);
const money=(v,cur)=>F.money(v,cur,lang);
const fm=(v,cur)=>'<bdi dir="ltr">'+e(money(v,cur))+'</bdi>';
const number=v=>F.number(v,lang);
const date=v=>e(F.date(v,lang));
const marketName=m=>t(m==='IL'?'israel':'usa');
const forMarket=m=>market==='all'||m===market;
const getMission=id=>state.missions.find(m=>m.id===id), getCreator=id=>state.creators.find(c=>c.id===id);
const statusPill=s=>'<span class="status '+e(s)+'">'+e(t(s))+'</span>';
const initials=F.initials;
const avatar=c=>'<span class="avatar '+(c.market==='IL'?'gold':'')+'">'+e(initials(c.name))+'</span>';
