/**
 * main.js  ·  Heaven Bhattu Portfolio v6
 * ════════════════════════════════════════════════════════
 *  • Dark / Light theme toggle
 *  • Custom cursor  (ring + dot + spark trail)
 *  • Typed subtitle animation
 *  • Skill cards  → morphOpen animation on scroll-enter
 *  • Skill bars   → width transition on scroll-enter
 *  • General scroll-reveal  (.reveal)
 *  • Active nav link highlight
 *  • Nav scroll shadow
 *  • Smooth anchor scroll
 * ════════════════════════════════════════════════════════
 */

/* ════════════════════════════════════
   THEME
════════════════════════════════════ */
const html       = document.documentElement;
const themeBtn   = document.getElementById('themeToggle');
const saved      = localStorage.getItem('hb-theme') || 'dark';
html.setAttribute('data-theme', saved);

themeBtn && themeBtn.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('hb-theme', next);
});

/* ════════════════════════════════════
   CUSTOM CURSOR  +  SPARK TRAIL
════════════════════════════════════ */
const ring = document.querySelector('.cur-ring');
const dot  = document.querySelector('.cur-dot');

/* Smooth ring follows with slight lag, dot is instant */
let rx = 0, ry = 0, cx = 0, cy = 0;

if (ring && dot && window.innerWidth > 960) {
  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';
    spawnSpark(cx, cy);
  });

  /* animate ring lag */
  (function animRing() {
    rx += (cx - rx) * 0.14;
    ry += (cy - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();
}

/* SPARK TRAIL */
let sparkCount = 0;
function spawnSpark(x, y) {
  if (sparkCount > 18) return;   /* throttle */
  sparkCount++;
  const s  = document.createElement('div');
  s.className = 'spark';
  const dx = (Math.random() - 0.5) * 28;
  const dy = (Math.random() - 0.5) * 28 - 10;
  s.style.cssText = `left:${x}px;top:${y}px;--dx:${dx}px;--dy:${dy}px;
    width:${3+Math.random()*3}px;height:${3+Math.random()*3}px;
    opacity:${.6+Math.random()*.4};
    animation-duration:${.4+Math.random()*.35}s;`;
  document.body.appendChild(s);
  setTimeout(() => { s.remove(); sparkCount--; }, 800);
}

/* ════════════════════════════════════
   TYPED SUBTITLE
════════════════════════════════════ */
const typedEl = document.getElementById('typed-text');
if (typedEl) {
  const PHRASES = [
    'Software Developer',
    'Java Engineer',
    'ML Enthusiast',
    'Frontend Builder',
    'Problem Solver',
  ];
  let pi=0, ci=0, del=false;
  (function tick() {
    typedEl.textContent = del
      ? PHRASES[pi].slice(0, --ci)
      : PHRASES[pi].slice(0, ++ci);
    if (!del && ci === PHRASES[pi].length) { del=true; return setTimeout(tick,1900); }
    if (del  && ci === 0)                  { del=false; pi=(pi+1)%PHRASES.length; return setTimeout(tick,360); }
    setTimeout(tick, del ? 50 : 85);
  })();
}

/* ════════════════════════════════════
   SKILL CARDS — morphOpen on enter
   Cards are VISIBLE by default (no opacity:0 in CSS).
   When they enter the viewport we add .morphed which
   triggers @keyframes morphOpen (clip-path split effect).
════════════════════════════════════ */
const skillCards = document.querySelectorAll('.skill-card');

const skillObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('morphed');
    skillObs.unobserve(entry.target);
  });
}, { threshold: 0.12 });

skillCards.forEach(c => skillObs.observe(c));

/* ════════════════════════════════════
   SKILL BARS — width transition on enter
   Bars have width:0 in CSS; we set the real width
   via data-width when the bar enters viewport.
════════════════════════════════════ */
const fills = document.querySelectorAll('.sk-fill');

/* Store target widths from inline style, then reset to 0 */
fills.forEach(el => {
  const w = el.style.width || el.getAttribute('data-w') || '70%';
  el.setAttribute('data-w', w);
  el.style.width = '0';
  el.style.transition = 'none';
});

const barObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    /* small delay so morphOpen animation plays first */
    setTimeout(() => {
      entry.target.style.transition = 'width 1.2s cubic-bezier(.34,1.2,.64,1)';
      entry.target.style.width = entry.target.getAttribute('data-w');
    }, 350);
    barObs.unobserve(entry.target);
  });
}, { threshold: 0.5 });

fills.forEach(el => barObs.observe(el));

/* ════════════════════════════════════
   GENERAL SCROLL REVEAL  (.reveal)
════════════════════════════════════ */
const reveals = document.querySelectorAll('.reveal');
const rvObs   = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    setTimeout(() => entry.target.classList.add('visible'), i * 85);
    rvObs.unobserve(entry.target);
  });
}, { threshold: 0.07 });
reveals.forEach(el => rvObs.observe(el));

/* ════════════════════════════════════
   NAV  — shadow + active link
════════════════════════════════════ */
const nav      = document.querySelector('nav');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

window.addEventListener('scroll', () => {
  nav && nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

const secObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)
    );
  });
}, { rootMargin: '-38% 0px -55% 0px' });
sections.forEach(s => secObs.observe(s));

/* ════════════════════════════════════
   SMOOTH ANCHOR SCROLL
════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});