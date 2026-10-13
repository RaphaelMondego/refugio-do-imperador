const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- WhatsApp ----------
const WA = 'https://wa.me/5521972780104?text=' + encodeURIComponent('Olá! Vi o site do Refúgio do Imperador e gostaria de consultar datas disponíveis.');
$$('[data-wa]').forEach((a) => { a.href = WA; a.target = '_blank'; a.rel = 'noopener'; });
$('#year').textContent = new Date().getFullYear();

// ?pronto, ?noite e ?ponto=<id> abrem a maquete já montada / à noite / num ponto do tour
const preview = new URLSearchParams(location.search);

// ---------- álbuns de fotos ----------
const ALBUMS = [
  { id: 'piscina', name: 'Piscina & jacuzzi', photos: [['vista-jacuzzi-casa', 'Jacuzzi com vista para a serra'], ['piscina-1', 'Piscina'], ['jacuzzi-ceu', 'Jacuzzi'], ['jacuzzi-casa', 'Deck da jacuzzi'], ['piscina-3', 'Piscina'], ['jacuzzi-deck', 'Jacuzzi e piscina'], ['jacuzzi-espuma', 'Banho de espuma'], ['piscina-2', 'Dia de sol'], ['piscina-campo', 'Piscina e campo'], ['jacuzzi-brinde', 'Brinde na jacuzzi']] },
  { id: 'noite', name: 'À noite', photos: [['piscina-noite-1', 'Piscina iluminada'], ['fogueira-noite-1', 'Fogueira à noite'], ['jacuzzi-noite', 'Jacuzzi à noite'], ['vinho-noite', 'Um brinde sob as luzes'], ['coreto-noite', 'Coreto iluminado'], ['piscina-noite-2', 'Piscina ao anoitecer'], ['luzes-noite', 'Varal de luzes'], ['fogueira-noite-2', 'Fogo aceso'], ['jacuzzi-neon', 'Jacuzzi em neon'], ['jardim-luzes', 'Jardim à noite']] },
  { id: 'jardim', name: 'Jardim & fogueira', photos: [['fogueira-dia', 'Roda de fogueira'], ['fachada', 'A casa'], ['chafariz', 'Chafariz'], ['ombrelone', 'Jardim'], ['mesa-tronco', 'Cantinho no jardim'], ['carpas', 'Carpas'], ['jardim', 'Jardim'], ['mamoeiro', 'Mamoeiro']] },
  { id: 'gourmet', name: 'Gourmet', photos: [['mesa-rustica', 'Mesa rústica para 12'], ['churrasqueira', 'Churrasqueira e forno'], ['forno-pizza', 'Forno de pizza'], ['gourmet', 'Espaço gourmet'], ['bancada-externa', 'Cozinha ao ar livre'], ['mesa-rustica-2', 'Área de jantar']] },
  { id: 'lazer', name: 'Jogos & campo', photos: [['sinuca', 'Sinuca'], ['playground-1', 'Playground'], ['campo-1', 'Campo de futebol'], ['ping-pong', 'Pingue-pongue'], ['fliperama', 'Fliperama'], ['sinuca-bolas', 'Sinuca'], ['playground-2', 'Playground'], ['campo-2', 'Campo de futebol']] },
  { id: 'casa', name: 'A casa', photos: [['sala-1', 'Sala de estar'], ['quarto-1', 'Quarto 1'], ['cozinha-1', 'Cozinha'], ['quarto-2', 'Quarto 2'], ['cantinho-cafe', 'Cantinho do café'], ['sala-2', 'Sala de estar'], ['quarto-3', 'Quarto 3'], ['quarto-4', 'Quarto 4'], ['quarto-5', 'Quarto 5'], ['quarto-1b', 'Quarto 1'], ['quarto-2b', 'Quarto 2'], ['sala-3', 'Sala de estar'], ['cozinha-2', 'Cozinha'], ['cha', 'Chá para relaxar'], ['banheiro-1', 'Banheiro'], ['banheiro-2', 'Banheiro']] },
  { id: 'cachoeira', name: 'Cachoeira', photos: [['cachoeira-1', 'Cachoeira a 100 m'], ['cachoeira-2', 'Rio na mata'], ['cachoeira-3', 'Cachoeira'], ['cachoeira-4', 'Águas claras']] },
];
const ALL = { id: 'todas', name: 'Todas', photos: ALBUMS.flatMap((a) => a.photos) };
const albumOf = (name) => ALBUMS.find((a) => a.photos.some((p) => p[0] === name));

// ---------- visualizador ----------
const lb = $('#lightbox'), lbStage = $('.lightbox__stage', lb), lbImg = $('img', lbStage), lbCap = $('figcaption', lbStage), lbCount = $('.lightbox__count', lb), lbChips = $('#lbAlbums'), lbStrip = $('#lbStrip');
let lbAlbum = ALL, lbPos = 0, lbFocus = null;
lbChips.innerHTML = [ALL, ...ALBUMS].map((a) => `<button type="button" data-album="${a.id}">${a.name}<small>${a.photos.length}</small></button>`).join('');
const lbShow = () => {
  const [n, cap] = lbAlbum.photos[lbPos];
  lbImg.classList.remove('is-ready');
  const src = `assets/img/${n}.webp`, pre = new Image();
  pre.onload = () => { if (lbAlbum.photos[lbPos][0] !== n) return; lbImg.src = src; lbImg.alt = cap; requestAnimationFrame(() => lbImg.classList.add('is-ready')); };
  pre.src = src;
  lbCap.textContent = cap;
  lbCount.textContent = `${lbPos + 1} / ${lbAlbum.photos.length}`;
  $$('button', lbStrip).forEach((b, i) => {
    b.classList.toggle('is-active', i === lbPos);
    if (i === lbPos) lbStrip.scrollTo({ left: b.offsetLeft - lbStrip.clientWidth / 2 + b.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  });
  // pré-carrega a próxima
  new Image().src = `assets/img/${lbAlbum.photos[(lbPos + 1) % lbAlbum.photos.length][0]}.webp`;
};
const lbSetAlbum = (album, pos = 0) => {
  lbAlbum = album; lbPos = pos;
  $$('button', lbChips).forEach((b) => { const on = b.dataset.album === album.id; b.classList.toggle('is-active', on); if (on) lbChips.scrollTo({ left: b.offsetLeft - 16 }); });
  lbStrip.innerHTML = album.photos.map(([n, cap], i) => `<button type="button" data-i="${i}" aria-label="${cap}"><img src="assets/thumb/${n}.webp" alt="" loading="lazy"></button>`).join('');
  lbStrip.scrollLeft = 0;
  lbShow();
};
const lbOpen = (album, pos = 0) => { lbFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; requestAnimationFrame(() => lb.classList.add('is-open')); lbSetAlbum(album, pos); $('.lightbox__close').focus(); };
const lbOpenPhoto = (name) => { const a = albumOf(name); if (a) lbOpen(a, a.photos.findIndex((p) => p[0] === name)); };
const lbClose = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 400); lbFocus && lbFocus.focus(); };
const lbStep = (d) => { lbPos = (lbPos + d + lbAlbum.photos.length) % lbAlbum.photos.length; lbShow(); };
lbChips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) lbSetAlbum([ALL, ...ALBUMS].find((a) => a.id === b.dataset.album)); });
lbStrip.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { lbPos = +b.dataset.i; lbShow(); } });
$('.lightbox__close').addEventListener('click', lbClose);
$('.lightbox__nav--prev').addEventListener('click', () => lbStep(-1));
$('.lightbox__nav--next').addEventListener('click', () => lbStep(1));
lbStage.addEventListener('click', (e) => { if (e.target === lbStage || e.target.tagName === 'FIGURE') lbClose(); });
let tx = 0;
lbStage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
lbStage.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); }, { passive: true });

// ---------- galeria por ambiente ----------
const tabs = $('#albumTabs'), mosaic = $('#mosaic');
tabs.innerHTML = ALBUMS.map((a, i) => `<button type="button" role="tab" data-album="${a.id}" aria-selected="${i === 0}" class="${i === 0 ? 'is-active' : ''}">${a.name}<small>${a.photos.length}</small></button>`).join('');
const renderMosaic = (album) => {
  const shown = album.photos.slice(0, 5), more = album.photos.length - shown.length;
  mosaic.dataset.n = shown.length;
  mosaic.dataset.album = album.id;
  mosaic.innerHTML = shown.map(([n, cap], i) => `<button type="button" data-i="${i}" style="--i:${i}" aria-label="Abrir foto: ${cap}"><img src="assets/${i === 0 ? 'img' : 'thumb'}/${n}.webp" alt="${cap}" loading="lazy"><span>${cap}</span>${i === shown.length - 1 && more > 0 ? `<b>+${more}<small>fotos</small></b>` : ''}</button>`).join('');
  requestAnimationFrame(() => requestAnimationFrame(() => mosaic.classList.add('is-in')));
};
tabs.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.classList.contains('is-active')) return;
  $$('button', tabs).forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', String(x === b)); });
  mosaic.classList.remove('is-in');
  setTimeout(() => renderMosaic(ALBUMS.find((a) => a.id === b.dataset.album)), reduced ? 0 : 260);
});
mosaic.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) lbOpen(ALBUMS.find((a) => a.id === mosaic.dataset.album), +b.dataset.i); });
renderMosaic(ALBUMS[0]);
const allBtn = $('#allPhotos');
allBtn.textContent = `Ver todas as ${ALL.photos.length} fotos`;
allBtn.addEventListener('click', () => lbOpen(ALL, 0));

// ---------- hero 3D + tour pelos pontos do sítio ----------
const SPOTS = [
  { id: 'casa', title: 'A casa', text: 'Cinco quartos climatizados, três suítes, sala ampla e cozinha completa.', img: 'fachada' },
  { id: 'piscina', title: 'Piscina', text: 'Privativa, para mergulhar o dia inteiro. À noite, acende em cores.', img: 'piscina-1' },
  { id: 'jacuzzi', title: 'Jacuzzi', text: 'No deck ao lado da piscina, com ombrelone e vista para as montanhas.', img: 'jacuzzi-ceu' },
  { id: 'campo', title: 'Campo de futebol', text: 'Gramado e cercado, logo depois da piscina.', img: 'campo-1' },
  { id: 'playground', title: 'Playground', text: 'Mini parquinho para as crianças de até 10 anos.', img: 'playground-1' },
  { id: 'fogueira', title: 'Roda de fogueira', text: 'Cadeiras em círculo sob o varal de luzes, para a noite render.', img: 'fogueira-dia' },
  { id: 'jogos', title: 'Garagem e jogos', text: 'Vaga para 2 a 3 carros e, na parte coberta, a mesa de sinuca e pingue-pongue.', img: 'sinuca' },
];
const hero = $('#hero'), spotEl = $('#spot');
let hero3d = null, spotI = -1;
const openSpot = (i) => {
  if (i < 0 && spotI < 0) return;
  spotI = (i + SPOTS.length) % SPOTS.length;
  const s = SPOTS[spotI];
  $('img', spotEl).src = `assets/thumb/${s.img}.webp`; $('img', spotEl).alt = s.title;
  $('h3', spotEl).textContent = s.title; $('p', spotEl).textContent = s.text;
  $('.spot__count', spotEl).textContent = `${spotI + 1}/${SPOTS.length}`;
  spotEl.classList.add('is-open'); hero.classList.add('has-spot');
  hero3d && hero3d.focus(s.id);
};
const closeSpot = () => { spotI = -1; spotEl.classList.remove('is-open'); hero.classList.remove('has-spot'); hero3d && hero3d.focus(null); };
$('.spot__close', spotEl).addEventListener('click', closeSpot);
$('.spot__prev', spotEl).addEventListener('click', () => openSpot(spotI - 1));
$('.spot__next', spotEl).addEventListener('click', () => openSpot(spotI + 1));
$('.spot__photos', spotEl).addEventListener('click', () => lbOpenPhoto(SPOTS[spotI].img));
$('#tourBtn').addEventListener('click', () => (spotI < 0 ? openSpot(0) : closeSpot()));

const heroReady = (async () => {
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('sem WebGL');
    const { initHero } = await import('./hero3d.js');
    hero3d = initHero({ canvas: $('#heroCanvas'), labelsEl: $('#heroLabels'), hero, reducedMotion: reduced, onSpot: (id) => openSpot(SPOTS.findIndex((s) => s.id === id)) });
  } catch (err) {
    document.documentElement.classList.add('no-webgl');
  }
})();

// dia / noite
const dn = $('#dayNight');
dn.addEventListener('click', () => {
  const night = dn.getAttribute('aria-checked') !== 'true';
  dn.setAttribute('aria-checked', String(night));
  hero.classList.toggle('is-night', night);
  document.body.classList.toggle('night-hero', night);
  hero3d && hero3d.setNight(night);
});

const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)));
// abertura: o nome do sítio é digitado letra a letra antes de o site aparecer
const minTime = new Promise((done) => {
  const el = $('#typed'), text = 'Refúgio do Imperador';
  if (reduced || preview.has('pronto')) { el.textContent = text; return done(); }
  let i = 0;
  const tick = () => {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, text[i] === ' ' ? 260 : 105 + Math.random() * 70);
    else setTimeout(done, 900);
  };
  setTimeout(tick, 500);
});
Promise.all([heroReady, minTime, Promise.race([loaded, new Promise((r) => setTimeout(r, 4000))])]).then(() => {
  document.body.classList.remove('is-loading');
  setTimeout(() => hero3d && hero3d.start(preview.has('pronto')), 250);
  if (preview.has('noite')) { dn.click(); hero3d && hero3d.setNight(true, true); }
  if (preview.has('ponto')) setTimeout(() => { const i = SPOTS.findIndex((s) => s.id === preview.get('ponto')); if (i >= 0) openSpot(i); }, 400);
});

addEventListener('keydown', (e) => {
  if (!lb.hidden) { if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowLeft') lbStep(-1); if (e.key === 'ArrowRight') lbStep(1); return; }
  if (spotI >= 0 && e.key === 'Escape') closeSpot();
});

// ---------- nav ----------
const nav = $('#nav'), menu = $('#menu'), toggle = $('#menuToggle'), progress = $('.progress'), waFloat = $('.wa-float');
const setMenu = (open) => { if (open) nav.classList.remove('is-hidden'); menu.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open); toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); };
toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

// ---------- scroll: nav, progresso, parallax ----------
const parallaxEls = $$('[data-parallax]').map((el) => ({ el, amt: +el.dataset.parallax }));
const ctaBg = $('[data-parallax-bg]');
const mountains = $$('.hero__mountains path');
let lastY = 0, ticking = false, mx = 0;
const onScroll = () => {
  ticking = false;
  const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
  nav.classList.toggle('is-scrolled', y > 40);
  nav.classList.toggle('is-hidden', y > vh && y > lastY && !document.body.classList.contains('menu-open'));
  waFloat.classList.toggle('is-on', y > vh * 0.7);
  progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  if (spotI >= 0 && y > vh * 0.6) closeSpot();
  lastY = y;
  if (reduced) return;
  if (y < vh) mountains.forEach((p) => { const d = +p.dataset.depth; p.style.transform = 'translate3d(' + (mx * d * -0.6).toFixed(1) + 'px,' + (y * d * 0.006).toFixed(1) + 'px,0)'; });
  if (innerWidth >= 900) {
    for (const { el, amt } of parallaxEls) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const k = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (k * amt).toFixed(1) + 'px,0)';
    }
  }
  if (ctaBg) { const r = ctaBg.parentElement.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) ctaBg.style.transform = 'translate3d(0,' + (((r.top + r.height / 2 - vh / 2) / vh) * -70).toFixed(1) + 'px,0)'; }
};
const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
addEventListener('scroll', requestTick, { passive: true });
addEventListener('resize', requestTick);
if (finePointer) addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth) * 2 - 1; if (scrollY < innerHeight) requestTick(); }, { passive: true });
onScroll();

// ---------- reveals ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
const groups = new Map();
$$('.reveal, .reveal-img').forEach((el) => {
  const parent = el.parentElement, i = groups.get(parent) || 0;
  groups.set(parent, i + 1);
  el.style.setProperty('--d', Math.min(i, 6) * 0.09 + 's');
  io.observe(el);
});

// contadores
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    countIO.unobserve(en.target);
    const end = +en.target.dataset.count, t0 = performance.now();
    if (reduced) return;
    const step = (now) => { const k = Math.min(1, (now - t0) / 1400); en.target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => countIO.observe(el));

// ---------- céu da seção noite ----------
const sky = $('.night__stars');
if (sky) {
  let html = '';
  for (let i = 0; i < 70; i++) html += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--t:${(2 + Math.random() * 4).toFixed(1)}s;--dl:-${(Math.random() * 5).toFixed(1)}s"></i>`;
  for (let i = 0; i < 14; i++) html += `<i class="fly" style="left:${(Math.random() * 100).toFixed(1)}%;top:${(20 + Math.random() * 75).toFixed(1)}%;--t:${(7 + Math.random() * 7).toFixed(1)}s;--dl:-${(Math.random() * 10).toFixed(1)}s;--fx:${(Math.random() * 120 - 60).toFixed(0)}px;--fy:${(Math.random() * -90).toFixed(0)}px"></i>`;
  sky.innerHTML = html;
}

// ---------- efeitos de ponteiro ----------
if (finePointer && !reduced) {
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1)}px)`; });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transition = 'transform .15s'; el.style.transform = `perspective(900px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg) scale(1.015)`; });
    el.addEventListener('pointerleave', () => { el.style.transition = 'transform .8s cubic-bezier(.2,.7,.2,1)'; el.style.transform = ''; });
  });
}

// ---------- carrossel da casa (arrastar) ----------
const rooms = $('#rooms');
let rDown = false, rMoved = 0, rStart = 0, rLeft = 0;
rooms.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; rDown = true; rMoved = 0; rStart = e.clientX; rLeft = rooms.scrollLeft; });
addEventListener('pointermove', (e) => { if (!rDown) return; const dx = e.clientX - rStart; rMoved = Math.max(rMoved, Math.abs(dx)); if (rMoved > 6) rooms.classList.add('is-dragging'); rooms.scrollLeft = rLeft - dx; });
addEventListener('pointerup', () => { if (!rDown) return; rDown = false; setTimeout(() => rooms.classList.remove('is-dragging'), 0); });

// fotos avulsas da página abrem o visualizador já no álbum certo
$$('[data-lb]').forEach((el) => el.addEventListener('click', () => { if (rMoved > 6) { rMoved = 0; return; } lbOpenPhoto(el.dataset.lb); }));
