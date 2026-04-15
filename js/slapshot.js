const canvas = document.getElementById('slap-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const state = {
  puck: { x: W * 0.25, y: H * 0.75, vx: 0, vy: 0, r: 22, moving: false },
  goalie: { x: W * 0.82, y: H * 0.5, vy: 180, r: 46 },
  net: { x: W * 0.88, y: H * 0.28, w: 90, h: H * 0.44 },
  aiming: false,
  aimStart: null,
  aimEnd: null,
  goals: 0,
  shots: 0,
  streak: 0,
  best: Number(localStorage.getItem('slap-best')) || 0,
  time: 60,
  running: false,
  lastTs: 0,
  timerAcc: 0,
  particles: [],
  message: '',
  messageTs: 0,
};

document.getElementById('slap-best').textContent = state.best;

function rinkBg() {
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#c7e3f7');
  grd.addColorStop(1, '#ffffff');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Center red line
  ctx.strokeStyle = 'rgba(200, 30, 30, 0.5)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, 0);
  ctx.lineTo(W * 0.5, H);
  ctx.stroke();

  // Blue lines
  ctx.strokeStyle = 'rgba(30, 80, 200, 0.5)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(W * 0.33, 0); ctx.lineTo(W * 0.33, H);
  ctx.moveTo(W * 0.67, 0); ctx.lineTo(W * 0.67, H);
  ctx.stroke();

  // Center circle
  ctx.strokeStyle = 'rgba(30, 80, 200, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W * 0.5, H * 0.5, 110, 0, Math.PI * 2);
  ctx.stroke();

  // Goalie crease
  ctx.fillStyle = 'rgba(120, 180, 255, 0.25)';
  ctx.beginPath();
  ctx.arc(W * 0.88, H * 0.5, 140, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();

  // Rink boards
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, W - 10, H - 10);
}

function drawNet() {
  const n = state.net;
  ctx.save();
  ctx.translate(n.x, n.y);
  // Goal area
  ctx.fillStyle = 'rgba(255, 40, 40, 0.1)';
  ctx.fillRect(0, 0, n.w, n.h);

  // Mesh
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath(); ctx.moveTo((i / 10) * n.w, 0); ctx.lineTo((i / 10) * n.w, n.h); ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath(); ctx.moveTo(0, (i / 8) * n.h); ctx.lineTo(n.w, (i / 8) * n.h); ctx.stroke();
  }
  // Frame
  ctx.strokeStyle = '#c02020';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, n.h); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(n.w, 0); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, n.h); ctx.lineTo(n.w, n.h); ctx.stroke();

  // Posts
  ctx.fillStyle = '#c02020';
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, n.h, 8, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawGoalie() {
  const g = state.goalie;
  ctx.save();
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y + g.r + 4, g.r * 0.9, 10, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  const bodyGrd = ctx.createRadialGradient(g.x - 10, g.y - 10, 10, g.x, g.y, g.r);
  bodyGrd.addColorStop(0, '#ffd86b');
  bodyGrd.addColorStop(1, '#b8860b');
  ctx.fillStyle = bodyGrd;
  ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();

  // Pads
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(g.x - g.r - 8, g.y - g.r * 0.4, 18, g.r * 0.8);
  ctx.fillRect(g.x + g.r - 10, g.y - g.r * 0.4, 18, g.r * 0.8);

  // Mask / face
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath(); ctx.arc(g.x, g.y - 6, g.r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x - 14, g.y - 10); ctx.lineTo(g.x + 14, g.y - 10);
  ctx.moveTo(g.x - 14, g.y); ctx.lineTo(g.x + 14, g.y);
  ctx.stroke();

  // MS logo
  ctx.fillStyle = '#b40000';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MS', g.x, g.y + 22);
  ctx.restore();
}

function drawPuck() {
  const p = state.puck;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r + 2, p.r * 0.9, 6, 0, 0, Math.PI * 2); ctx.fill();

  const grd = ctx.createRadialGradient(p.x - 6, p.y - 6, 4, p.x, p.y, p.r);
  grd.addColorStop(0, '#333');
  grd.addColorStop(1, '#000');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r - 4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawAim() {
  if (!state.aiming || !state.aimStart || !state.aimEnd) return;
  const sx = state.puck.x, sy = state.puck.y;
  const dx = state.aimStart.x - state.aimEnd.x;
  const dy = state.aimStart.y - state.aimEnd.y;
  const power = Math.min(Math.hypot(dx, dy), 400);
  const angle = Math.atan2(dy, dx);
  const tx = sx + Math.cos(angle) * power * 1.6;
  const ty = sy + Math.sin(angle) * power * 1.6;

  ctx.save();
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = `hsla(${200 - power / 2}, 100%, 55%, 0.9)`;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrow head
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx - Math.cos(angle - 0.4) * 20, ty - Math.sin(angle - 0.4) * 20);
  ctx.lineTo(tx - Math.cos(angle + 0.4) * 20, ty - Math.sin(angle + 0.4) * 20);
  ctx.closePath();
  ctx.fill();

  // Power bar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(40, H - 60, 300, 24);
  ctx.fillStyle = `hsl(${120 - (power / 400) * 120}, 80%, 55%)`;
  ctx.fillRect(44, H - 56, (power / 400) * 292, 16);
  ctx.restore();
}

function drawParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.25;
    p.life -= 1;
    ctx.fillStyle = `rgba(${p.color},${Math.max(0, p.life / p.maxLife)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}
function burst(x, y, color = '255,215,107', count = 30) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 8 + 2;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 2,
      r: Math.random() * 4 + 2,
      life: 50, maxLife: 50,
      color
    });
  }
}

function drawMessage() {
  if (!state.message) return;
  const age = performance.now() - state.messageTs;
  if (age > 1500) { state.message = ''; return; }
  const alpha = 1 - age / 1500;
  ctx.save();
  ctx.fillStyle = `rgba(255, 215, 107, ${alpha})`;
  ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
  ctx.lineWidth = 6;
  ctx.font = 'bold 88px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeText(state.message, W / 2, H * 0.3);
  ctx.fillText(state.message, W / 2, H * 0.3);
  ctx.restore();
}

function updateGoalie(dt) {
  const g = state.goalie;
  const n = state.net;
  g.y += g.vy * dt;
  if (g.y < n.y + g.r) { g.y = n.y + g.r; g.vy *= -1; }
  if (g.y > n.y + n.h - g.r) { g.y = n.y + n.h - g.r; g.vy *= -1; }
}

function updatePuck(dt) {
  const p = state.puck;
  if (!p.moving) return;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.vx *= 0.996; p.vy *= 0.996;

  // Wall bounce (rink boards)
  if (p.x < p.r + 10) { p.x = p.r + 10; p.vx *= -0.7; }
  if (p.x > W - p.r - 10) { p.x = W - p.r - 10; p.vx *= -0.7; }
  if (p.y < p.r + 10) { p.y = p.r + 10; p.vy *= -0.7; }
  if (p.y > H - p.r - 10) { p.y = H - p.r - 10; p.vy *= -0.7; }

  // Goalie collision
  const g = state.goalie;
  const dx = p.x - g.x, dy = p.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < p.r + g.r) {
    const nx = dx / dist, ny = dy / dist;
    const dot = p.vx * nx + p.vy * ny;
    p.vx -= 2 * dot * nx;
    p.vy -= 2 * dot * ny;
    p.vx *= 0.7; p.vy *= 0.7;
    p.x = g.x + nx * (p.r + g.r + 1);
    p.y = g.y + ny * (p.r + g.r + 1);
    burst(p.x, p.y, '180,180,180', 15);
    flash('SAVE!');
    endShot(false);
  }

  // Goal check
  const n = state.net;
  if (p.x > n.x + 8 && p.x < n.x + n.w && p.y > n.y && p.y < n.y + n.h) {
    burst(p.x, p.y, '255,215,107', 60);
    burst(p.x, p.y, '0,212,255', 40);
    flash('GOAL!');
    endShot(true);
  }

  // Too slow - stop
  if (Math.hypot(p.vx, p.vy) < 20) {
    p.moving = false;
    if (p.x > W * 0.5) endShot(false);
    else resetPuck();
  }
}
function flash(text) {
  state.message = text;
  state.messageTs = performance.now();
}

function endShot(scored) {
  if (!state.puck.moving && state.shots > 0) return;
  state.shots++;
  if (scored) {
    state.goals++;
    state.streak++;
    // Speed up goalie slightly
    state.goalie.vy *= state.goalie.vy > 0 ? 1.08 : 1.08;
    state.goalie.vy = Math.sign(state.goalie.vy) * Math.min(Math.abs(state.goalie.vy), 520);
  } else {
    state.streak = 0;
  }
  if (state.goals > state.best) {
    state.best = state.goals;
    localStorage.setItem('slap-best', state.best);
  }
  updateHud();
  setTimeout(resetPuck, 600);
}
function resetPuck() {
  state.puck.x = W * 0.25;
  state.puck.y = H * 0.5 + (Math.random() - 0.5) * 200;
  state.puck.vx = 0; state.puck.vy = 0;
  state.puck.moving = false;
}
function updateHud() {
  document.getElementById('slap-goals').textContent = state.goals;
  document.getElementById('slap-shots').textContent = state.shots;
  document.getElementById('slap-streak').textContent = state.streak;
  document.getElementById('slap-best').textContent = state.best;
  document.getElementById('slap-time').textContent = Math.max(0, Math.ceil(state.time));
}

function loop(ts) {
  const dt = Math.min((ts - state.lastTs) / 1000, 0.05) || 0;
  state.lastTs = ts;

  if (state.running) {
    state.time -= dt;
    if (state.time <= 0) {
      state.running = false;
      state.time = 0;
      flash(`TIME! ${state.goals} goals`);
    }
    updateGoalie(dt);
  }
  updatePuck(dt);
  updateHud();

  rinkBg();
  drawNet();
  drawGoalie();
  drawPuck();
  drawAim();
  drawParticles();
  drawMessage();

  if (!state.running && state.time <= 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd86b';
    ctx.font = 'bold 70px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Final: ${state.goals} goals`, W / 2, H / 2 - 20);
    ctx.font = '32px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Click Start round or press Space to go again', W / 2, H / 2 + 40);
    ctx.restore();
  } else if (!state.running && state.time === 60 && state.shots === 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Drop the puck', W / 2, H / 2 - 20);
    ctx.font = '26px "JetBrains Mono", monospace';
    ctx.fillText('Click Start round to begin a 60-second shift', W / 2, H / 2 + 30);
    ctx.restore();
  }

  requestAnimationFrame(loop);
}

function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (W / r.width);
  const y = (e.clientY - r.top) * (H / r.height);
  return { x, y };
}
canvas.addEventListener('mousedown', (e) => {
  if (!state.running || state.puck.moving) return;
  const pos = getPos(e);
  const p = state.puck;
  const dist = Math.hypot(pos.x - p.x, pos.y - p.y);
  if (dist < p.r * 4) {
    state.aiming = true;
    state.aimStart = { x: p.x, y: p.y };
    state.aimEnd = pos;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!state.aiming) return;
  state.aimEnd = getPos(e);
});
canvas.addEventListener('mouseup', (e) => {
  if (!state.aiming) return;
  const pos = getPos(e);
  const dx = state.aimStart.x - pos.x;
  const dy = state.aimStart.y - pos.y;
  const power = Math.min(Math.hypot(dx, dy), 400);
  if (power > 20) {
    state.puck.vx = dx * 4.2;
    state.puck.vy = dy * 4.2;
    state.puck.moving = true;
  }
  state.aiming = false;
});
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY }));
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const t = e.touches[0];
  canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: t.clientX, clientY: t.clientY }));
}, { passive: false });

function startRound() {
  state.goals = 0;
  state.shots = 0;
  state.streak = 0;
  state.time = 60;
  state.running = true;
  state.goalie.vy = 180 * (Math.random() > 0.5 ? 1 : -1);
  resetPuck();
  updateHud();
}
document.getElementById('slap-start').addEventListener('click', startRound);
document.getElementById('slap-reset').addEventListener('click', () => {
  state.best = 0;
  localStorage.setItem('slap-best', 0);
  updateHud();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); startRound(); }
});

requestAnimationFrame(loop);
