const SUITS = [
  { s: '♠', red: false },
  { s: '♥', red: true },
  { s: '♦', red: true },
  { s: '♣', red: false },
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const DECKS = 6;

let shoe = [];
let playerHand = [];
let dealerHand = [];
let bankroll = Number(localStorage.getItem('bj-bankroll')) || 500;
let bet = 25;
let handsPlayed = Number(localStorage.getItem('bj-hands')) || 0;
let wins = Number(localStorage.getItem('bj-wins')) || 0;
let losses = Number(localStorage.getItem('bj-losses')) || 0;
let pushes = Number(localStorage.getItem('bj-pushes')) || 0;
let inRound = false;
let doubled = false;

const $ = (id) => document.getElementById(id);

function buildShoe() {
  shoe = [];
  for (let d = 0; d < DECKS; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit });
      }
    }
  }
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
}
function draw() {
  if (shoe.length < 20) buildShoe();
  return shoe.pop();
}
function cardValue(card) {
  if (card.rank === 'A') return 11;
  if (['J','Q','K'].includes(card.rank)) return 10;
  return Number(card.rank);
}
function score(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    total += cardValue(c);
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}
function isBlackjack(hand) {
  return hand.length === 2 && score(hand) === 21;
}

function renderCard(card, hidden = false, index = 0) {
  const el = document.createElement('div');
  el.className = 'card' + (card.suit.red ? ' red' : '') + (hidden ? ' back' : '');
  el.style.setProperty('--rot', `${(index % 2 === 0 ? 1 : -1) * (Math.random() * 3)}deg`);
  if (!hidden) {
    el.innerHTML = `
      <div class="corner tl"><span class="rank">${card.rank}</span><span class="suit">${card.suit.s}</span></div>
      <div class="center">${card.suit.s}</div>
      <div class="corner br"><span class="rank">${card.rank}</span><span class="suit">${card.suit.s}</span></div>
    `;
  }
  return el;
}
function renderHands(hideDealerHole) {
  const ph = $('player-hand'); ph.innerHTML = '';
  playerHand.forEach((c, i) => ph.appendChild(renderCard(c, false, i)));

  const dh = $('dealer-hand'); dh.innerHTML = '';
  dealerHand.forEach((c, i) => dh.appendChild(renderCard(c, hideDealerHole && i === 1, i)));

  $('player-score').textContent = playerHand.length ? score(playerHand) : '';
  if (hideDealerHole && dealerHand.length) {
    $('dealer-score').textContent = cardValue(dealerHand[0]);
  } else {
    $('dealer-score').textContent = dealerHand.length ? score(dealerHand) : '';
  }
}
function save() {
  localStorage.setItem('bj-bankroll', bankroll);
  localStorage.setItem('bj-hands', handsPlayed);
  localStorage.setItem('bj-wins', wins);
  localStorage.setItem('bj-losses', losses);
  localStorage.setItem('bj-pushes', pushes);
}
function renderHud() {
  $('bankroll').textContent = `$${bankroll}`;
  $('bet').textContent = `$${bet}`;
  $('hands').textContent = handsPlayed;
  $('wins').textContent = wins;
  $('losses').textContent = losses;
  $('pushes').textContent = pushes;
}
function message(text, type = '') {
  const m = $('message');
  m.textContent = text;
  m.className = 'message ' + type;
}
function setButtons({ deal, hit, stand, dbl }) {
  $('deal').disabled = !deal;
  $('hit').disabled = !hit;
  $('stand').disabled = !stand;
  $('double').disabled = !dbl;
}

function deal() {
  if (inRound) return;
  if (bankroll < bet) {
    message('Not enough bankroll for that bet.', 'lose');
    return;
  }
  if (shoe.length === 0) buildShoe();
  playerHand = [draw(), draw()];
  dealerHand = [draw(), draw()];
  inRound = true; doubled = false;
  renderHands(true);
  message('Hit, stand, or double.');

  const canDouble = bankroll >= bet * 2;
  setButtons({ deal: false, hit: true, stand: true, dbl: canDouble });

  if (isBlackjack(playerHand)) {
    setTimeout(stand, 600);
  }
}
function hit() {
  if (!inRound) return;
  playerHand.push(draw());
  renderHands(true);
  if (score(playerHand) >= 21) {
    setTimeout(stand, 400);
  } else {
    setButtons({ deal: false, hit: true, stand: true, dbl: false });
  }
}
function double() {
  if (!inRound || playerHand.length !== 2) return;
  if (bankroll < bet * 2) return;
  doubled = true;
  playerHand.push(draw());
  renderHands(true);
  setTimeout(stand, 450);
}
async function stand() {
  if (!inRound) return;
  setButtons({ deal: false, hit: false, stand: false, dbl: false });
  renderHands(false);
  while (score(dealerHand) < 17) {
    await sleep(500);
    dealerHand.push(draw());
    renderHands(false);
  }
  resolve();
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function resolve() {
  const p = score(playerHand);
  const d = score(dealerHand);
  const stake = doubled ? bet * 2 : bet;
  const pbj = isBlackjack(playerHand);
  const dbj = isBlackjack(dealerHand);
  handsPlayed++;

  let result, type;
  if (p > 21) {
    result = `Bust at ${p}. Dealer wins. -$${stake}`;
    bankroll -= stake; losses++; type = 'lose';
  } else if (pbj && !dbj) {
    const win = Math.floor(stake * 1.5);
    result = `Blackjack! +$${win}`;
    bankroll += win; wins++; type = 'win';
  } else if (dbj && !pbj) {
    result = `Dealer blackjack. -$${stake}`;
    bankroll -= stake; losses++; type = 'lose';
  } else if (d > 21) {
    result = `Dealer busts at ${d}. +$${stake}`;
    bankroll += stake; wins++; type = 'win';
  } else if (p > d) {
    result = `${p} beats ${d}. +$${stake}`;
    bankroll += stake; wins++; type = 'win';
  } else if (p < d) {
    result = `${d} beats ${p}. -$${stake}`;
    bankroll -= stake; losses++; type = 'lose';
  } else {
    result = `Push at ${p}. No change.`;
    pushes++; type = 'push';
  }
  inRound = false;
  message(result, type);
  save();
  renderHud();

  if (bankroll <= 0) {
    message('You busted out — hit Reset Bankroll to try again.', 'lose');
    setButtons({ deal: false, hit: false, stand: false, dbl: false });
  } else {
    setButtons({ deal: true, hit: false, stand: false, dbl: false });
  }
}

// Betting
document.querySelectorAll('.chip').forEach(c => {
  c.addEventListener('click', () => {
    if (inRound) return;
    const add = Number(c.dataset.bet);
    const newBet = bet + add;
    if (newBet <= bankroll) bet = newBet;
    else bet = bankroll;
    renderHud();
  });
});
$('clear-bet').addEventListener('click', () => {
  if (inRound) return;
  bet = 25;
  renderHud();
});
$('deal').addEventListener('click', deal);
$('hit').addEventListener('click', hit);
$('stand').addEventListener('click', stand);
$('double').addEventListener('click', double);
$('reset').addEventListener('click', () => {
  if (inRound) return;
  bankroll = 500; handsPlayed = 0; wins = 0; losses = 0; pushes = 0; bet = 25;
  save(); renderHud();
  message('Bankroll reset. Good luck.');
  setButtons({ deal: true, hit: false, stand: false, dbl: false });
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') hit();
  else if (e.key === 's' || e.key === 'S') stand();
  else if (e.key === 'd' || e.key === 'D') {
    if (!inRound) deal(); else double();
  }
});

buildShoe();
renderHud();
setButtons({ deal: true, hit: false, stand: false, dbl: false });
