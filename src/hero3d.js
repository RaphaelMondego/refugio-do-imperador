// Maquete 3D do sítio para o hero. Empacotado com esbuild em assets/js/hero3d.js
import * as THREE from 'three';

const C = {
  grass: 0x86b56b, plinth: 0xefe6d3, wall: 0xf3c53c, trim: 0xfff6e2, base: 0xd8ccb6,
  roof: 0xb9553b, wood: 0x6b4226, deck: 0x9a6a43, stone: 0xdcc9a0, tile: 0xeaf6f8,
  water: 0x45c4e6, path: 0xbdb5a5, field: 0x4fa85a, fence: 0x2f7d4f, white: 0xfbfaf6,
  chair: 0x2e3236, brick: 0xa9553c, umbrella: 0xd9c3a0, playRoof: 0x3f8f4d, slide: 0x3fa35a,
};

const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;

export function initHero({ canvas, labelsEl, hero, reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 600);
  const world = new THREE.Group();
  scene.add(world);

  // ---------- materiais ----------
  const cache = new Map();
  const mat = (color, o) => {
    if (o) return new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...o });
    if (!cache.has(color)) cache.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true }));
    return cache.get(color);
  };
  const M = {
    grass: mat(C.plinth, { roughness: 1 }),
    glass: mat(0x4a3320, { emissive: 0xffc56b, emissiveIntensity: 0 }),
    water: mat(C.water, { roughness: 0.15, emissive: 0x1a8fb0, emissiveIntensity: 0.15 }),
    spa: mat(0x8fe3f2, { roughness: 0.15, emissive: 0x2ff0ff, emissiveIntensity: 0.1 }),
    bulb: mat(0xfff1c9, { emissive: 0xffc56b, emissiveIntensity: 0.3 }),
    roof: mat(C.roof, { side: THREE.DoubleSide }),
    fence: new THREE.MeshStandardMaterial({ color: C.fence, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    flame: new THREE.MeshBasicMaterial({ color: 0xffa23a }),
    flameCore: new THREE.MeshBasicMaterial({ color: 0xffe08a }),
    cloud: mat(0xffffff, { transparent: true, opacity: 0.95, roughness: 1 }),
  };

  // ---------- helpers de geometria ----------
  const shadow = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => {
    const mesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === 'number' ? mat(m) : m));
    mesh.position.set(x, y + h / 2, z);
    return mesh;
  };
  const cyl = (rt, rb, h, seg, m, x = 0, y = 0, z = 0) => {
    const mesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof m === 'number' ? mat(m) : m));
    mesh.position.set(x, y + h / 2, z);
    return mesh;
  };
  const hipRoof = (w, d, h) => {
    const rl = Math.max(0, (w - d) / 2), a = w / 2, b = d / 2;
    const A = [-a, 0, -b], B = [a, 0, -b], Cc = [a, 0, b], D = [-a, 0, b], R1 = [-rl, h, 0], R2 = [rl, h, 0];
    const v = [D, Cc, R2, D, R2, R1, B, A, R1, B, R1, R2, Cc, B, R2, A, D, R1].flat();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    const grp = new THREE.Group();
    grp.add(shadow(new THREE.Mesh(g, M.roof)));
    grp.add(box(w, 0.14, d, 0x8f3f2c, 0, -0.14, 0));
    return grp;
  };
  const archShape = (w, h) => {
    const s = new THREE.Shape(), r = w / 2;
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
    return s;
  };
  const trimGeo = {}, glassGeo = {};
  const archWindow = (w, h, x, y, z, ry = 0) => {
    const k = w + '_' + h;
    trimGeo[k] = trimGeo[k] || new THREE.ShapeGeometry(archShape(w + 0.3, h + 0.15), 8);
    glassGeo[k] = glassGeo[k] || new THREE.ShapeGeometry(archShape(w, h), 8);
    const g = new THREE.Group();
    const t = new THREE.Mesh(trimGeo[k], mat(C.trim)); t.position.set(0, -0.08, 0.02);
    const gl = new THREE.Mesh(glassGeo[k], M.glass); gl.position.z = 0.04;
    g.add(t, gl); g.position.set(x, y, z); g.rotation.y = ry;
    return g;
  };

  // ---------- peças animadas ----------
  const pieces = [], drops = [];
  const piece = (g, x, z, delay) => { g.position.set(x, 0, z); g.scale.setScalar(0.0001); pieces.push({ g, delay }); world.add(g); return g; };
  const drop = (obj, delay) => { drops.push({ obj, y: obj.position.y, delay }); obj.position.y += 14; obj.visible = false; return obj; };

  // base da maquete
  const plinth = cyl(26.4, 27, 1.7, 72, C.plinth, 0, -2, 0);
  plinth.castShadow = false;
  world.add(plinth);
  const ground = cyl(26, 26, 0.3, 72, M.grass, 0, -0.3, 0);
  ground.castShadow = false;
  world.add(ground);

  // grade de "planta baixa" que some conforme a maquete é construída
  const gridPts = [];
  for (let i = -24; i <= 24; i += 3) {
    const l = Math.sqrt(25.5 * 25.5 - i * i);
    gridPts.push(i, 0.02, -l, i, 0.02, l, -l, 0.02, i, l, 0.02, i);
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
  const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0xc9a24a, transparent: true, opacity: 0.7 }));
  world.add(grid);

  // caminho de pedra
  { const g = new THREE.Group();
    for (let i = 0; i < 12; i++) g.add(box(2.3, 0.08, 1.75, C.path, (i % 2) * 0.12, 0, i * 2.02));
    piece(g, -5, -2.4, 0.15); }

  // casa principal + ala
  { const g = new THREE.Group();
    g.add(box(15, 0.45, 8, C.base), box(14.6, 3.2, 7.6, C.wall));
    g.add(box(6, 0.45, 9, C.base, -4.5, 0, 8.5), box(5.6, 3.0, 8.6, C.wall, -4.5, 0, 8.5));
    const r1 = hipRoof(16.2, 9.2, 2.4); r1.position.y = 3.2; g.add(drop(r1, 0.75));
    const r2 = hipRoof(10.4, 7.2, 2.0); r2.rotation.y = Math.PI / 2; r2.position.set(-4.5, 3.0, 8.3); g.add(drop(r2, 0.95));
    g.add(drop(box(0.8, 1.3, 0.8, C.brick, 3.5, 4.3, -1), 1.2));
    // frente
    g.add(archWindow(1.5, 2.5, 0.6, 0.45, 3.8), archWindow(1.3, 1.6, 3.3, 1.1, 3.8), archWindow(1.3, 1.6, 5.8, 1.1, 3.8));
    g.add(archWindow(1.3, 1.6, -4.5, 1.1, 12.8));
    // laterais
    g.add(archWindow(1.3, 1.6, 7.3, 1.1, -1.6, Math.PI / 2), archWindow(1.3, 1.6, 7.3, 1.1, 1.6, Math.PI / 2));
    g.add(archWindow(1.3, 1.6, -1.7, 1.1, 6.6, Math.PI / 2), archWindow(1.3, 1.6, -1.7, 1.1, 10.2, Math.PI / 2));
    [-5.5, -1.5, 2.5, 5.5].forEach((x) => g.add(archWindow(1.2, 1.5, x, 1.1, -3.8, Math.PI)));
    [-1.5, 2.5, 6.5, 10.5].forEach((z) => g.add(archWindow(1.2, 1.5, -7.3, 1.1, z, -Math.PI / 2)));
    piece(g, -9, -7, 0.3); }

  // espaço gourmet
  { const g = new THREE.Group();
    g.add(box(6, 2.7, 3.4, C.wall), box(4.2, 1.0, 0.5, C.wood, 0, 0, 1.9), box(4.4, 0.12, 0.8, 0x3a3a3a, 0, 1.0, 1.95));
    const r = hipRoof(7.2, 5.2, 1.5); r.position.y = 2.7; g.add(drop(r, 1.15));
    g.add(drop(box(0.9, 1.6, 0.9, C.brick, -1.8, 3.0, -0.4), 1.4));
    piece(g, 16, -4.6, 0.55); }

  // campo de futebol
  { const g = new THREE.Group();
    g.add(box(13, 0.1, 8, C.field));
    g.add(box(0.1, 0.02, 8, C.white, 0, 0.1, 0), box(12.6, 0.02, 0.1, C.white, 0, 0.1, 3.8), box(12.6, 0.02, 0.1, C.white, 0, 0.1, -3.8),
      box(0.1, 0.02, 7.7, C.white, 6.3, 0.1, 0), box(0.1, 0.02, 7.7, C.white, -6.3, 0.1, 0));
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.2, 24), mat(C.white)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.13; g.add(ring);
    [-1, 1].forEach((s) => g.add(box(0.1, 1.3, 0.1, C.white, s * 6.1, 0, -1.2), box(0.1, 1.3, 0.1, C.white, s * 6.1, 0, 1.2), box(0.1, 0.1, 2.5, C.white, s * 6.1, 1.3, 0)));
    [[13.2, 0.05, 0, 4.1], [13.2, 0.05, 0, -4.1], [0.05, 8.2, 6.6, 0], [0.05, 8.2, -6.6, 0]].forEach(([w, d, x, z]) => {
      g.add(box(w, 0.7, d || 0.05, C.fence, x, 0, z));
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, 2.6, d), M.fence); f.position.set(x, 2.0, z); g.add(f);
    });
    [[6.6, 4.1], [-6.6, 4.1], [6.6, -4.1], [-6.6, -4.1], [0, 4.1], [0, -4.1]].forEach(([x, z]) => g.add(box(0.14, 3.3, 0.14, C.fence, x, 0, z)));
    piece(g, 11.5, -11.5, 0.7); }

  // piscina
  { const g = new THREE.Group();
    g.add(box(11, 0.3, 13.5, C.stone), box(5.7, 0.34, 10.7, C.tile, 1, 0, 0.3), box(5, 0.37, 10, M.water, 1, 0, 0.3));
    g.add(box(11, 1.1, 0.35, C.brick, 0, 0.3, -6.6));
    [[-3.6, -2], [-3.6, 1]].forEach(([x, z]) => { const c = box(0.8, 0.12, 2, C.chair, x, 0.55, z); const b = box(0.8, 0.12, 0.9, C.chair, x, 0.8, z - 1.3); b.rotation.x = 0.8; g.add(c, b); });
    piece(g, 14, 5.25, 0.85); }

  // jacuzzi no deck
  { const g = new THREE.Group();
    g.add(box(5.6, 0.6, 5, C.deck));
    for (let i = -2; i <= 2; i++) g.add(box(5.6, 0.02, 0.05, 0x7a5233, 0, 0.6, i));
    const tub = cyl(1.75, 1.75, 0.5, 8, C.white, 0.5, 0.6, 0.2); tub.rotation.y = Math.PI / 8;
    const wtr = cyl(1.35, 1.35, 0.52, 8, M.spa, 0.5, 0.6, 0.2); wtr.rotation.y = Math.PI / 8;
    g.add(tub, wtr, cyl(0.06, 0.06, 3.4, 6, C.chair, -1.9, 0.6, -1.6));
    const um = cyl(0.05, 2.5, 0.7, 8, mat(C.umbrella, { side: THREE.DoubleSide }), -0.6, 3.5, -0.6); g.add(drop(um, 1.6));
    piece(g, 11.5, 15.3, 1.0); }

  // coreto
  { const g = new THREE.Group();
    g.add(cyl(2.7, 2.8, 0.35, 24, C.white));
    [[1.7, 1.7], [-1.7, 1.7], [1.7, -1.7], [-1.7, -1.7]].forEach(([x, z]) => g.add(box(0.2, 2.8, 0.2, C.wood, x, 0.35, z)));
    const roof = shadow(new THREE.Mesh(new THREE.ConeGeometry(3.5, 1.9, 4), M.roof)); roof.rotation.y = Math.PI / 4; roof.position.y = 3.15 + 0.95; g.add(drop(roof, 1.5));
    g.add(cyl(0.9, 0.9, 0.08, 16, C.white, 0, 1.1, 0), cyl(0.12, 0.25, 0.75, 8, C.white, 0, 0.35, 0));
    piece(g, 2, -1, 1.1); }

  // chafariz
  { const g = new THREE.Group();
    g.add(cyl(1.9, 2.0, 0.55, 12, 0x5a9a78), cyl(1.65, 1.65, 0.57, 12, M.water), cyl(0.18, 0.25, 1.3, 8, 0x8a8f86, 0, 0.5, 0),
      cyl(0.85, 0.2, 0.22, 10, 0x8a8f86, 0, 1.25, 0), cyl(0.14, 0.16, 0.7, 8, 0x8a8f86, 0, 1.45, 0), cyl(0.45, 0.1, 0.16, 10, 0x8a8f86, 0, 1.95, 0));
    piece(g, 5.6, 6.6, 1.25); }

  // playground
  { const g = new THREE.Group();
    [[0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]].forEach(([x, z]) => g.add(box(0.16, 2.9, 0.16, C.wood, x, 0, z)));
    g.add(box(1.9, 0.14, 1.9, C.wood, 0, 1.3, 0));
    const roof = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.0, 4), mat(C.playRoof))); roof.rotation.y = Math.PI / 4; roof.position.y = 3.4; g.add(roof);
    const slide = box(0.8, 0.1, 2.6, C.slide, 0, 0.62, 2.0); slide.rotation.x = 0.55; g.add(slide);
    const ramp = box(1.0, 0.1, 2.0, 0xd9642f, -1.6, 0.62, 0); ramp.rotation.z = -0.75; g.add(ramp);
    g.add(box(0.1, 1.8, 0.1, C.wood, 2.6, 0, -0.6), box(0.1, 1.8, 0.1, C.wood, 2.6, 0, 0.6), box(0.1, 0.1, 1.4, C.wood, 2.6, 1.8, 0), box(0.5, 0.06, 0.25, 0xd9642f, 2.6, 0.5, 0));
    piece(g, -11.5, 12.2, 1.35); }

  // fogueira com cadeiras e varal de luzes
  const firePos = new THREE.Vector3(0.5, 0, 15.5);
  const flames = [];
  { const g = new THREE.Group();
    g.add(cyl(0.85, 0.6, 0.4, 12, 0x33302d, 0, 0.15, 0));
    [[0, 0.9, 1], [0.22, 0.6, 0.7], [-0.2, 0.55, 0.6]].forEach(([x, h, s], i) => {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.3 * s, h, 6), i ? M.flame : M.flameCore); f.position.set(x, 0.55 + h / 2, i ? 0.12 : 0); flames.push(f); g.add(f);
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, c = new THREE.Group();
      const back = box(0.75, 1.0, 0.1, C.chair, 0, 0.3, -0.42); back.rotation.x = -0.3;
      c.add(box(0.75, 0.1, 0.8, C.chair, 0, 0.38, 0), back, box(0.75, 0.38, 0.08, C.chair, 0, 0, 0.36));
      c.position.set(Math.sin(a) * 2.5, 0, Math.cos(a) * 2.5); c.rotation.y = a + Math.PI; g.add(c);
    }
    piece(g, firePos.x, firePos.z, 1.5); }

  // varais de luz
  const stringLights = (pts, h, delay) => {
    const g = new THREE.Group(), bulbGeo = new THREE.SphereGeometry(0.11, 6, 5), line = [];
    pts.forEach(([x, z]) => g.add(box(0.1, h, 0.1, C.chair, x, 0, z)));
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[i + 1], n = Math.round(Math.hypot(x2 - x1, z2 - z1) / 0.9);
      for (let j = 0; j <= n; j++) {
        const t = j / n, y = h - Math.sin(t * Math.PI) * 0.55;
        line.push(lerp(x1, x2, t), y, lerp(z1, z2, t));
        if (j > 0 && j < n) { const b = new THREE.Mesh(bulbGeo, M.bulb); b.position.set(lerp(x1, x2, t), y - 0.12, lerp(z1, z2, t)); g.add(b); }
      }
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(line, 3));
    g.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x2e3236 })));
    piece(g, 0, 0, delay);
  };
  stringLights([[-3.3, 12], [4.3, 12], [4.3, 19.2], [-3.3, 19.2], [-3.3, 12]], 3.1, 1.9);
  stringLights([[8.7, 12.3], [8.7, -1.2], [19.3, -1.2], [19.3, 12.3]], 3.3, 2.0);

  // árvores
  const blocked = [[-9, -7, 10.5], [-13.5, 1.5, 6.5], [11.5, -11.5, 9], [14, 5, 9], [11.5, 15.3, 5], [0.5, 15.5, 5], [-11.5, 12.2, 4], [16, -4.6, 5], [-5, 12, 3.2], [-5, 20, 3.2], [7, 21, 5], [17, 16, 5]];
  const greens = [0x3f7d4a, 0x4f9157, 0x2f6b45, 0x64a05a];
  const tree = (x, z, s, delay) => {
    const g = new THREE.Group();
    g.add(cyl(0.16 * s, 0.24 * s, 1.5 * s, 6, C.wood));
    const f1 = shadow(new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * s, 0), mat(greens[(Math.abs(x * 7 + z * 3) | 0) % 4]))); f1.position.y = 2.2 * s; f1.rotation.set(x, z, 0);
    const f2 = shadow(new THREE.Mesh(new THREE.IcosahedronGeometry(0.85 * s, 0), mat(greens[(Math.abs(x * 3 + z * 5) | 0) % 4]))); f2.position.set(0.3 * s, 3.3 * s, 0.1 * s); f2.rotation.set(z, x, 0);
    g.add(f1, f2);
    piece(g, x, z, delay);
  };
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2 + rnd() * 0.08, r = 21.6 + rnd() * 2.6, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br)) continue;
    tree(x, z, 0.85 + rnd() * 0.75, 1.3 + rnd() * 1.0);
  }
  [[1.6, -13.5, 1.3], [7.6, -5.2, 1.0], [-1.5, 6, 0.9], [-17, 16, 1.1], [6.5, 11.5, 0.8]].forEach(([x, z, s], i) => tree(x, z, s, 1.6 + i * 0.1));

  // nuvens
  const clouds = [];
  [[-16, 17, -8, 1.2], [14, 20, -14, 1.5], [2, 22, 6, 1.0], [24, 16, 8, 0.9]].forEach(([x, y, z, s]) => {
    const g = new THREE.Group();
    [[0, 0, 0, 1.6], [1.6, -0.2, 0.2, 1.2], [-1.6, -0.25, -0.1, 1.1], [0.6, 0.5, -0.3, 1.1]].forEach(([cx, cy, cz, r]) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M.cloud); m.position.set(cx, cy, cz); g.add(m);
    });
    g.position.set(x, y, z); g.scale.setScalar(0.0001); g.userData = { x, s, sp: 0.25 + rnd() * 0.3 };
    scene.add(g); clouds.push(g);
  });

  // estrelas e vagalumes
  const starPos = [];
  for (let i = 0; i < 500; i++) {
    const u = rnd() * Math.PI * 2, v = Math.acos(rnd() * 1.2 - 0.2), r = 230;
    starPos.push(r * Math.sin(v) * Math.cos(u), r * Math.cos(v) + 20, -Math.abs(r * Math.sin(v) * Math.sin(u)) - 20);
  }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfff4d6, size: 1.6, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false }));
  scene.add(stars);

  const flyN = 46, flyBase = [], flyArr = new Float32Array(flyN * 3);
  for (let i = 0; i < flyN; i++) { const a = rnd() * Math.PI * 2, r = 4 + rnd() * 20; flyBase.push([Math.cos(a) * r, 1 + rnd() * 4.5, Math.sin(a) * r, rnd() * 6.28, 0.4 + rnd() * 0.8]); }
  const flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flyArr, 3));
  const flies = new THREE.Points(flyGeo, new THREE.PointsMaterial({ color: 0xe8ff8a, size: 0.38, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  world.add(flies);

  // ---------- luzes ----------
  const hemi = new THREE.HemisphereLight(0xfff6e0, 0x8aa27a, 1.15);
  const sun = new THREE.DirectionalLight(0xfff0d2, 2.7);
  sun.position.set(-26, 42, 24); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 130 });
  const moon = new THREE.DirectionalLight(0x8fb2ff, 0);
  moon.position.set(22, 36, -12);
  scene.add(hemi, sun, moon);
  const pLight = (color, x, y, z, dist) => { const l = new THREE.PointLight(color, 0, dist, 1.6); l.position.set(x, y, z); world.add(l); return l; };
  const fireL = pLight(0xff8a3a, firePos.x, 1.6, firePos.z, 22);
  const poolL = pLight(0xff3fd2, 15, 2.2, 5.5, 26);
  const spaL = pLight(0x3ff0ff, 12, 2.4, 15.5, 12);
  const homeL = pLight(0xffc56b, -4, 2.2, -1.5, 20);
  const dayCol = { hemiSky: new THREE.Color(0xfff6e0), hemiGr: new THREE.Color(0x8aa27a), water: new THREE.Color(C.water), wE: new THREE.Color(0x1a8fb0) };
  const nightCol = { hemiSky: new THREE.Color(0x35508c), hemiGr: new THREE.Color(0x16241c), water: new THREE.Color(0x9b3cff), wE: new THREE.Color(0xff2fd0) };
  const grassFrom = new THREE.Color(C.plinth), grassTo = new THREE.Color(C.grass);

  // ---------- rótulos ----------
  const labelDefs = [
    ['A casa', 'a-casa', -9, 6.4, -7], ['Piscina', 'exp-piscina', 15, 1.6, 5.5], ['Jacuzzi', 'exp-piscina', 12, 4.6, 15.5],
    ['Campo', 'exp-campo', 11.5, 3.6, -11.5], ['Fogueira', 'exp-fogueira', 0.5, 3.6, 15.5], ['Espaço gourmet', 'exp-gourmet', 16, 5, -4.6],
    ['Playground', 'exp-campo', -11.5, 4.3, 12.2],
  ];
  const labels = labelDefs.map(([text, target, x, y, z]) => {
    const el = document.createElement('a');
    el.className = 'hero-label'; el.href = '#' + target;
    el.innerHTML = '<i></i><span>' + text + '</span>';
    labelsEl.appendChild(el);
    return { el, v: new THREE.Vector3(x, y, z) };
  });

  // ---------- estado ----------
  let W = 1, H = 1, dist = 90, wide = true;
  let night = 0, nightTarget = 0;
  let userYaw = 0, vel = 0, dragging = false, lastX = 0;
  let px = 0, py = 0, spx = 0, spy = 0, scrollP = 0;
  let running = false, visible = true, started = false, t0 = 0, raf = 0;
  const baseYaw = -0.62, target = new THREE.Vector3(0, 2.2, 0), tmp = new THREE.Vector3();

  const resize = () => {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    wide = W >= 960;
    const fx = wide ? 0.56 : 0.96, fy = wide ? 0.78 : 0.46, aspect = W / H, k = 2 * Math.tan((camera.fov * Math.PI) / 360);
    dist = Math.max(60 / (k * aspect * fx), 37 / (k * fy));
    camera.aspect = aspect;
    if (wide) camera.setViewOffset(W, H, -W * 0.21, -H * 0.03, W, H); else camera.setViewOffset(W, H, 0, -H * 0.235, W, H);
    camera.updateProjectionMatrix();
  };

  const frame = (now) => {
    raf = 0;
    if (!running) return;
    const time = now / 1000, t = started ? time - t0 : 0;

    // construção
    for (const p of pieces) { const k = clamp01((t - p.delay) / 0.9); p.g.scale.setScalar(Math.max(0.0001, easeOutBack(k))); }
    for (const d of drops) { const k = clamp01((t - d.delay) / 0.8); d.obj.visible = k > 0; d.obj.position.y = d.y + (1 - easeOutCubic(k)) * 14; }
    const gk = clamp01(t / 1.6);
    M.grass.color.copy(grassFrom).lerp(grassTo, easeOutCubic(gk));
    grid.material.opacity = 0.7 * (1 - clamp01((t - 1.2) / 2));
    grid.visible = grid.material.opacity > 0.01;
    clouds.forEach((c, i) => {
      const k = clamp01((t - 2 - i * 0.15) / 1.2);
      c.scale.setScalar(Math.max(0.0001, easeOutCubic(k) * c.userData.s * (1 - night * 0.999)));
      c.position.x = c.userData.x + Math.sin(time * 0.05 * c.userData.sp + i) * 6;
    });

    // dia / noite
    night += (nightTarget - night) * 0.045;
    const n = night;
    sun.intensity = lerp(2.7, 0, n); moon.intensity = lerp(0, 0.75, n);
    hemi.intensity = lerp(1.15, 0.42, n);
    hemi.color.copy(dayCol.hemiSky).lerp(nightCol.hemiSky, n); hemi.groundColor.copy(dayCol.hemiGr).lerp(nightCol.hemiGr, n);
    renderer.toneMappingExposure = lerp(1.0, 1.15, n);
    M.glass.emissiveIntensity = n * 1.7;
    M.bulb.emissiveIntensity = 0.3 + n * 3.2;
    M.water.color.copy(dayCol.water).lerp(nightCol.water, n); M.water.emissive.copy(dayCol.wE).lerp(nightCol.wE, n);
    M.water.emissiveIntensity = lerp(0.15, 0.9, n) + Math.sin(time * 1.3) * 0.04;
    M.spa.emissiveIntensity = lerp(0.1, 1.3, n);
    const flick = 0.82 + Math.sin(time * 11) * 0.09 + Math.sin(time * 23.7) * 0.07;
    fireL.intensity = (6 + n * 70) * flick;
    poolL.intensity = n * 95; spaL.intensity = n * 30; homeL.intensity = n * 34;
    flames.forEach((f, i) => { f.scale.y = 0.85 + Math.sin(time * (9 + i * 3) + i) * 0.22; });
    stars.material.opacity = n * (0.75 + Math.sin(time * 0.8) * 0.1);
    flies.material.opacity = n * 0.95;
    if (n > 0.02) {
      for (let i = 0; i < flyN; i++) { const b = flyBase[i]; flyArr[i * 3] = b[0] + Math.sin(time * b[4] + b[3]) * 1.4; flyArr[i * 3 + 1] = b[1] + Math.sin(time * b[4] * 1.7 + b[3]) * 0.8; flyArr[i * 3 + 2] = b[2] + Math.cos(time * b[4] * 0.8 + b[3]) * 1.4; }
      flyGeo.attributes.position.needsUpdate = true;
    }

    // câmera
    if (!dragging) { userYaw += vel; vel *= 0.94; }
    spx += (px - spx) * 0.05; spy += (py - spy) * 0.05;
    const intro = easeOutCubic(clamp01(t / 2.6));
    const sway = reducedMotion ? 0 : Math.sin(time * 0.16) * 0.2;
    world.rotation.y = baseYaw + userYaw + sway + spx * 0.14 + (1 - intro) * -1.1 + scrollP * 0.7;
    const el = 0.5 + spy * 0.05 + (1 - intro) * 0.35 + scrollP * 0.22;
    const d = dist * (1 + (1 - intro) * 0.25 - scrollP * 0.12);
    camera.position.set(0, target.y + d * Math.sin(el), d * Math.cos(el));
    camera.lookAt(target);

    renderer.render(scene, camera);

    // rótulos
    const lk = wide ? clamp01((t - 2.7) / 0.8) * (1 - clamp01(scrollP * 3)) : 0;
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      tmp.copy(l.v).applyMatrix4(world.matrixWorld).project(camera);
      l.el.style.transform = 'translate3d(' + ((tmp.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-tmp.y * 0.5 + 0.5) * H).toFixed(1) + 'px,0)';
      l.el.style.opacity = lk.toFixed(2);
      l.el.style.pointerEvents = lk > 0.5 ? 'auto' : 'none';
    }
    raf = requestAnimationFrame(frame);
  };
  const play = () => { const should = visible && !document.hidden; if (should && !running) { running = true; if (!raf) raf = requestAnimationFrame(frame); } else if (!should) running = false; };

  // ---------- interação ----------
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * 0.006; userYaw += vel; });
  const end = () => { dragging = false; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; px = (e.clientX / window.innerWidth) * 2 - 1; py = (e.clientY / window.innerHeight) * 2 - 1; }, { passive: true });
  window.addEventListener('scroll', () => { scrollP = clamp01(window.scrollY / Math.max(1, H)); }, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', play);
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; play(); }).observe(hero);

  resize();
  play();

  return {
    start(skip) { started = true; t0 = performance.now() / 1000 - (reducedMotion || skip ? 10 : 0); },
    setNight(v, instant) { nightTarget = v ? 1 : 0; if (instant) night = nightTarget; },
  };
}
