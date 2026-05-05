/**
 * bg3d.js  ·  Heaven Bhattu Portfolio v6
 * ═══════════════════════════════════════════════════════
 *  LIGHTWEIGHT but spectacular — orange / ember palette
 *
 *  LAYERS:
 *   1. Star field            — 1 400 pts  (low count)
 *   2. Ember nebula particles — 400 pts   (orange/gold)
 *   3. Floating icosahedra   — 5 wireframe polyhedra
 *      morphing between sphere ↔ icosahedron vertices
 *   4. Central torus knot    — 1 wireframe (low seg)
 *   5. Wave grid             — 40×40 ripple plane
 *   6. Glow orbs             — 4 colour spheres
 *   7. Mouse parallax camera
 *
 *  Performance: ~60fps on mid-range laptops
 * ═══════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── RENDERER ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); /* cap for perf */
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 800);
  camera.position.set(0, 0, 46);

  /* shared orange palette for vertex colours */
  const PAL = [
    [1.00, 0.42, 0.00],   // #ff6b00 orange
    [1.00, 0.70, 0.28],   // #ffb347 gold
    [1.00, 0.27, 0.00],   // #ff4500 ember
    [1.00, 0.55, 0.15],   // #ff8c25 amber
    [1.00, 0.87, 0.67],   // #ffde aa cream
  ];

  /* ═══════════════════════════
     1. STAR FIELD  (1 400 pts)
  ══════════════════════════ */
  ;(function () {
    const N = 1400, pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 480;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo,
      new THREE.PointsMaterial({ color: 0xfff8f0, size: 0.14, transparent: true, opacity: 0.45 })
    ));
  })();

  /* ═══════════════════════════
     2. EMBER NEBULA  (400 pts)
  ══════════════════════════ */
  const nebula = (function () {
    const N = 400, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const arm = i % 3;
      const r   = 10 + Math.random() * 38;
      const th  = arm * (Math.PI * 2 / 3) + Math.random() * 0.9;
      const sp  = th + r * 0.044;
      pos[i*3]   = Math.cos(sp) * r + (Math.random()-.5)*7;
      pos[i*3+1] = (Math.random()-.5)*18;
      pos[i*3+2] = Math.sin(sp) * r + (Math.random()-.5)*7;
      const c = PAL[Math.floor(Math.random() * PAL.length)];
      col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo,
      new THREE.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, opacity: 0.75 })
    );
    scene.add(pts);
    return pts;
  })();

  /* ═══════════════════════════
     3. MORPHING ICOSAHEDRA  (5)
     Each morphs between icosahedron
     and sphere vertex positions —
     the "split open" 3-D morph effect
  ══════════════════════════ */
  const ICOS = (function () {
    const items = [];
    const cfgs = [
      [ 18,  8,-12, 3.0, 0xff6b00, .60, 0.0],
      [ -5, 16, -8, 2.2, 0xffb347, .80, 1.1],
      [ 10,-14, -6, 1.9, 0xff4500, 1.0, 2.2],
      [-17, -6,-14, 2.6, 0xffa333, .70, 0.7],
      [  0, 18,-18, 2.0, 0xffcf80, .55, 3.0],
    ];

    cfgs.forEach(([x,y,z,r,col,spd,phase]) => {
      const icoGeo = new THREE.IcosahedronGeometry(r, 1);
      const sphGeo = new THREE.SphereGeometry(r, 8, 6);

      const geo = icoGeo.clone();
      const mat = new THREE.MeshBasicMaterial({
        color: col, wireframe: true, transparent: true, opacity: 0.26
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      scene.add(mesh);

      const icoP = icoGeo.attributes.position.array.slice();
      const sphP = sphGeo.attributes.position.array;
      const n    = Math.min(icoP.length, sphP.length);
      items.push({ mesh, icoP, sphP, n, spd, phase });
    });
    return items;
  })();

  /* ═══════════════════════════
     4. TORUS KNOT  (lightweight)
  ══════════════════════════ */
  const knot = (function () {
    const m = new THREE.Mesh(
      new THREE.TorusKnotGeometry(5.5, 1.6, 90, 10, 3, 5),
      new THREE.MeshBasicMaterial({ color: 0xff8c25, wireframe: true, transparent: true, opacity: 0.17 })
    );
    m.position.set(22, 5, -17);
    scene.add(m);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(7.5, 0.06, 6, 60),
      new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: 0.24 })
    );
    halo.position.copy(m.position);
    scene.add(halo);
    return { m, halo };
  })();

  /* ═══════════════════════════
     5. WAVE GRID  (40×40, perf safe)
  ══════════════════════════ */
  const wave = (function () {
    const G = 40;
    const pos = new Float32Array((G+1)*(G+1)*3);
    let wi = 0;
    for (let y = 0; y <= G; y++) for (let x = 0; x <= G; x++) {
      pos[wi++] = (x/G - 0.5)*90;
      pos[wi++] = -18;
      pos[wi++] = (y/G - 0.5)*90;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const idx = [];
    for (let y = 0; y <= G; y++) for (let x = 0; x <= G; x++) {
      const i = y*(G+1)+x;
      if (x < G) idx.push(i, i+1);
      if (y < G) idx.push(i, i+(G+1));
    }
    geo.setIndex(idx);
    scene.add(new THREE.LineSegments(geo,
      new THREE.LineBasicMaterial({ color: 0xff6b00, transparent: true, opacity: 0.08 })
    ));
    return { geo, G };
  })();

  /* ═══════════════════════════
     6. GLOW ORBS  (4)
  ══════════════════════════ */
  const orbs = [
    [14,-8, 2,  1.4, 0xff6b00, .80],
    [-18,10,-5, 1.0, 0xffb347, 1.10],
    [6,  14,-10,.8,  0xff4500, .65],
    [-8,-14,3,  .6,  0xffa333, 1.30],
  ].map(([x,y,z,r,col,spd]) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 10),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5 })
    );
    m.position.set(x,y,z);
    scene.add(m);
    return { m, ox:x, oy:y, spd };
  });

  /* ── MOUSE PARALLAX ── */
  let mx=0, my=0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX/window.innerWidth  - 0.5)*2;
    my = (e.clientY/window.innerHeight - 0.5)*2;
  });

  /* ── ANIMATION LOOP ── */
  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.007;

    /* nebula slow drift */
    nebula.rotation.y = t * 0.016;

    /* torus knot */
    knot.m.rotation.x = t * .16;
    knot.m.rotation.y = t * .10;
    knot.halo.rotation.x = t * .07;
    knot.halo.rotation.z = t * .12;

    /* morphing icosahedra */
    ICOS.forEach(({ mesh, icoP, sphP, n, spd, phase }) => {
      const a   = (Math.sin(t * spd + phase) + 1) * .5;
      const pos = mesh.geometry.attributes.position;
      for (let i = 0; i < n; i++)
        pos.array[i] = icoP[i] + (sphP[i] - icoP[i]) * a;
      pos.needsUpdate = true;
      mesh.rotation.x = t * spd * .28;
      mesh.rotation.y = t * spd * .46;
      mesh.material.opacity = .14 + a * .14;
    });

    /* wave grid ripple */
    const wp = wave.geo.attributes.position, G = wave.G;
    for (let y=0; y<=G; y++) for (let x=0; x<=G; x++) {
      const i = (y*(G+1)+x)*3;
      wp.array[i+1] = -18
        + Math.sin(wp.array[i  ] * .09 + t * .8) * 1.6
        + Math.cos(wp.array[i+2] * .07 + t * .55) * 1.3;
    }
    wp.needsUpdate = true;

    /* orbs float */
    orbs.forEach(o => {
      o.m.position.y = o.oy + Math.sin(t * o.spd) * 1.8;
      o.m.position.x = o.ox + Math.cos(t * o.spd * .7) * .8;
      o.m.material.opacity = .35 + Math.sin(t * o.spd * 1.2) * .18;
    });

    /* camera parallax */
    camera.position.x += (mx * 3.5 - camera.position.x) * .032;
    camera.position.y += (-my * 2.2 - camera.position.y) * .032;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  })();

  /* ── RESIZE ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();