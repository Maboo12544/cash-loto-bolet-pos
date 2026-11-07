(function (global) {
  const CV = () => global.CashVirtual;
  const GAME = 'roulette';

  function paintWheel(canvas, rot, highlight) {
    if (global.CashArt && global.CashArt.drawEuWheel) {
      global.CashArt.drawEuWheel(canvas, rot || 0, highlight);
    }
  }

  function evalBets(bets, winning) {
    const payTable = CV().state.config.roulette.payoutDemo;
    let payout = 0;
    const details = [];
    for (const b of bets) {
      let win = false;
      let mult = 0;
      if (b.type === 'straight') {
        win = b.value === winning;
        mult = payTable.straight;
      } else if (b.type === 'color') {
        win = winning !== 0 && CV().colorOf(winning) === b.value;
        mult = payTable.color;
      } else if (b.type === 'parity') {
        win = winning !== 0 && (winning % 2 === 0 ? 'even' : 'odd') === b.value;
        mult = payTable.parity;
      } else if (b.type === 'range') {
        win = winning !== 0 && (winning <= 18 ? 'low' : 'high') === b.value;
        mult = payTable.range;
      } else if (b.type === 'dozen') {
        const d = winning === 0 ? 0 : Math.ceil(winning / 12);
        win = d === b.value;
        mult = payTable.dozen;
      } else if (b.type === 'column') {
        const col = winning === 0 ? 0 : ((winning - 1) % 3) + 1;
        win = col === b.value;
        mult = payTable.column;
      }
      if (win) {
        const gain = b.amount * (mult + 1);
        payout += gain;
        details.push({ ...b, gain });
      }
    }
    return { payout: Math.round(payout * 100) / 100, details };
  }

  function render(root, { onBack }) {
    const cfg = CV().state.config.roulette;
    let chip = cfg.chipValues[1] || 5;
    let bets = [];
    let undoStack = [];
    let busy = false;

    root.innerHTML = `
      <div class="game-view">
        <div class="row-between">
          <button class="icon-btn" type="button" data-back aria-label="Retounen">←</button>
          <h1 style="margin:0;font-size:1.1rem">Woulèt</h1>
          <button class="btn ghost" type="button" data-rules>Règ</button>
        </div>
        <p class="muted" style="margin:0 0 6px">Wou Ewopeyen 0–36 · balans kont · pa RNG sètifye</p>
        <span class="phase-pill" data-phase>SELEKSYON</span>
        <div class="roulette-layout">
          <div class="wheel-wrap">
            <canvas data-wheel-canvas width="560" height="560" style="width:100%;height:100%;border-radius:50%"></canvas>
            <div class="ball-orbit" data-orbit><div class="ball-dot" data-ball></div></div>
          </div>
          <div class="roulette-result" data-winnum>—</div>
          <div class="panel">
            <div class="row-between"><h3>Jeton demonstrasyon</h3><span class="muted" data-total>Total miz: 0</span></div>
            <div class="chip-picker" data-chips></div>
            <div class="toolbar">
              <button class="btn" type="button" data-undo>Anile</button>
              <button class="btn danger" type="button" data-clear>Efase</button>
              <button class="btn primary" type="button" data-spin style="flex:1">Vire</button>
            </div>
          </div>
          <div class="panel bet-board">
            <button type="button" class="board-cell zero" data-bet='{"type":"straight","value":0}'>0</button>
            <div class="board-nums" data-nums></div>
            <div class="outside-bets">
              <button type="button" data-bet='{"type":"range","value":"low"}'>1–18</button>
              <button type="button" data-bet='{"type":"range","value":"high"}'>19–36</button>
              <button type="button" data-bet='{"type":"parity","value":"even"}'>Pè</button>
              <button type="button" data-bet='{"type":"parity","value":"odd"}'>Enpè</button>
              <button type="button" data-bet='{"type":"color","value":"red"}'>Wouj</button>
              <button type="button" data-bet='{"type":"color","value":"black"}'>Nwa</button>
              <button type="button" data-bet='{"type":"dozen","value":1}'>1e douzèn</button>
              <button type="button" data-bet='{"type":"dozen","value":2}'>2e douzèn</button>
              <button type="button" data-bet='{"type":"dozen","value":3}'>3e douzèn</button>
              <button type="button" data-bet='{"type":"column","value":1}'>Kolòn 1</button>
              <button type="button" data-bet='{"type":"column","value":2}'>Kolòn 2</button>
              <button type="button" data-bet='{"type":"column","value":3}'>Kolòn 3</button>
            </div>
          </div>
          <div class="result-banner hidden" data-result></div>
          <div class="panel">
            <h3>Dènye rezilta</h3>
            <div class="chip-row" data-recent></div>
            <div class="history-list" data-history style="margin-top:8px"></div>
          </div>
        </div>
      </div>`;

    const $ = (sel) => root.querySelector(sel);
    const nums = $('[data-nums]');
    // European layout columns: 3,2,1 down? Use readable 1..36 in 3 cols
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 3; col++) {
        const n = row * 3 + col + 1;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `board-cell ${CV().colorOf(n)}`;
        btn.textContent = n;
        btn.dataset.bet = JSON.stringify({ type: 'straight', value: n });
        nums.appendChild(btn);
      }
    }

    function totalStake() {
      return bets.reduce((s, b) => s + b.amount, 0);
    }

    function syncChips() {
      const box = $('[data-chips]');
      box.innerHTML = '';
      cfg.chipValues.forEach((v) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (chip === v ? ' active' : '');
        b.textContent = v;
        b.onclick = () => {
          if (busy) return;
          chip = v;
          syncChips();
        };
        box.appendChild(b);
      });
      $('[data-total]').textContent = `Total miz: ${totalStake()}`;
      $('[data-spin]').disabled = busy || !bets.length;
      $('[data-undo]').disabled = busy || !undoStack.length;
      $('[data-clear]').disabled = busy || !bets.length;
    }

    function paintSelected() {
      root.querySelectorAll('[data-bet]').forEach((el) => {
        const spec = JSON.parse(el.dataset.bet);
        const on = bets.some((b) => b.type === spec.type && b.value === spec.value);
        el.classList.toggle('selected', on);
      });
    }

    function syncHistory() {
      const hist = CV().state.history[GAME] || [];
      $('[data-recent]').innerHTML = hist
        .slice(0, 12)
        .map((h) => {
          const n = h.result.number;
          const c = CV().colorOf(n);
          const bg = c === 'red' ? '#c62828' : c === 'black' ? '#1a1f2b' : '#0f7a3a';
          return `<span class="mini-ball" style="background:${bg}">${n}</span>`;
        })
        .join('');
      $('[data-history]').innerHTML = hist.length
        ? hist
            .slice(0, 10)
            .map(
              (h) =>
                `<div class="history-item"><div><b>Nimewo ${h.result.number}</b><br><code>#${h.id.slice(0, 8)}</code></div><div>${h.payout > 0 ? '+' : ''}${h.payout}</div></div>`
            )
            .join('')
        : '<p class="muted">Pa gen rezilta ankò.</p>';
    }

    function placeBet(spec) {
      if (busy) return;
      const amount = chip;
      if (totalStake() + amount > CV().state.credits) {
        alert('Balans kont pa sifi.');
        return;
      }
      const bet = { ...spec, amount, id: CV().uuid() };
      bets.push(bet);
      undoStack.push(bet.id);
      CV().Sfx.tap();
      syncChips();
      paintSelected();
    }

    root.querySelectorAll('[data-bet]').forEach((el) => {
      el.addEventListener('click', () => placeBet(JSON.parse(el.dataset.bet)));
    });

    function angleForNumber(num) {
      const order = CV().EU_ORDER;
      const idx = order.indexOf(num);
      const step = 360 / order.length;
      // Segment center; wheel SVG starts at -90deg equivalent via path math
      return idx * step + step / 2;
    }

    async function spinTo(number) {
      const canvas = $('[data-wheel-canvas]');
      const ball = $('[data-ball]');
      const ms = CV().animDuration(cfg.roundMs);
      const target = angleForNumber(number);
      const spins = 4;
      const final = spins * 360 + (360 - target);
      if (!ms) {
        paintWheel(canvas, final, number);
        ball.style.transition = 'none';
        ball.style.transform = `rotate(${target}deg)`;
        return;
      }
      CV().Sfx.spin();
      const start = performance.now();
      const startRot = 0;
      ball.style.transition = `transform ${ms}ms cubic-bezier(.05,.7,.1,1)`;
      ball.style.transform = `rotate(${spins * 360 + target + 360}deg)`;
      await new Promise((resolve) => {
        function frame(now) {
          const t = Math.min(1, (now - start) / ms);
          const ease = 1 - Math.pow(1 - t, 3);
          const rot = startRot + (final - startRot) * ease;
          paintWheel(canvas, rot, t > 0.92 ? number : null);
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
      paintWheel(canvas, final, number);
      ball.style.transition = 'none';
      ball.style.transform = `rotate(${target}deg)`;
    }

    async function doSpin() {
      if (busy || !bets.length) return;
      const stake = totalStake();
      const number = CV().EU_ORDER[Math.floor(Math.random() * CV().EU_ORDER.length)];
      // Fix result before animation
      const locked = CV().lockRound(GAME, {
        stake,
        selection: bets,
        result: { number, color: CV().colorOf(number) }
      });
      if (!locked.ok) {
        alert(locked.error);
        return;
      }
      busy = true;
      syncChips();
      $('[data-phase]').textContent = 'SELEKSYON FÈMEN';
      CV().Sfx.confirm();
      CV().markAnimating(GAME);
      $('[data-phase]').textContent = 'ANIMASYON';
      await spinTo(number);
      const winEl = $('[data-winnum]');
      winEl.textContent = number;
      winEl.className = 'roulette-result ' + CV().colorOf(number);
      // highlight board
      root.querySelectorAll('.board-cell').forEach((el) => {
        el.style.outline = '';
        const spec = JSON.parse(el.dataset.bet || '{"value":null}');
        if (spec.type === 'straight' && spec.value === number) el.style.outline = '3px solid #f5c84a';
      });
      const { payout } = evalBets(bets, number);
      CV().settleRound(GAME, payout);
      const banner = $('[data-result]');
      banner.classList.remove('hidden', 'win', 'lose');
      banner.classList.add(payout > 0 ? 'win' : 'lose');
      banner.innerHTML = `<b>Soti: ${number} (${CV().colorOf(number)})</b><br>${payout > 0 ? 'Retou demonstrasyon +' + payout : 'Pa gen retou'} · #${locked.round.id.slice(0, 8)}`;
      if (payout > 0) CV().Sfx.win();
      else CV().Sfx.lose();
      bets = [];
      undoStack = [];
      busy = false;
      CV().clearActive(GAME);
      syncChips();
      paintSelected();
      syncHistory();
      $('[data-phase]').textContent = 'REZILTA';
    }

    async function resumeIfNeeded() {
      const r = CV().state.active[GAME];
      if (!r || r.phase === 'settled') return;
      bets = Array.isArray(r.selection) ? r.selection.slice() : [];
      busy = true;
      syncChips();
      paintSelected();
      $('[data-phase]').textContent = 'REKIPERE WONN';
      CV().markAnimating(GAME);
      await spinTo(r.result.number);
      const { payout } = evalBets(bets, r.result.number);
      CV().settleRound(GAME, payout);
      $('[data-winnum]').textContent = r.result.number;
      $('[data-winnum]').className = 'roulette-result ' + CV().colorOf(r.result.number);
      const banner = $('[data-result]');
      banner.classList.remove('hidden');
      banner.innerHTML = `<b>Wonn rekipere · ${r.result.number}</b><br>Retou ${payout} · #${r.id.slice(0, 8)}`;
      bets = [];
      undoStack = [];
      busy = false;
      CV().clearActive(GAME);
      syncChips();
      paintSelected();
      syncHistory();
    }

    $('[data-back]').onclick = onBack;
    $('[data-rules]').onclick = () =>
      global.CashVirtualUI.openModal(
        'Règ Woulèt (demonstrasyon)',
        `<p>Wou <b>Ewopeyen</b> ak yon sèl zewo (0–36).</p>
         <ul>
           <li>Ou ka parye sou nimewo, wouj/nwa, pè/enpè, ba/wo, douzèn ak kolòn.</li>
           <li>Jeton yo debit nan balans kont lan (menm ak POS).</li>
           <li>Tablo rekonpans la make kòm demonstrasyon epi li configurable.</li>
           <li>Pa gen depo/retrè ak lajan reyèl.</li>
         </ul>`
      );
    $('[data-undo]').onclick = () => {
      if (busy || !undoStack.length) return;
      const id = undoStack.pop();
      bets = bets.filter((b) => b.id !== id);
      syncChips();
      paintSelected();
    };
    $('[data-clear]').onclick = () => {
      if (busy) return;
      bets = [];
      undoStack = [];
      syncChips();
      paintSelected();
    };
    $('[data-spin]').onclick = doSpin;

    const canvas = $('[data-wheel-canvas]');
    if (canvas) paintWheel(canvas, 0, null);
    syncChips();
    syncHistory();
    resumeIfNeeded();
  }

  global.CashGames = global.CashGames || {};
  global.CashGames.roulette = { render, id: GAME, title: 'Woulèt' };
})(window);
