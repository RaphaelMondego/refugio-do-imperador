const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- WhatsApp ----------
const WA = 'https://wa.me/5521972780104?text=' + encodeURIComponent('Olá! Vi o site do Refúgio do Imperador e gostaria de consultar datas disponíveis.');
$$('[data-wa]').forEach((a) => { a.href = WA; a.target = '_blank'; a.rel = 'noopener'; });
$('#year').textContent = new Date().getFullYear();

// ?pronto e ?noite abrem a maquete já montada / no modo noite
const preview = new URLSearchParams(location.search);

// ---------- hero 3D ----------
const hero = $('#hero');
let hero3d = null;
const heroReady = (async () => {
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('sem WebGL');
    const { initHero } = await import('./hero3d.js');
    hero3d = initHero({ canvas: $('#heroCanvas'), labelsEl: $('#heroLabels'), hero, reducedMotion: reduced });
  } catch (err) {
    document.documentElement.classList.add('no-webgl');
  }
})();

const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)));
const minTime = new Promise((r) => setTimeout(r, reduced ? 0 : 1500));
Promise.all([heroReady, minTime, Promise.race([loaded, new Promise((r) => setTimeout(r, 4000))])]).then(() => {
  document.body.classList.remove('is-loading');
  setTimeout(() => hero3d && hero3d.start(preview.has('pronto')), 250);
  if (preview.has('noite')) { dn.click(); hero3d && hero3d.setNight(true, true); }
});

// dia / noite
const dn = $('#dayNight');
dn.addEventListener('click', () => {
  const night = dn.getAttribute('aria-checked') !== 'true';
  dn.setAttribute('aria-checked', String(night));
  hero.classList.toggle('is-night', night);
  document.body.classList.toggle('night-hero', night);
  hero3d && hero3d.setNight(night);
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

// ---------- galeria + lightbox ----------
const PHOTOS = [
  ['vista-jacuzzi-casa', 'Jacuzzi com vista para a serra', 'lazer', 1600, 1200], ['piscina-1', 'Piscina', 'lazer', 1200, 1600], ['piscina-noite-1', 'Piscina iluminada', 'noite', 1600, 872],
  ['fachada', 'A casa', 'casa', 1200, 1600], ['fogueira-dia', 'Roda de fogueira', 'lazer', 1200, 1600], ['cachoeira-1', 'Cachoeira a 100 m', 'natureza', 1200, 1600],
  ['jacuzzi-ceu', 'Jacuzzi', 'lazer', 1200, 1600], ['fogueira-noite-1', 'Fogueira à noite', 'noite', 1443, 1600], ['mesa-rustica', 'Mesa rústica para 12', 'casa', 1200, 1600],
  ['sala-1', 'Sala de estar', 'casa', 1200, 1600], ['coreto-noite', 'Coreto iluminado', 'noite', 1600, 904], ['playground-1', 'Playground', 'lazer', 1200, 1600],
  ['sinuca', 'Sinuca', 'lazer', 1200, 1600], ['quarto-1', 'Quarto 1', 'casa', 1200, 1600], ['chafariz', 'Chafariz', 'natureza', 1200, 1600],
  ['jacuzzi-casa', 'Deck da jacuzzi', 'lazer', 1600, 1200], ['vinho-noite', 'Um brinde sob as luzes', 'noite', 1118, 1600], ['churrasqueira', 'Churrasqueira e forno', 'lazer', 1200, 1600],
  ['cachoeira-2', 'Rio na mata', 'natureza', 1200, 1600], ['piscina-3', 'Piscina', 'lazer', 1200, 1600], ['forno-pizza', 'Forno de pizza', 'lazer', 1200, 1600],
  ['jacuzzi-noite', 'Jacuzzi à noite', 'noite', 900, 1600], ['cozinha-1', 'Cozinha', 'casa', 1200, 1600], ['campo-1', 'Campo de futebol', 'lazer', 1200, 1600],
  ['quarto-2', 'Quarto 2', 'casa', 1200, 1600], ['ombrelone', 'Jardim', 'natureza', 1200, 1600], ['piscina-noite-2', 'Piscina ao anoitecer', 'noite', 1200, 1600],
  ['ping-pong', 'Pingue-pongue', 'lazer', 1200, 1600], ['jacuzzi-deck', 'Jacuzzi e piscina', 'lazer', 1600, 1200], ['cantinho-cafe', 'Cantinho do café', 'casa', 1200, 1600],
  ['cachoeira-3', 'Cachoeira', 'natureza', 1200, 1600], ['fliperama', 'Fliperama', 'lazer', 1200, 1600], ['quarto-3', 'Quarto 3', 'casa', 1200, 1600],
  ['fogueira-noite-2', 'Fogo aceso', 'noite', 900, 1600], ['mesa-tronco', 'Cantinho no jardim', 'natureza', 1200, 1600], ['sala-2', 'Sala de estar', 'casa', 1200, 1600],
  ['jacuzzi-espuma', 'Banho de espuma', 'lazer', 1200, 1600], ['luzes-noite', 'Varal de luzes', 'noite', 1161, 1600], ['quarto-4', 'Quarto 4', 'casa', 1200, 1600],
  ['carpas', 'Carpas', 'natureza', 900, 1600], ['piscina-campo', 'Piscina e campo', 'lazer', 1200, 1600], ['quarto-5', 'Quarto 5', 'casa', 1200, 1600],
  ['jacuzzi-neon', 'Jacuzzi em neon', 'noite', 900, 1600], ['banheiro-1', 'Banheiro', 'casa', 1200, 1600], ['cachoeira-4', 'Águas claras', 'natureza', 1200, 1600],
  ['jacuzzi-brinde', 'Brinde na jacuzzi', 'lazer', 900, 1600], ['cha', 'Chá para relaxar', 'casa', 1200, 1600], ['jardim-luzes', 'Jardim à noite', 'noite', 1200, 1600],
];
const byName = new Map(PHOTOS.map((p, i) => [p[0], i]));
const masonry = $('#masonry');
masonry.innerHTML = PHOTOS.map(([n, cap, cat, w, h], i) => `<button type="button" data-i="${i}" data-cat="${cat}" data-cap="${cap}" aria-label="Ampliar foto: ${cap}"><img src="assets/thumb/${n}.webp" width="${w}" height="${h}" alt="${cap}" loading="lazy"></button>`).join('');
const tiles = $$('button', masonry);
const tileIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.style.transitionDelay = Math.random() * 0.25 + 's'; en.target.classList.add('is-in'); tileIO.unobserve(en.target); } });
}, { rootMargin: '0px 0px -4% 0px' });
tiles.forEach((t) => tileIO.observe(t));

let visibleList = PHOTOS.map((_, i) => i);
$$('.filters button').forEach((b) => b.addEventListener('click', () => {
  $$('.filters button').forEach((x) => x.classList.toggle('is-active', x === b));
  const f = b.dataset.filter;
  visibleList = [];
  tiles.forEach((t, i) => {
    const show = f === 'all' || t.dataset.cat === f;
    t.classList.toggle('is-out', !show);
    if (show) { visibleList.push(i); t.classList.remove('is-in'); t.style.transitionDelay = Math.min(visibleList.length, 12) * 0.04 + 's'; requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-in'))); }
  });
}));

const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
let lbList = [], lbPos = 0, lbFocus = null;
const lbShow = () => {
  const [n, cap] = PHOTOS[lbList[lbPos]];
  lbImg.classList.remove('is-ready');
  const src = `assets/img/${n}.webp`, pre = new Image();
  pre.onload = () => { if (PHOTOS[lbList[lbPos]][0] !== n) return; lbImg.src = src; lbImg.alt = cap; lbCap.textContent = `${cap} · ${lbPos + 1}/${lbList.length}`; requestAnimationFrame(() => lbImg.classList.add('is-ready')); };
  pre.src = src;
};
const lbOpen = (list, pos) => { lbList = list; lbPos = pos; lbFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; requestAnimationFrame(() => lb.classList.add('is-open')); lbShow(); $('.lightbox__close').focus(); };
const lbClose = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 400); lbFocus && lbFocus.focus(); };
const lbStep = (d) => { lbPos = (lbPos + d + lbList.length) % lbList.length; lbShow(); };
masonry.addEventListener('click', (e) => { const t = e.target.closest('button'); if (t) lbOpen(visibleList.slice(), visibleList.indexOf(+t.dataset.i)); });
$$('[data-lb]').forEach((el) => el.addEventListener('click', () => { if (rMoved > 6) return; const i = byName.get(el.dataset.lb); if (i != null) lbOpen(PHOTOS.map((_, k) => k), i); }));
$('.lightbox__close').addEventListener('click', lbClose);
$('.lightbox__nav--prev').addEventListener('click', () => lbStep(-1));
$('.lightbox__nav--next').addEventListener('click', () => lbStep(1));
lb.addEventListener('click', (e) => { if (e.target === lb || e.target.tagName === 'FIGURE') lbClose(); });
addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowLeft') lbStep(-1); if (e.key === 'ArrowRight') lbStep(1); });
let tx = 0;
lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); }, { passive: true });
