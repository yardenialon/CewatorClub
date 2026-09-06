/* Local prototype business rules. No network requests or real payments. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClubCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const statuses = ['offered','accepted','submitted','changes','approved','published','payable','paid','cancelled'];
  const clone = x => JSON.parse(JSON.stringify(x));
  const fail = key => { throw new Error(key); };
  const uid = prefix => prefix + '-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const money = n => Math.round(Number(n) * 100) / 100;
  const currency = market => market === 'IL' ? 'ILS' : 'USD';
  const today = () => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const future = n => { const d = new Date(); d.setDate(d.getDate()+n); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  function text(v, max=2000, min=0) { if(typeof v!=='string'||v.trim().length<min) fail('required'); if(v.length>max) fail('charLimit'); return v.trim(); }
  function num(v, min=0, max=10000000) { if(v===''||v===null||v===undefined||typeof v==='boolean') fail('minPrice'); const n=Number(v); if(!Number.isFinite(n)||n<min||n>max) fail('minPrice'); return n; }
  function https(v) { try { const u=new URL(v); if(u.protocol!=='https:'||!u.hostname||u.username||u.password) fail('unsafeUrl'); return u.href; } catch(e){ fail('unsafeUrl'); } }
  const CODE=/^[A-Z0-9]{4,20}$/;
  const LINK_KEYS=['instagram','tiktok','youtube','facebook','website'];
  /* Audience interest taxonomy: what a creator's content is about and who a collaboration is for.
     Labels live in i18n.json as int_<id> / cluster_<id>. Order here is the display order. */
  const INTEREST_CLUSTERS=['health','nutrition','fitness','food','plant','performance','family','creators'];
  const INTERESTS=[
    ['healthy-lifestyle','health'],['wellness','health'],['morning-routine','health'],['habit-change','health'],['active-lifestyle','health'],
    ['healthy-nutrition','nutrition'],['balanced-nutrition','nutrition'],['dietitians','nutrition'],['clean-eating','nutrition'],['nutrition-reset','nutrition'],
    ['fitness','fitness'],['gym','fitness'],['running','fitness'],['yoga-pilates','fitness'],['sports-nutrition','fitness'],['recovery','fitness'],
    ['smoothies','food'],['smoothie-recipes','food'],['smoothie-bowls','food'],['healthy-recipes','food'],['healthy-breakfast','food'],['healthy-cooking','food'],
    ['superfood','plant'],['natural-food','plant'],['plant-based','plant'],['vegan-vegetarian','plant'],
    ['biohacking','performance'],['longevity','performance'],['performance-energy','performance'],
    ['healthy-parents','family'],['family-nutrition','family'],
    ['lifestyle-health','creators'],['foodies','creators'],['recipe-creators','creators'],['ugc-food-health','creators']
  ].map(([id,cluster])=>({id,cluster}));
  const INTEREST_IDS=new Set(INTERESTS.map(i=>i.id));
  const MAX_INTERESTS=8;
  /* Accepts an array (or a comma-separated string); returns a de-duplicated array of known ids. */
  function cleanInterests(raw){
    if(raw===undefined||raw===null||raw==='')return [];
    const list=Array.isArray(raw)?raw:String(raw).split(',');
    const out=[]; for(const v of list){ const id=String(v).trim(); if(!id)continue; if(!INTEREST_IDS.has(id))fail('invalidInterests'); if(!out.includes(id))out.push(id); }
    if(out.length>MAX_INTERESTS)fail('invalidInterests');
    return out;
  }
  /* Interests a creator and a mission share, in taxonomy order. */
  function interestMatch(creator,mission){ const a=new Set(creator?.interests||[]); return (mission?.interests||[]).filter(id=>a.has(id)); }
  function cleanLinks(raw){ const out={}; if(raw&&typeof raw==='object'&&!Array.isArray(raw)) for(const k of LINK_KEYS){ const v=raw[k]; if(v!==undefined&&v!==null&&String(v).trim()!=='') out[k]=https(String(v).trim()); } return out; }
  function affiliateConfig(s){ const a=s.affiliate||{}; return {pool:Number.isFinite(a.pool)?a.pool:20, creatorShare:Number.isFinite(a.creatorShare)?a.creatorShare:10}; }
  function promoCodeFor(s, creator, share){
    const base=(String(creator?.name||'').split(/[\s/]+/)[0].replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,8)||'CLUB');
    const taken=new Set(s.assignments.filter(a=>a.status!=='cancelled'&&a.affiliate).map(a=>a.affiliate.promoCode));
    const stem=base+Math.round(Number(share)||0);let code=stem,n=0;while(taken.has(code))code=stem+String.fromCharCode(65+(n++%26));
    return code;
  }
  function briefText(m, lang, translations) { return m.brief || translations[lang][m.briefKey || 'briefDefault']; }
  function titleText(m, lang, translations) { return m.titleKey ? translations[lang][m.titleKey] : m.title; }
  function quote(s, creatorId, missionId) {
    const c=s.creators.find(x=>x.id===creatorId), m=s.missions.find(x=>x.id===missionId);
    if(!c||!m) fail('required');
    const r=s.rates[m.market], tier=c.audience<5000?0:c.audience<20000?1:c.audience<50000?2:c.audience<100000?3:4;
    const multiplier=c.engagement<1?0.8:c.engagement<3?1:c.engagement<5?1.15:1.3;
    const manual=m.type==='blog'||['Blog','Newsletter'].includes(c.platform);
    const production=r.production[m.type], distribution=manual?0:Math.round(r.distribution[tier]*multiplier*(c.fit/100)/5)*5;
    return {production,distribution,rights:0,total:production+distribution,currency:currency(m.market),tier,multiplier,manual};
  }
  function allocation(s, missionId) { return money(s.assignments.filter(a=>a.missionId===missionId&&a.status!=='cancelled').reduce((v,a)=>v+a.fees.total,0)); }
  function missionCount(s,id) { return s.assignments.filter(a=>a.missionId===id&&a.status!=='cancelled').length; }
  function stats(s, market) {
    const ms=s.missions.filter(m=>m.market===market), ids=new Set(ms.map(m=>m.id));
    const as=s.assignments.filter(a=>ids.has(a.missionId)&&a.status!=='cancelled');
    const budget=money(ms.reduce((n,m)=>n+m.budget,0));
    const allocated=money(as.reduce((n,a)=>n+a.fees.total,0));
    const paid=as.filter(a=>a.status==='paid');
    const recordedFees=money(paid.reduce((n,a)=>n+a.fees.total,0));
    const commissions=money(paid.filter(a=>a.deal==='affiliate').reduce((n,a)=>n+(a.payment?.amount||0),0));
    const recorded=money(recordedFees+commissions);
    const payable=money(as.filter(a=>a.status==='payable').reduce((n,a)=>n+a.fees.total,0));
    const affiliateOpen=as.filter(a=>a.deal==='affiliate'&&a.status!=='paid').length;
    return {budget,allocated,recorded,recordedFees,commissions,affiliateOpen,payable,committed:money(allocated-recordedFees),available:money(budget-allocated),currency:currency(market)};
  }
  function createSeed() {
    const now=new Date().toISOString();
    const s={version:VERSION,revision:0,updatedAt:now,ratesVersion:1,affiliate:{pool:20,creatorShare:10},
      rates:{IL:{production:{reel:300,story:100,blog:400},distribution:[60,160,320,600,900]},US:{production:{reel:90,story:35,blog:110},distribution:[20,50,100,200,300]}},
      creators:[
        {id:'c1',name:'Noa Green / Demo',email:'noa@example.test',market:'IL',platform:'Instagram',audience:18400,engagement:4.8,fit:88,niche:'Smoothies & everyday food',url:'https://example.com/demo/noa',status:'active',metricsVerified:true,dealPreference:'fee',interests:['smoothies','smoothie-recipes','healthy-breakfast','healthy-lifestyle'],createdAt:now},
        {id:'c2',name:'Daniel Cooks / Demo',email:'daniel@example.test',market:'IL',platform:'Blog',audience:12000,engagement:3.2,fit:91,niche:'Recipes & simple cooking',url:'https://example.com/demo/daniel',status:'active',metricsVerified:true,dealPreference:'fee',interests:['healthy-recipes','healthy-cooking','foodies','recipe-creators'],createdAt:now},
        {id:'c3',name:'Maya Moves / Demo',email:'maya@example.test',market:'US',platform:'TikTok',audience:32600,engagement:5.2,fit:78,niche:'Food & active routines',url:'https://example.com/demo/maya',status:'active',metricsVerified:true,interests:['fitness','active-lifestyle','sports-nutrition','smoothies'],createdAt:now},
        {id:'c4',name:'Alex Eats / Demo',email:'alex@example.test',market:'US',platform:'Instagram',audience:24100,engagement:3.9,fit:84,niche:'Freezer finds & recipes',url:'https://example.com/demo/alex',status:'active',metricsVerified:true,interests:['healthy-recipes','plant-based','foodies'],createdAt:now},
        {id:'c5',name:'Lia Fresh / Demo',email:'lia@example.test',market:'IL',platform:'Instagram',audience:8700,engagement:6.1,fit:90,niche:'Family recipes',url:'https://example.com/demo/lia',status:'pending',metricsVerified:false,dealPreference:'either',interests:['family-nutrition','healthy-parents','healthy-breakfast'],createdAt:now},
        {id:'c6',name:'Sam Blends / Demo',email:'sam@example.test',market:'US',platform:'Newsletter',audience:6400,engagement:2.7,fit:72,niche:'Food newsletter',url:'https://example.com/demo/sam',status:'pending',metricsVerified:false,dealPreference:'affiliate',interests:['clean-eating','natural-food','superfood'],createdAt:now},
        {id:'c7',name:'Tal Bites / Demo',email:'tal@example.test',market:'IL',platform:'Instagram',audience:4200,engagement:7.4,fit:85,niche:'Snack ideas & lunchboxes',url:'https://example.com/demo/tal',status:'active',metricsVerified:true,dealPreference:'affiliate',interests:['family-nutrition','healthy-recipes','ugc-food-health'],createdAt:now}
      ],
      missions:[
        {id:'m1',titleKey:'seedMission1',market:'IL',type:'reel',objective:'dtc',budget:3500,capacity:6,deadline:future(21),briefKey:'briefDefault',cta:'Visit the approved product page',interests:['smoothies','healthy-breakfast','morning-routine'],createdAt:now},
        {id:'m2',titleKey:'seedMission2',market:'US',type:'reel',objective:'education',budget:1500,capacity:5,deadline:future(28),briefKey:'briefDefault',cta:'Discover how to use the cubes',interests:['fitness','sports-nutrition','recovery'],createdAt:now},
        {id:'m3',titleKey:'seedMission3',market:'IL',type:'blog',objective:'dtc',budget:2200,capacity:4,deadline:future(25),briefKey:'briefDefault',cta:'Explore the approved recipe',interests:['healthy-recipes','healthy-cooking','recipe-creators'],createdAt:now},
        {id:'m4',titleKey:'seedMission4',market:'US',type:'reel',objective:'retail',budget:1200,capacity:4,deadline:future(30),briefKey:'briefDefault',cta:'Use an approved store locator; confirm stock separately',interests:['plant-based','natural-food','foodies'],createdAt:now}
      ],assignments:[],activity:[]};
    function seedAssignment(id,cid,mid,status,manualDist) {
      const q=quote(s,cid,mid); if(manualDist!==undefined){q.distribution=manualDist;q.total=q.production+manualDist;}
      const fees={production:q.production,distribution:q.distribution,rights:0,total:q.total,currency:q.currency};
      const a={id,creatorId:cid,missionId:mid,status,fees,commission:0,rateVersion:1,rightsKey:'rightsNote',createdAt:now,updatedAt:now,revision:1,feedback:'',notes:'Demo content only.',contentUrl:'',publicationUrl:'',checks:[],history:[]};
      if(['accepted','submitted','approved','published','payable','paid'].includes(status)) a.acceptedAt=now;
      if(['submitted','approved','published','payable','paid'].includes(status)) a.contentUrl='https://example.com/demo/content/'+id;
      if(['approved','published','payable','paid'].includes(status)){a.approvedAt=now;a.checks=[true,true,true,true];}
      if(['published','payable','paid'].includes(status)){a.publicationUrl='https://example.com/demo/post/'+id;a.publishedAt=now;}
      s.assignments.push(a);
    }
    seedAssignment('a1','c1','m1','submitted'); seedAssignment('a2','c3','m2','offered');
    seedAssignment('a3','c2','m3','accepted',150); seedAssignment('a4','c4','m4','published');
    s.assignments.push({id:'a5',creatorId:'c7',missionId:'m1',status:'offered',deal:'affiliate',fees:{production:0,distribution:0,rights:0,total:0,currency:'ILS'},affiliate:{pool:20,creatorShare:10,audienceDiscount:10,productPackage:'Demo starter pack: 3 boxes of spirulina cubes',promoCode:'TAL10'},commission:0,rateVersion:1,rightsKey:'rightsNote',createdAt:now,updatedAt:now,revision:0,feedback:'',notes:'Demo content only.',contentUrl:'',publicationUrl:'',checks:[],history:[]});
    s.activity.push({id:uid('log'),at:now,action:'demoData',actor:'system',subject:'SimpliiGood Creator Club'});
    return s;
  }
  function validateState(s) {
    if(!s||s.version!==VERSION||!Array.isArray(s.creators)||!Array.isArray(s.missions)||!Array.isArray(s.assignments)||!Array.isArray(s.activity)) fail('invalidBackup');
    if(!Number.isInteger(s.revision)||s.revision<0||!Number.isInteger(s.ratesVersion)||s.ratesVersion<1)fail('invalidBackup');
    for(const log of s.activity){if(!log||typeof log.at!=='string'||typeof log.action!=='string'||typeof log.subject!=='string')fail('invalidBackup');}
    if(s.creators.length>5000||s.missions.length>5000||s.assignments.length>20000||s.activity.length>5000) fail('invalidBackup');
    { const af=affiliateConfig(s); num(af.pool,0,100); num(af.creatorShare,0,af.pool); }
    const ids=new Set(), mids=new Map(), cids=new Map();
    for(const m of ['IL','US']){
      if(!s.rates?.[m]?.production||s.rates[m].distribution?.length!==5) fail('invalidBackup');
      ['reel','story','blog'].forEach(k=>num(s.rates[m].production[k])); s.rates[m].distribution.forEach(v=>num(v));
    }
    for(const c of s.creators){
      if(typeof c.id!=='string'||ids.has(c.id)||!['IL','US'].includes(c.market)||!['active','pending','rejected'].includes(c.status)||!['Instagram','TikTok','YouTube','Facebook','Blog','Newsletter'].includes(c.platform)) fail('invalidBackup');
      text(c.name,120,1);text(c.email,254,3);text(c.niche,300);https(c.url);num(c.audience,0,1000000000);num(c.engagement,0,100);num(c.fit,0,100);if(typeof c.metricsVerified!=='boolean')fail('invalidBackup');
      if(c.rejectReason!==undefined)text(c.rejectReason,500);
      if(c.dealPreference!==undefined&&!['fee','affiliate','either'].includes(c.dealPreference))fail('invalidBackup');
      if(c.links!==undefined){if(!c.links||typeof c.links!=='object'||Array.isArray(c.links))fail('invalidBackup');for(const [k,v] of Object.entries(c.links)){if(!LINK_KEYS.includes(k))fail('invalidBackup');https(v);}}
      if(c.interests!==undefined){if(!Array.isArray(c.interests))fail('invalidBackup');try{cleanInterests(c.interests);}catch(_){fail('invalidBackup');}}
      ids.add(c.id);cids.set(c.id,c);
    }
    for(const m of s.missions){
      if(typeof m.id!=='string'||ids.has(m.id)||!['IL','US'].includes(m.market)||!['reel','story','blog'].includes(m.type)||!['dtc','retail','education'].includes(m.objective))fail('invalidBackup');
      if(m.titleKey&&!['seedMission1','seedMission2','seedMission3','seedMission4'].includes(m.titleKey))fail('invalidBackup');
      if(!m.titleKey)text(m.title,150,3); if(m.briefKey&&m.briefKey!=='briefDefault')fail('invalidBackup'); if(!m.briefKey)text(m.brief,5000,10);
      text(m.cta,300);num(m.budget,0);num(m.capacity,1,500);if(!Number.isInteger(m.capacity)||!/^\d{4}-\d{2}-\d{2}$/.test(m.deadline))fail('invalidBackup');
      if(m.archived!==undefined&&m.archived!==true)fail('invalidBackup');
      if(m.interests!==undefined){if(!Array.isArray(m.interests))fail('invalidBackup');try{cleanInterests(m.interests);}catch(_){fail('invalidBackup');}}
      ids.add(m.id);mids.set(m.id,m);
    }
    const pairs=new Set();
    for(const a of s.assignments){
      const m=mids.get(a.missionId),c=cids.get(a.creatorId);
      if(typeof a.id!=='string'||ids.has(a.id)||!m||!c||m.market!==c.market||!statuses.includes(a.status)||a.fees?.currency!==currency(m.market))fail('invalidBackup');
      ['production','distribution','rights','total'].forEach(k=>num(a.fees[k]));
      if(money(a.fees.production+a.fees.distribution+a.fees.rights)!==money(a.fees.total))fail('invalidBackup');
      if(!Array.isArray(a.history)||!Array.isArray(a.checks)||typeof a.notes!=='string'||typeof a.feedback!=='string'||!Number.isInteger(a.revision)||a.revision<0)fail('invalidBackup');
      text(a.notes,2000);text(a.feedback,2000);
      num(a.commission,0,100);if(a.contentUrl)https(a.contentUrl);if(a.publicationUrl)https(a.publicationUrl);
      if(a.deal!==undefined&&!['fee','affiliate'].includes(a.deal))fail('invalidBackup');
      if(a.deal==='affiliate'){
        const x=a.affiliate;if(!x||a.fees.total!==0)fail('invalidBackup');
        num(x.pool,0,100);num(x.creatorShare,0,x.pool);num(x.audienceDiscount,0,100);if(money(x.creatorShare+x.audienceDiscount)!==money(x.pool))fail('invalidBackup');
        text(x.productPackage,300,3);if(!CODE.test(String(x.promoCode)))fail('invalidBackup');
        if(a.status==='paid')num(a.payment?.salesTotal,0);
      } else if(a.affiliate!==undefined)fail('invalidBackup');
      if(['submitted','approved','published','payable','paid'].includes(a.status)&&!a.contentUrl)fail('invalidBackup');
      if(['approved','published','payable','paid'].includes(a.status)&&(!a.approvedAt||a.checks?.length!==4||!a.checks.every(v=>v===true)))fail('invalidBackup');
      if(['published','payable','paid'].includes(a.status)&&!a.publicationUrl)fail('invalidBackup');
      if(['payable','paid'].includes(a.status)&&!a.verifiedAt)fail('invalidBackup');
      if(a.status==='paid'&&(!a.payment?.reference||!a.payment.at))fail('invalidBackup');
      if(a.status!=='cancelled'){const key=a.missionId+'|'+a.creatorId;if(pairs.has(key))fail('invalidBackup');pairs.add(key);
        if(a.affiliate){const pk='promo|'+a.affiliate.promoCode;if(pairs.has(pk))fail('invalidBackup');pairs.add(pk);}}
      ids.add(a.id);
    }
    for(const m of s.missions){
      if(allocation(s,m.id)>m.budget+0.001||missionCount(s,m.id)>m.capacity) fail('invalidBackup');
      if(m.archived&&s.assignments.some(a=>a.missionId===m.id&&!['paid','cancelled'].includes(a.status))) fail('invalidBackup');
    }
    return true;
  }
  function dispatch(original, command, p, actor={role:'admin'}) {
    const s=clone(original), now=new Date().toISOString(); let subject='';
    const admin=()=>{if(actor.role!=='admin')fail('statusInvalid');};
    const work=()=>{const a=s.assignments.find(x=>x.id===p.id);if(!a)fail('statusInvalid');return a;};
    const creator=a=>{if(actor.role!=='creator'||actor.creatorId!==a.creatorId)fail('statusInvalid');};
    const stage=(a,allowed)=>{if(!allowed.includes(a.status))fail('statusInvalid');a.updatedAt=now;};
    if(command==='creator.apply'){
      if(!p.consent)fail('consentRequired');
      if(!['IL','US'].includes(p.market)||!['Instagram','TikTok','YouTube','Facebook','Blog','Newsletter'].includes(p.platform))fail('required');
      const email=text(p.email,254,3);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('required');
      const dealPreference=p.dealPreference||'either';if(!['fee','affiliate','either'].includes(dealPreference))fail('required');
      const links=cleanLinks(p.links);const primary={Instagram:'instagram',TikTok:'tiktok',YouTube:'youtube',Facebook:'facebook'}[p.platform]||'website';
      const url=p.url?https(p.url):(links[primary]||Object.values(links)[0]);if(!url)fail('unsafeUrl');
      const c={id:uid('c'),name:text(p.name,120,2),email,market:p.market,platform:p.platform,audience:num(p.audience,0,1000000000),engagement:num(p.engagement,0,100),fit:num(p.fit,0,100),niche:text(p.niche,300,2),url,...(Object.keys(links).length?{links}:{}),interests:cleanInterests(p.interests),dealPreference,status:'pending',metricsVerified:false,createdAt:now};
      if(!Number.isInteger(c.audience))fail('required');s.creators.push(c);subject=c.name;
    } else if(command==='creator.approve'||command==='creator.verify'||command==='creator.reject'){
      admin();const c=s.creators.find(x=>x.id===p.id);if(!c)fail('required');
      if(command==='creator.approve'){if(c.status!=='pending')fail('statusInvalid');c.status='active';delete c.rejectReason;delete c.rejectedAt;}
      else if(command==='creator.reject'){if(c.status!=='pending')fail('statusInvalid');c.rejectReason=text(p.reason,500,3);c.rejectedAt=now;c.status='rejected';}
      else{if(!p.confirmed)fail('consentRequired');c.metricsVerified=true;c.metricsCheckedAt=now;}
      subject=c.name;
    } else if(command==='mission.create'){
      admin(); if(!['IL','US'].includes(p.market)||!['reel','story','blog'].includes(p.type)||!['dtc','retail','education'].includes(p.objective))fail('required');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(p.deadline)||p.deadline<today())fail('dateInvalid');
      const m={id:uid('m'),title:text(p.title,150,3),market:p.market,type:p.type,objective:p.objective,budget:money(num(p.budget,0)),capacity:num(p.capacity,1,500),deadline:p.deadline,brief:text(p.brief,5000,10),cta:text(p.cta,300,2),interests:cleanInterests(p.interests),createdAt:now};
      if(!Number.isInteger(m.capacity))fail('budgetPositive');s.missions.push(m);subject=m.title;
    } else if(command==='mission.update'){
      admin();const m=s.missions.find(x=>x.id===p.id);if(!m)fail('required');if(m.archived)fail('missionArchived');
      if(!['reel','story','blog'].includes(p.type)||!['dtc','retail','education'].includes(p.objective))fail('required');
      const live=missionCount(s,m.id);
      if(p.type!==m.type&&live>0)fail('typeLocked');
      if(!/^\d{4}-\d{2}-\d{2}$/.test(p.deadline)||(p.deadline!==m.deadline&&p.deadline<today()))fail('dateInvalid');
      const budget=money(num(p.budget,0)),capacity=num(p.capacity,1,500);if(!Number.isInteger(capacity))fail('budgetPositive');
      if(budget<allocation(s,m.id)-0.001)fail('budgetBelowAllocated');if(capacity<live)fail('capacityBelowAssigned');
      Object.assign(m,{title:text(p.title,150,3),type:p.type,objective:p.objective,budget,capacity,deadline:p.deadline,brief:text(p.brief,5000,10),cta:text(p.cta,300,2),interests:cleanInterests(p.interests),updatedAt:now});
      delete m.titleKey;delete m.briefKey;subject=m.title;
    } else if(command==='mission.archive'||command==='mission.restore'){
      admin();const m=s.missions.find(x=>x.id===p.id);if(!m)fail('required');
      if(command==='mission.archive'){
        if(m.archived)fail('statusInvalid');
        if(s.assignments.some(a=>a.missionId===m.id&&!['paid','cancelled'].includes(a.status)))fail('missionHasOpenWork');
        m.archived=true;m.archivedAt=now;
      } else {if(!m.archived)fail('statusInvalid');delete m.archived;delete m.archivedAt;}
      subject=m.title||m.titleKey;
    } else if(command==='assignment.offer'){
      admin();const c=s.creators.find(x=>x.id===p.creatorId),m=s.missions.find(x=>x.id===p.missionId);
      if(!c||!m||c.status!=='active'||c.market!==m.market)fail('required');if(!c.metricsVerified)fail('unverifiedBlocked');
      if(m.archived)fail('missionArchived');if(m.deadline<today())fail('deadlinePassed');
      if(s.assignments.some(a=>a.creatorId===c.id&&a.missionId===m.id&&a.status!=='cancelled'))fail('duplicateAssignment');
      if(missionCount(s,m.id)>=m.capacity)fail('noSlots');
      const deal=p.deal==='affiliate'?'affiliate':'fee';let f,affiliate;
      if(deal==='affiliate'){
        const cfg=affiliateConfig(s),creatorShare=money(num(p.creatorShare===undefined||p.creatorShare===''?cfg.creatorShare:p.creatorShare,0,cfg.pool));
        const promoCode=String(p.promoCode||promoCodeFor(s,c,creatorShare)).trim().toUpperCase();if(!CODE.test(promoCode))fail('promoInvalid');
        if(s.assignments.some(a=>a.status!=='cancelled'&&a.affiliate?.promoCode===promoCode))fail('promoCodeTaken');
        affiliate={pool:cfg.pool,creatorShare,audienceDiscount:money(cfg.pool-creatorShare),productPackage:text(p.productPackage,300,3),promoCode};
        f={production:0,distribution:0,rights:0,total:0,currency:currency(m.market)};
      } else {
        f={production:money(num(p.production)),distribution:money(num(p.distribution)),rights:money(num(p.rights)),currency:currency(m.market)};f.total=money(f.production+f.distribution+f.rights);
        if(f.total<=0)fail('minPrice');if(f.total>m.budget-allocation(s,m.id)+0.001)fail('insufficientBudget');
      }
      const a={id:uid('a'),creatorId:c.id,missionId:m.id,status:'offered',deal,...(affiliate?{affiliate}:{}),fees:f,commission:num(p.commission||0,0,100),rateVersion:s.ratesVersion,rightsKey:'rightsNote',createdAt:now,updatedAt:now,revision:0,feedback:'',notes:'',contentUrl:'',publicationUrl:'',checks:[],history:[]};s.assignments.push(a);subject=c.name;
    } else if(command.startsWith('assignment.')){
      const a=work();subject=s.creators.find(c=>c.id===a.creatorId).name;
      if(command==='assignment.accept'){creator(a);stage(a,['offered']);if(s.missions.find(m=>m.id===a.missionId).deadline<today())fail('deadlinePassed');if(!p.confirmed)fail('consentRequired');a.status='accepted';a.acceptedAt=now;}
      else if(command==='assignment.decline'){creator(a);stage(a,['offered']);a.status='cancelled';a.cancelReason='Creator declined demo offer';}
      else if(command==='assignment.submit'){creator(a);stage(a,['accepted','changes']);a.contentUrl=https(p.url);a.notes=text(p.notes||'',2000);a.revision++;a.status='submitted';a.submittedAt=now;}
      else if(command==='assignment.review'){
        admin();stage(a,['submitted']);
        if(p.decision==='changes'){a.feedback=text(p.feedback,2000,3);a.status='changes';a.checks=[];}
        else if(p.decision==='approved'){if(p.checks?.length!==4||!p.checks.every(v=>v===true))fail('checksRequired');a.checks=[true,true,true,true];a.feedback=text(p.feedback||'',2000);a.status='approved';a.approvedAt=now;}
        else fail('statusInvalid');
        a.history.push({at:now,decision:p.decision,feedback:a.feedback});
      }
      else if(command==='assignment.publish'){creator(a);stage(a,['approved']);a.publicationUrl=https(p.url);a.publishedAt=now;a.status='published';}
      else if(command==='assignment.verify'){admin();stage(a,['published']);if(!p.confirmed)fail('consentRequired');a.verifiedAt=now;a.status='payable';}
      else if(command==='assignment.record'){admin();stage(a,['payable']);if(!p.confirmed)fail('consentRequired');
        a.payment={reference:text(p.reference,100,3),at:now,mode:'demo-manual-record',currency:a.fees.currency,amount:a.fees.total};
        if(a.deal==='affiliate'){const sales=money(num(p.salesTotal,0));a.payment.salesTotal=sales;a.payment.amount=money(sales*a.affiliate.creatorShare/100);}
        a.status='paid';}
      else if(command==='assignment.cancel'){admin();stage(a,['offered','accepted','submitted','changes','approved']);a.cancelReason=text(p.reason,500,3);a.status='cancelled';}
      else fail('statusInvalid');
    } else if(command==='settings.affiliate'){
      admin();const pool=money(num(p.pool,0,100)),creatorShare=money(num(p.creatorShare,0,pool));s.affiliate={pool,creatorShare};subject=pool+'% / '+creatorShare+'%';
    } else if(command==='settings.rates'){
      admin();for(const market of ['IL','US']){const r=p.rates?.[market];if(!r||r.distribution?.length!==5)fail('required');s.rates[market]={production:{},distribution:r.distribution.map(v=>money(num(v)))};['reel','story','blog'].forEach(k=>s.rates[market].production[k]=money(num(r.production[k])));}
      s.ratesVersion++;subject='v'+s.ratesVersion;
    }else fail('statusInvalid');
    s.revision++;s.updatedAt=now;s.activity.unshift({id:uid('log'),at:now,action:command,actor:actor.role,subject});s.activity=s.activity.slice(0,5000);validateState(s);return s;
  }
  return {VERSION,createSeed,validateState,dispatch,quote,allocation,missionCount,stats,currency,https,today,future,titleText,briefText,statuses,affiliateConfig,promoCodeFor,LINK_KEYS,INTERESTS,INTEREST_CLUSTERS,MAX_INTERESTS,cleanInterests,interestMatch};
});
