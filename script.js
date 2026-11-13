// DPL 2026 — existing hero motion plus live tournament features.
(() => {
  'use strict';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  if (hero && !motionPreference.matches) requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('hero-ready')));
  else if (hero) hero.classList.add('hero-ready');

  // Lightweight automatic hero slider. The first WebP is eager; later slides load lazily.
  const slider = document.querySelector('.hero-slider');
  if (slider) {
    const slides = [...slider.querySelectorAll('.hero-slide')];
    const dots = [...slider.querySelectorAll('.hero-slider-dots button')];
    let activeSlide = 0;
    const showSlide = index => {
      activeSlide = (index + slides.length) % slides.length;
      slides.forEach((img, i) => img.classList.toggle('is-active', i === activeSlide));
      dots.forEach((dot, i) => { dot.classList.toggle('is-active', i === activeSlide); if (i === activeSlide) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current'); });
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
    if (!motionPreference.matches && slides.length > 1) window.setInterval(() => showSlide(activeSlide + 1), 5000);
  }

  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.section-label,.intro-content,.fact,.live-section-heading,.teams-heading');
    targets.forEach(el => el.classList.add('reveal'));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    targets.forEach(el => observer.observe(el));
  }

  const API = (window.DPL_CONFIG && window.DPL_CONFIG.API_URL || '').trim();
  const clientKey = (() => { let k=localStorage.getItem('dplPublicClientKey'); if(!k){k=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random());localStorage.setItem('dplPublicClientKey',k);} return k; })();
  const configured = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(API);
  const $ = (selector, root=document) => root.querySelector(selector);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(action, payload={}) {
    if (!configured) throw new Error('The DPL backend has not been configured yet.');
    const response = await fetch(API, { method: 'POST', headers: {'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action, clientKey, ...payload}) });
    if (!response.ok) throw new Error('The server could not complete this request.');
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }
  async function getPublic() {
    if (!configured) return null;
    const response = await fetch(`${API}?action=public&t=${Date.now()}`, {cache:'no-store'});
    if (!response.ok) throw new Error('Unable to load tournament data.');
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Unable to load tournament data.');
    return data;
  }
  function setLiveStatus(status) {
    const node = $('#live-status'); if (!node) return;
    const value = String(status || '').toLowerCase();
    const live = ['live','in progress','in_progress','ongoing'].includes(value);
    const upcoming = ['upcoming','scheduled','not started',''].includes(value);
    node.classList.toggle('is-live', live);
    node.classList.toggle('is-upcoming', upcoming);
    node.querySelector('b').textContent = live ? 'MATCH LIVE' : (upcoming ? 'LIVE MATCH' : 'MATCH COMPLETED');
  }
  function renderScore(match) {
    const host = $('#live-match-card'); if (!host) return;
    if (!match) { setLiveStatus('upcoming'); host.innerHTML = '<div class="score-empty">LIVE MATCH</div>'; return; }
    setLiveStatus(match.status || 'live');
    const innings = match.currentInnings || {};
    const overs = `${Math.floor(Number(innings.balls||0)/6)}.${Number(innings.balls||0)%6}`;
    const batting=match.battingScorecard||[], bowling=match.bowlingScorecard||[], fow=match.fallOfWickets||[], commentary=match.recentCommentary||[];
    const battingHTML=batting.length?`<div class="public-scorecard"><h3>BATTING</h3><div class="scorecard-row scorecard-head"><span>BATTER</span><span>R</span><span>B</span><span>4s</span><span>6s</span></div>${batting.map(p=>`<div class="scorecard-row"><b>${escapeHTML(p.playerName)}</b><span>${p.runs}</span><span>${p.balls}</span><span>${p.fours}</span><span>${p.sixes}</span></div>`).join('')}</div>`:'';
    const bowlingHTML=bowling.length?`<div class="public-scorecard"><h3>BOWLING</h3><div class="scorecard-row bowling-row scorecard-head"><span>BOWLER</span><span>O</span><span>R</span><span>W</span></div>${bowling.map(p=>`<div class="scorecard-row bowling-row"><b>${escapeHTML(p.playerName)}</b><span>${escapeHTML(p.overs)}</span><span>${p.runs}</span><span>${p.wickets}</span></div>`).join('')}</div>`:'';
    host.innerHTML = `<div class="score-top"><span class="score-live-pill">${escapeHTML(match.status || 'LIVE')}</span><span>${escapeHTML(match.matchName || 'DPL MATCH')}</span></div><div class="score-teams"><div><small>${escapeHTML(match.battingTeamName || 'Batting')}</small><strong>${Number(innings.runs||0)}/${Number(innings.wickets||0)}</strong><span>${overs} overs</span></div><div class="score-vs">VS</div><div><small>${escapeHTML(match.bowlingTeamName || 'Bowling')}</small><strong>—</strong><span>${escapeHTML(match.inningsLabel || 'In progress')}</span></div></div><div class="score-meta"><span>CRR ${Number(innings.balls||0) ? (Number(innings.runs||0)/(Number(innings.balls||0)/6)).toFixed(2) : '0.00'}</span><span>EXTRAS ${Number(innings.extras||0)}</span><span>${escapeHTML(match.statusText || 'Match in progress')}</span></div><div class="current-players"><span>STRIKER <b>${escapeHTML(match.striker||'—')}</b></span><span>NON-STRIKER <b>${escapeHTML(match.nonStriker||'—')}</b></span><span>BOWLER <b>${escapeHTML(match.bowler||'—')}</b></span></div><div class="score-commentary"><b>LAST BALL</b> ${escapeHTML(match.lastCommentary || 'Waiting for the first delivery')}</div>${battingHTML}${bowlingHTML}<div class="fow-line">FALL OF WICKETS: ${fow.map(x=>`${x.wicket}-${x.score} (${x.over})`).join(' · ')||'—'}</div><div class="public-commentary">${commentary.map(x=>`<p><b>${escapeHTML(x.over)}</b> ${escapeHTML(x.text)}</p>`).join('')}</div>`;
  }
  function renderTeams(teams=[]) {
    const host=$('#public-teams'); if (!host) return;
    host.innerHTML = teams.length ? teams.map(t=>`<article class="public-team-card"><span>OFFICIAL TEAM</span><strong>${escapeHTML(t.teamName)}</strong><code>${escapeHTML(t.teamId)}</code></article>`).join('') : '<p class="empty-note">Official team announcements will appear here.</p>';
  }
  function renderSchedule(matches=[]) {
    const host=$('#public-schedule'); if (!host) return;
    host.innerHTML = matches.length ? matches.map(m=>`<article class="fixture-card"><div><span>${escapeHTML(m.matchDate || 'Date TBA')} · ${escapeHTML(m.venue || 'Venue TBA')}</span><strong>${escapeHTML(m.teamAName || 'TBA')} <i>VS</i> ${escapeHTML(m.teamBName || 'TBA')}</strong><small>${escapeHTML(m.result || m.status || 'Upcoming')}</small></div><b>${escapeHTML(m.matchId || '')}</b></article>`).join('') : '<p class="empty-note">Match fixtures will be announced by the tournament organisers.</p>';
  }
  function renderPoints(rows=[]) {
    const host=$('#public-points'); if (!host) return;
    host.innerHTML = rows.length ? `<table class="points-table"><thead><tr><th>TEAM</th><th>MAT</th><th>W</th><th>L</th><th>PTS</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHTML(r.teamName)}</td><td>${Number(r.played||0)}</td><td>${Number(r.won||0)}</td><td>${Number(r.lost||0)}</td><td><b>${Number(r.points||0)}</b></td></tr>`).join('')}</tbody></table>` : '<p class="empty-note">Points table will appear when the tournament begins.</p>';
  }
  let allComments = [];
  let visibleCommentCount = 0;
  let commentObserver = null;
  let lastCommentsSignature = null;
  function commentCard(c) {
    return `<article class="comment-card"><div><b>${escapeHTML(c.displayName || 'Anonymous supporter')}</b><small>${escapeHTML(c.createdAt || '')} · ${escapeHTML(c.commentId || '')}</small></div><p>${escapeHTML(c.message)}</p><button type="button" class="report-comment" data-id="${escapeHTML(c.commentId)}">REPORT</button></article>`;
  }
  function renderComments(comments=[]) {
    const host=$('#public-comments'); if (!host) return;
    // The public API refreshes every few seconds. Avoid replacing the comment
    // DOM when nothing changed: doing so interrupts scrolling and touch gestures.
    const signature = JSON.stringify(comments || []);
    if (signature === lastCommentsSignature) return;
    lastCommentsSignature = signature;
    const pageScrollY = window.scrollY;
    allComments = comments;
    visibleCommentCount = Math.min(Math.max(5, visibleCommentCount), allComments.length);
    if (commentObserver) commentObserver.disconnect();
    if (!allComments.length) { host.innerHTML = '<p class="empty-note">Be the first to leave a comment.</p>'; return; }
    host.innerHTML = allComments.slice(0, visibleCommentCount).map(commentCard).join('') + (visibleCommentCount < allComments.length ? '<div class="comment-scroll-sentinel" aria-hidden="true"></div>' : '');
    if (Math.abs(window.scrollY - pageScrollY) > 2) {
      requestAnimationFrame(() => window.scrollTo({ top: pageScrollY, behavior: 'auto' }));
    }
    const sentinel = host.querySelector('.comment-scroll-sentinel');
    if (sentinel && 'IntersectionObserver' in window) {
      commentObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        const oldCount = visibleCommentCount; visibleCommentCount = Math.min(oldCount + 5, allComments.length);
        const next = allComments.slice(oldCount, visibleCommentCount).map(commentCard).join('');
        sentinel.insertAdjacentHTML('beforebegin', next);
        if (visibleCommentCount >= allComments.length) { commentObserver.disconnect(); sentinel.remove(); }
      }, { rootMargin: '180px' });
      commentObserver.observe(sentinel);
    } else if (sentinel) {
      const more = document.createElement('button'); more.className='comments-load-more'; more.type='button'; more.textContent='LOAD OLDER COMMENTS';
      more.addEventListener('click', () => { const old=visibleCommentCount; visibleCommentCount=Math.min(old+5,allComments.length); more.insertAdjacentHTML('beforebegin',allComments.slice(old,visibleCommentCount).map(commentCard).join('')); if(visibleCommentCount>=allComments.length)more.remove(); });
      sentinel.replaceWith(more);
    }
  }
  async function refresh() {
    if (!configured) return;
    try {
      const data=await getPublic(); renderScore(data.liveMatch); renderTeams(data.teams||[]); renderSchedule(data.matches||[]); renderPoints(data.points||[]); renderComments(data.comments||[]);
      const stamp=$('#score-updated'); if (stamp) stamp.textContent=`Updated ${new Date().toLocaleTimeString()}`;
    } catch (err) { console.warn('DPL public refresh:', err.message); }
  }
  const setFeedback=(node,message,good=false)=>{ if(node){node.textContent=message;node.className=`form-feedback ${good?'success':'error'}`;} };
  $('#team-registration-form')?.addEventListener('submit', async e=>{
    e.preventDefault(); const form=e.currentTarget, feedback=$('#registration-feedback');
    if(!form.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form).entries());
    try { const result=await api('submitApplication',{application:data}); form.reset(); setFeedback(feedback,`Application received. Your Application ID is ${result.applicationId}. Save this ID to check your status.`,true); }
    catch(err){setFeedback(feedback,err.message);}
  });
  $('#application-lookup-form')?.addEventListener('submit',async e=>{
    e.preventDefault(); const id=new FormData(e.currentTarget).get('applicationId').trim(); const host=$('#application-lookup-result');
    try { const result=await api('lookupApplication',{applicationId:id}); host.textContent=`Application ${result.applicationId}: ${result.applicationStatus}. Payment: ${result.paymentStatus}.`; }
    catch(err){host.textContent=err.message;}
  });
  $('#payment-form')?.addEventListener('submit',async e=>{
    e.preventDefault(); const form=e.currentTarget, feedback=$('#payment-feedback'); if(!form.reportValidity())return;
    const fd=new FormData(form), file=fd.get('proof');
    if(!file || file.size>4*1024*1024){setFeedback(feedback,'Please select a JPG, PNG or PDF file up to 4 MB.');return;}
    const allowed=['image/jpeg','image/png','application/pdf']; if(!allowed.includes(file.type)){setFeedback(feedback,'Unsupported proof file type.');return;}
    const reader=new FileReader(); reader.onload=async()=>{try{const base64=String(reader.result).split(',')[1]; const payment={applicationId:fd.get('applicationId'),transactionId:fd.get('transactionId'),amount:fd.get('amount'),paymentDate:fd.get('paymentDate'),fileName:file.name,mimeType:file.type,fileBase64:base64};const result=await api('submitPayment',{payment});form.reset();setFeedback(feedback,`Payment details submitted for manual verification. Reference: ${result.paymentId}.`,true);}catch(err){setFeedback(feedback,err.message);}}; reader.onerror=()=>setFeedback(feedback,'Could not read the selected file.'); reader.readAsDataURL(file);
  });
  $('#comment-form')?.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,feedback=$('#comment-feedback');if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form).entries());
    try{await api('postComment',{comment:data});form.reset();setFeedback(feedback,'Your comment was submitted for moderation.',true);refresh();}catch(err){setFeedback(feedback,err.message);}
  });
  $('#public-comments')?.addEventListener('click',async e=>{
    const button=e.target.closest('.report-comment');if(!button)return;
    try{await api('reportComment',{commentId:button.dataset.id});button.textContent='REPORTED';button.disabled=true;}catch(err){alert(err.message);}
  });
  $('#refresh-score')?.addEventListener('click', async () => {
    const button=$('#refresh-score'); if (!button || button.disabled) return;
    button.disabled=true; button.classList.add('is-refreshing'); button.textContent='↻ REFRESHING…';
    await refresh();
    button.disabled=false; button.classList.remove('is-refreshing'); button.textContent='↻ REFRESH SCORE';
  });
  refresh(); if(configured) window.setInterval(refresh,Math.max(5000,Number(window.DPL_CONFIG.SCORE_REFRESH_MS)||7000));
})();
