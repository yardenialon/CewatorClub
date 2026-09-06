/* Sign-in screen (remote mode only): request a one-time link by e-mail. */
function renderLogin(){
 document.documentElement.dir=lang==='he'?'rtl':'ltr';
 const sent='<div class="mini-info"><strong>'+e(t('linkSent'))+'</strong><br><bdi>'+e(linkSentTo)+'</bdi>'+(devLink?'<p class="small" style="margin:12px 0 8px">'+e(t('devLinkNote'))+'</p><a class="btn sun" id="dev-link" href="'+e(devLink)+'">'+e(t('openDevLink'))+'</a>':'')+'</div><div class="modal-actions">'+btn('tryAnotherEmail','loginAgain','','secondary')+'</div>';
 const form='<form id="login-form">'+field('email','email','','email','required maxlength="254" autocomplete="email" placeholder="creator@example.test" autofocus')+'<div id="login-errors" class="inline-error hide" role="alert"></div><div class="modal-actions"><button type="submit" class="btn sun">'+e(t('sendLink'))+icon('arrow')+'</button>'+btn('signup','apply','','secondary')+'</div></form><p class="tiny muted" style="margin-top:14px">'+e(t('loginHelp'))+'</p>';
 $('#app').innerHTML='<div class="landing login-page" id="top">'+publicHeader({hideLogin:true})+'<section class="login-split"><div class="login-copy"><span class="eyebrow ld-eyebrow">'+e(t('loginTitle'))+'</span><h1 class="ld-h1"><em>'+e(t('loginWelcome'))+'</em></h1><p class="ld-sub">'+e(t('loginSub'))+'</p><button type="button" class="pub-link" data-action="mode" data-view="landing">'+e(t('loginBack'))+'</button></div><section class="card login-card">'+(linkSentTo?sent:form)+'</section></section></div>';
 setTimeout(()=>$('#login-form input[name="email"]')?.focus(),0);
}
