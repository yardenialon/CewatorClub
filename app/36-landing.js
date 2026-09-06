/* Public landing page: the first screen a prospective creator meets (remote mode, signed out).
   One promise, one action. Every claim on it is backed by a rule in core.js. */
function renderLanding(){
 document.documentElement.dir=lang==='he'?'rtl':'ltr';
 const cta=(key,cls='btn sun ld-cta')=>'<button type="button" class="'+cls+'" data-action="apply">'+e(t(key))+icon('arrow')+'</button>';
 const stat=(n,k)=>'<div class="ld-stat reveal"><strong class="ltr">'+e(t(n))+'</strong><span>'+e(t(k))+'</span></div>';
 const step=(i,tk,bk)=>'<li class="ld-step reveal"><span class="ld-step-n">'+i+'</span><h3>'+e(t(tk))+'</h3><p>'+e(t(bk))+'</p></li>';
 const tick=k=>'<li>'+icon('check')+e(t(k))+'</li>';
 const faq=(q,a,i)=>'<div class="faq-item reveal"><button type="button" class="faq-q" data-action="faq" aria-expanded="false" aria-controls="faq-'+i+'">'+e(t(q))+icon('plus')+'</button><div class="faq-a" id="faq-'+i+'"><p>'+e(t(a))+'</p></div></div>';
 const feeExample=lang==='he'?'1,200 ₪':'$450';
 const mock='<div class="ld-mock" aria-hidden="true"><span class="ld-mock-label">'+e(t('ldMockLabel'))+'</span><div class="ld-mock-card"><div class="ld-mock-top"><span class="avatar gold">NG</span><div><strong>'+e(t('ldMockMission'))+'</strong><span class="ld-mock-status"><span class="dot"></span>'+e(t('ldMockStatus'))+'</span></div></div><div class="ld-mock-row"><span>'+e(t('ldMockFee'))+'</span><strong class="ltr">'+e(feeExample)+'</strong></div></div><div class="ld-mock-chip">'+icon('sparkle')+'<span>'+e(t('ldMockSale'))+'<b>'+e(t('ldMockShare'))+'</b></span></div><div class="ld-cube c1"></div><div class="ld-cube c2"></div><div class="ld-cube c3"></div></div>';
 $('#app').innerHTML='<div class="landing" id="top">'+publicHeader()+
  '<section class="ld-hero"><div class="ld-hero-copy"><span class="eyebrow ld-eyebrow">'+e(t('ldEyebrow'))+'</span><h1 class="ld-h1"><span>'+e(t('ldH1a'))+'</span> <em>'+e(t('ldH1b'))+'</em></h1><p class="ld-sub">'+e(t('ldSub'))+'</p><div class="ld-actions">'+cta('ldCta')+'<button type="button" class="pub-link" data-action="mode" data-view="login">'+e(t('ldCtaLogin'))+'</button></div><p class="ld-trust">'+icon('shield')+e(t('ldTrust'))+'</p></div>'+mock+'</section>'+
  '<section class="ld-stats" aria-label="SimpliiGood Creator Club">'+stat('ldStat1n','ldStat1')+stat('ldStat2n','ldStat2')+stat('ldStat3n','ldStat3')+stat('ldStat4n','ldStat4')+'</section>'+
  '<section class="ld-section" id="how"><span class="eyebrow">'+e(t('ldHowEyebrow'))+'</span><h2 class="ld-h2">'+e(t('ldHowTitle'))+'</h2><ol class="ld-steps">'+step(1,'ldStep1t','ldStep1')+step(2,'ldStep2t','ldStep2')+step(3,'ldStep3t','ldStep3')+'</ol></section>'+
  '<section class="ld-section ld-tracks-wrap" id="tracks"><span class="eyebrow">'+e(t('ldTracksEyebrow'))+'</span><h2 class="ld-h2">'+e(t('ldTracksTitle'))+'</h2><div class="ld-tracks"><article class="ld-track reveal"><h3>'+e(t('ldFeeTitle'))+'</h3><p>'+e(t('ldFeeDesc'))+'</p><ul class="ld-ticks">'+tick('ldFee1')+tick('ldFee2')+tick('ldFee3')+'</ul></article><article class="ld-track highlight reveal"><span class="ld-badge">'+e(t('ldAffBadge'))+'</span><h3>'+e(t('ldAffTitle'))+'</h3><p>'+e(t('ldAffDesc'))+'</p><ul class="ld-ticks">'+tick('ldAff1')+tick('ldAff2')+tick('ldAff3')+'</ul></article></div><p class="ld-note">'+e(t('ldTracksNote'))+'</p></section>'+
  '<section class="ld-section ld-product" id="product"><div class="ld-product-copy reveal"><span class="eyebrow">'+e(t('ldProdEyebrow'))+'</span><h2 class="ld-h2">'+e(t('ldProdTitle'))+'</h2><p>'+e(t('ldProdText'))+'</p></div><div class="ld-not reveal"><span class="eyebrow">'+e(t('ldNotEyebrow'))+'</span><ul>'+['ldNot1','ldNot2','ldNot3'].map(k=>'<li>'+icon('x')+e(t(k))+'</li>').join('')+'</ul></div></section>'+
  '<section class="ld-section" id="faq"><span class="eyebrow">'+e(t('ldFaqEyebrow'))+'</span><h2 class="ld-h2">'+e(t('ldFaqTitle'))+'</h2><div class="faq">'+[['ldQ1','ldA1'],['ldQ2','ldA2'],['ldQ3','ldA3'],['ldQ4','ldA4'],['ldQ5','ldA5']].map(([q,a],i)=>faq(q,a,i)).join('')+'</div></section>'+
  '<section class="ld-final reveal"><h2>'+e(t('ldFinalTitle'))+'</h2><p>'+e(t('ldFinalSub'))+'</p>'+cta('ldFinalCta')+'</section>'+
  '<footer class="ld-footer">'+brandLogo('dark','foot-logo')+'<p>'+e(t('ldFooterPrivacy'))+'</p><nav class="ld-footer-nav"><button type="button" class="pub-link" data-action="mode" data-view="login">'+e(t('ldFooterLogin'))+'</button><button type="button" class="pub-link" data-action="apply">'+e(t('ldFooterJoin'))+'</button></nav><span class="tiny ltr">v'+APP_VERSION+' · SimpliiGood Creator Club</span></footer>'+
  '<div class="ld-sticky">'+cta('ldStickyCta','btn sun wide')+'</div></div>';
 revealOnScroll();
}
function revealOnScroll(){
 const els=document.querySelectorAll('.reveal');
 if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(el=>el.classList.add('in'));return;}
 const io=new IntersectionObserver(entries=>{entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{rootMargin:'0px 0px -8% 0px'});
 els.forEach(el=>io.observe(el));
}
