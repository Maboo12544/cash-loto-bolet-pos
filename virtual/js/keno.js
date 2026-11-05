(function (global) {
  const CV = () => global.CashVirtual;
  const GAME = 'keno';

  function matches(sel, drawn) {
    const set = new Set(drawn);
    return sel.filter((n) => set.has(n));
  }

  function payoutFor(pickCount, hitCount, stake, table) {
    const row = table[pickCount] || {};
    const mult = row[hitCount] ?? 0;
    return Math.round(stake * mult * 100) / 100;
  }

  function render(root, { onBack }) {
    const cfg = CV().state.config.keno;
    let selection = new Set();
    let busy = false;
    let stake = cfg.stakeDefault;

    root.innerHTML = `
      <div class="game-view">
        <div class="row-between">
          <button class="icon-btn" type="button" data-back aria-label="Retounen">←</button>
          <h1 style="margin:0;font-size:1.1rem">Keno</h1>
          <button class="btn ghost" type="button" data-rules>Règ</button>
        </div>
        <p class="muted" style="margin:0 0 6px">Kredi vityèl · règle pwototip · pa RNG sètifye</p>
        <span class="phase-pill" data-phase>SELEKSYON</span>
        <div class="panel">
          <div class="row-between"><h3>Fich ou</h3><span class="muted" data-count>0 / ${cfg.maxPick}</span></div>
          <div class="chip-row" data-ticket></div>
          <div class="stake-box">
            <button class="btn" type="button" data-stake-dec>-</button>
            <strong data-stake>${stake}</strong>
            <button class="btn" type="button" data-stake-inc>+</button>
          </div>
        </div>
        <div class="toolbar">
          <button class="btn" type="button" data-auto>Oto</button>
          <button class="btn danger" type="button" data-clear>Efase</button>
          <button class="btn primary" type="button" data-confirm style="flex:1">Konfime</button>
        </div>
        <div class="num-grid cols-10" data-grid></div>
        <div class="stage machine" style="min-height:160px;height:160px">
          <div class="machine-frame" style="inset:8px 10px 44px" aria-hidden="true"></div>
          <div class="machine-bowl" style="height:88px;top:14px" aria-hidden="true"></div>
          <div class="drawn-lane" data-drawn></div>
        </div>
        <div class="result-banner hidden" data-result></div>
        <div class="panel">
          <h3>Istorik</h3>
          <div class="history-list" data-history></div>
        </div>
        <p class="config-note">Chwazi ${cfg.minPick}–${cfg.maxPick} · tire ${cfg.drawCount} nan ${cfg.poolSize} · dire ~${Math.round(cfg.roundMs / 1000)}s · tablo rekonpans = demonstrasyon configurable.</p>
      </div>`;

    const $ = (sel) => root.querySelector(sel);

    function paintGrid(drawn = [], hit = []) {
      const grid = $('[data-grid]');
      grid.innerHTML = '';
      for (let n = 1; n <= cfg.poolSize; n++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ball-btn';
        b.textContent = n;
        if (selection.has(n)) b.classList.add('selected');
        if (drawn.includes(n)) b.classList.add('drawn');
        if (hit.includes(n)) b.classList.add('hit');
        b.disabled = busy;
        b.onclick = () => {
          if (busy) return;
          CV().Sfx.tap();
          if (selection.has(n)) selection.delete(n);
          else if (selection.size < cfg.maxPick) selection.add(n);
          sync();
        };
        grid.appendChild(b);
      }
    }

    function syncTicket() {
      const ticket = $('[data-ticket]');
      ticket.innerHTML = [...selection]
        .sort((a, b) => a - b)
        .map((n) => `<span class="mini-ball">${n}</span>`)
        .join('');
      $('[data-count]').textContent = `${selection.size} / ${cfg.maxPick}`;
      $('[data-stake]').textContent = stake;
    }

    function syncHistory() {
      const list = CV().state.history[GAME] || [];
      $('[data-history]').innerHTML = list.length
        ? list
            .map(
              (h) =>
                `<div class="history-item"><div><b>${(h.meta && h.meta.hits) || 0} korespondans</b><br><code>#${h.id.slice(0, 8)}</code></div><div>${h.payout > 0 ? '+' : ''}${h.payout}</div></div>`
            )
            .join('')
        : '<p class="muted">Pa gen wonn ankò.</p>';
    }

    function sync() {
      syncTicket();
      paintGrid();
      $('[data-confirm]').disabled = busy || selection.size < cfg.minPick || selection.size > cfg.maxPick;
      $('[data-auto]').disabled = busy;
      $('[data-clear]').disabled = busy;
      $('[data-stake-dec]').disabled = busy || stake <= 1;
      $('[data-stake-inc]').disabled = busy || stake >= 100;
      syncHistory();
    }

    async function animateDraw(drawn, hit) {
      const lane = $('[data-drawn]');
      lane.innerHTML = '';
      const ms = CV().animDuration(cfg.roundMs);
      const step = drawn.length ? ms / drawn.length : 0;
      for (const n of drawn) {
        const isHit = hit.includes(n);
        lane.insertAdjacentHTML('beforeend', `<span class="mini-ball${isHit ? ' hit' : ''}">${n}</span>`);
        CV().Sfx.ball();
        paintGrid(drawn.slice(0, drawn.indexOf(n) + 1), hit.filter((x) => drawn.indexOf(x) <= drawn.indexOf(n)));
        await CV().wait(step);
      }
      paintGrid(drawn, hit);
    }

    async function confirm() {
      if (busy || selection.size < cfg.minPick) return;
      const pick = [...selection].sort((a, b) => a - b);
      const drawn = CV().pickN(cfg.poolSize, cfg.drawCount);
      const hit = matches(pick, drawn);
      const locked = CV().lockRound(GAME, {
        stake,
        selection: pick,
        result: { drawn },
        meta: { hits: hit.length, hit }
      });
      if (!locked.ok) {
        alert(locked.error);
        return;
      }
      busy = true;
      sync();
      $('[data-phase]').textContent = 'SELEKSYON FÈMEN';
      CV().Sfx.confirm();
      CV().markAnimating(GAME);
      $('[data-phase]').textContent = 'TIRAJ';
      await animateDraw(drawn, hit);
      const pay = payoutFor(pick.length, hit.length, stake, cfg.payoutDemo);
      CV().settleRound(GAME, pay);
      const banner = $('[data-result]');
      banner.classList.remove('hidden', 'win', 'lose');
      banner.classList.add(pay > 0 ? 'win' : 'lose');
      banner.innerHTML = `<b>${hit.length} korespondans</b> sou ${pick.length} chwazi<br>${pay > 0 ? '+' + pay : 'Pa gen retou'} · #${locked.round.id.slice(0, 8)}`;
      if (pay > 0) CV().Sfx.win();
      else CV().Sfx.lose();
      busy = false;
      CV().clearActive(GAME);
      $('[data-phase]').textContent = 'REZILTA';
      sync();
    }

    async function resumeIfNeeded() {
      const r = CV().state.active[GAME];
      if (!r || r.phase === 'settled') return;
      selection = new Set(r.selection);
      stake = r.stake;
      busy = true;
      sync();
      $('[data-phase]').textContent = 'REKIPERE WONN';
      CV().markAnimating(GAME);
      const hit = (r.meta && r.meta.hit) || matches(r.selection, r.result.drawn);
      await animateDraw(r.result.drawn, hit);
      const pay = payoutFor(r.selection.length, hit.length, r.stake, cfg.payoutDemo);
      CV().settleRound(GAME, pay);
      $('[data-result]').classList.remove('hidden');
      $('[data-result]').innerHTML = `<b>Wonn rekipere</b><br>${hit.length} korespondans · ${pay} · #${r.id.slice(0, 8)}`;
      busy = false;
      CV().clearActive(GAME);
      sync();
    }

    $('[data-back]').onclick = onBack;
    $('[data-rules]').onclick = () =>
      global.CashVirtualUI.openModal(
        'Règ Keno (pwototip)',
        `<p>Règ <b>pwovizwa</b> pou demonstrasyon.</p>
         <ul>
           <li>Chwazi ${cfg.minPick} a ${cfg.maxPick} nimewo nan 1–${cfg.poolSize}.</li>
           <li>Yo tire ${cfg.drawCount} nimewo diferan.</li>
           <li>Retou selon kantite korespondans — tablo demonstrasyon configurable.</li>
         </ul>`
      );
    $('[data-auto]').onclick = () => {
      if (busy) return;
      const n = Math.max(cfg.minPick, Math.min(5, cfg.maxPick));
      selection = new Set(CV().pickN(cfg.poolSize, n));
      CV().Sfx.tap();
      sync();
    };
    $('[data-clear]').onclick = () => {
      if (busy) return;
      selection.clear();
      $('[data-drawn]').innerHTML = '';
      sync();
    };
    $('[data-confirm]').onclick = confirm;
    $('[data-stake-dec]').onclick = () => {
      if (!busy) {
        stake = Math.max(1, stake - 5);
        sync();
      }
    };
    $('[data-stake-inc]').onclick = () => {
      if (!busy) {
        stake = Math.min(100, stake + 5);
        sync();
      }
    };

    sync();
    resumeIfNeeded();
  }

  global.CashGames = global.CashGames || {};
  global.CashGames.keno = { render, id: GAME, title: 'Keno' };
})(window);
