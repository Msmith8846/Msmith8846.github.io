// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Nav scroll effect + mobile toggle
const nav = document.getElementById('nav');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelector('.nav-links');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});
navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Typed roles
const roles = [
  'CIS student at Niagara University.',
  'Java & Python developer.',
  'hockey player (ACHA D2).',
  'team lead and Eagle Scout.',
  'intern-ready for Summer 2026.'
];
const typed = document.getElementById('typed');
let roleIdx = 0, charIdx = 0, deleting = false;
function type() {
  if (!typed) return;
  const word = roles[roleIdx];
  typed.textContent = word.slice(0, charIdx);
  if (!deleting && charIdx < word.length) {
    charIdx++;
    setTimeout(type, 55);
  } else if (deleting && charIdx > 0) {
    charIdx--;
    setTimeout(type, 30);
  } else {
    deleting = !deleting;
    if (!deleting) roleIdx = (roleIdx + 1) % roles.length;
    setTimeout(type, deleting ? 1600 : 420);
  }
}
type();

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// Skill bar animation
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      skillObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.skill').forEach(el => skillObserver.observe(el));

// Card tilt
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// Animated background — drifting ice / particles
(function bg() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = canvas.width = window.innerWidth * DPR;
    h = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const count = Math.min(90, Math.floor(window.innerWidth / 18));
    particles = Array.from({ length: count }, () => spawn());
  }
  function spawn() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.8 + 0.4) * DPR,
      vx: (Math.random() - 0.5) * 0.25 * DPR,
      vy: (Math.random() * 0.35 + 0.05) * DPR,
      hue: Math.random() > 0.5 ? 195 : 260,
      a: Math.random() * 0.4 + 0.25
    };
  }
  let mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX * DPR; mouse.y = e.clientY * DPR; });

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 14000) {
        const f = 14000 / dist2;
        p.vx += (dx / Math.sqrt(dist2)) * f * 0.002;
        p.vy += (dy / Math.sqrt(dist2)) * f * 0.002;
      }
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }

      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grd.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.a})`);
      grd.addColorStop(1, `hsla(${p.hue}, 100%, 70%, 0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  resize();
  window.addEventListener('resize', resize);
  frame();
})();

// Konami code
const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kIdx = 0;
const overlay = document.getElementById('konami-overlay');
function showKonami() {
  overlay?.classList.add('show');
  setTimeout(() => {
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    }, { once: true });
  }, 100);
}
window.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === konami[kIdx]) {
    kIdx++;
    if (kIdx === konami.length) { showKonami(); kIdx = 0; }
  } else {
    kIdx = (key === konami[0]) ? 1 : 0;
  }
});
document.getElementById('konami-hint')?.addEventListener('click', showKonami);
