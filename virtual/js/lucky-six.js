(function (global) {
  const CV = () => global.CashVirtual;
  const GAME = 'lucky6';

  function hits(selection, drawn) {
    const set = new Set(drawn);
    return selection.filter((n) => set.has(n));
  }

  function payoutFor(matchCount, stake, table) {
    const mult = table[matchCount] ?? 0;
    return Math.round(stake * mult * 100) / 100;
  }

  function render(root, { onBack }) {
    const cfg = CV().state.config.lucky6;
    let selection = new Set();
    let busy = false;
    const active = CV().state.active[GAME];

    root.innerHTML = `
      <div class="game-view" id="l6">
        <div class="row-between">
          <button class="icon-btn" type="button" data-back aria-label="Retounen">←</button>
          <h1 style="margin:0;font-size:1.1rem">Lucky Six</h1>
          <button class="btn ghost" type="button" data-rules>Règ</button>
        </div>
        <p class="muted" style="margin:0 0 6px">Kredi vityèl · règle pwototip · pa RNG sètifye</p>
        <span class="phase-pill" data-phase>SELEKSYON</span>
        <div class="panel">
          <div class="row-between"><h3>Fich ou</h3><span class="muted" data-count>0 / ${cfg.pickCount}</span></div>
          <div class="chip-row" data-ticket></div>
          <div class="stake-box">
            <button class="btn" type="button" data-stake-dec>-</button>
            <strong data-stake>${cfg.stakeDefault}</strong>
            <button class="btn" type="button" data-stake-inc>+</button>
          </div>
          <p class="muted" style="text-align:center;margin:0">Miz (kredi vityèl)</p>
        </div>
        <div class="toolbar">
          <button class="btn" type="button" data-auto>Oto</button>
          <button class="btn danger" type="button" data-clear>Efase</button>
          <button class="btn primary" type="button" data-confirm style="flex:1">Konfime</button>
        </div>
        <div class="num-grid cols-8" data-grid></div>
        <div class="stage machine" data-stage>
          <div class="machine-frame" aria-hidden="true"></div>
          <div class="machine-bowl" aria-hidden="true"></div>
          <div class="drawn-lane" data-drawn></div>
        </div>
        <div class="result-banner hidden" data-result></div>
        <div class="panel">
          <h3>Istorik wonn</h3>
          <div class="history-list" data-history></div>
        </div>
        <p class="config-note">Konfigirab: tire ${cfg.drawCount} boul / ${cfg.poolSize} · dire ~${Math.round(cfg.roundMs / 1000)}s · tablo rekonpans = demonstrasyon.</p>
      </div>`;

    const $ = (sel) => root.querySelector(sel);
    let stake = cfg.stakeDefault;

    function phaseLabel(p) {
      return ({ select: 'SELEKSYON', locked: 'SELEKSYON FÈMEN', animating: 'TIRAJ', settled: 'REZILTA' }[p] || p);
    }

    const BALL_COLORS = ['#ff1537','#135dff','#ff9900','#00c766','#00b9e3','#155eff','#e51a32','#858591','#00be75','#008d80','#08bada','#eebf11','#c111cf','#9844e6','#ff7622','#dd1835'];
    function paintGrid() {
      const grid = $('[data-grid]');
      grid.innerHTML = '';
      for (let n = 1; n <= cfg.poolSize; n++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ball-btn';
        b.textContent = n;
        b.dataset.n = n;
        b.style.setProperty('--ball', BALL_COLORS[(n - 1) % BALL_COLORS.length]);
        if (selection.has(n)) b.classList.add('selected');
        b.disabled = busy;
        b.onclick = () => {
          if (busy) return;
          CV().Sfx.tap();
          if (selection.has(n)) selection.delete(n);
          else if (selection.size < cfg.pickCount) selection.add(n);
          sync();
        };
        grid.appendChild(b);
      }
    }

    function syncTicket() {
      const ticket = $('[data-ticket]');
      ticket.innerHTML = '';
      [...selection].sort((a, b) => a - b).forEach((n) => {
        const s = document.createElement('span');
        s.className = 'mini-ball';
        s.textContent = n;
        ticket.appendChild(s);
      });
      $('[data-count]').textContent = `${selection.size} / ${cfg.pickCount}`;
      $('[data-stake]').textContent = stake;
    }

    function syncHistory() {
      const box = $('[data-history]');
      const list = CV().state.history[GAME] || [];
      box.innerHTML = list.length
        ? list
            .map(
              (h) => `<div class="history-item"><div><b>${(h.meta && h.meta.matches) || 0} korespondans</b><br><code>#${h.id.slice(0, 8)}</code></div><div>${h.payout > 0 ? '+' : ''}${h.payout} · miz ${h.stake}</div></div>`
            )
            .join('')
        : '<p class="muted">Pa gen wonn ankò.</p>';
    }

    function sync() {
      syncTicket();
      paintGrid();
      const r = CV().state.active[GAME];
      const phase = busy ? (r && r.phase) || 'animating' : r && r.phase !== 'settled' ? r.phase : 'select';
      $('[data-phase]').textContent = phaseLabel(busy ? 'animating' : selection.size && !busy ? 'select' : phase === 'settled' ? 'select' : phase);
      $('[data-confirm]').disabled = busy || selection.size !== cfg.pickCount;
      $('[data-auto]').disabled = busy;
      $('[data-clear]').disabled = busy;
      $('[data-stake-dec]').disabled = busy || stake <= 1;
      $('[data-stake-inc]').disabled = busy || stake >= 100;
      syncHistory();
    }

    async function runAnimation(drawn, matched) {
      const lane = $('[data-drawn]');
      lane.innerHTML = '';
      const stage = $('[data-stage]');
      const ms = CV().animDuration(cfg.roundMs);
      const step = drawn.length ? ms / drawn.length : 0;
      for (let i = 0; i < drawn.length; i++) {
        const n = drawn[i];
        const fly = document.createElement('span');
        fly.className = 'fly-ball';
        fly.textContent = n;
        fly.style.left = `${20 + Math.random() * 60}%`;
        fly.style.top = `${30 + Math.random() * 30}%`;
        if (matched.includes(n)) fly.style.background = 'radial-gradient(circle at 30% 28%,#fff8,#0000 42%),#e0a820';
        stage.appendChild(fly);
        CV().Sfx.ball();
        const mini = document.createElement('span');
        mini.className = 'mini-ball' + (matched.includes(n) ? ' hit' : '');
        mini.textContent = n;
        lane.appendChild(mini);
        // highlight grid
        const btn = root.querySelector(`.ball-btn[data-n="${n}"]`);
        if (btn) {
          btn.classList.add('drawn');
          if (matched.includes(n)) btn.classList.add('hit');
        }
        await CV().wait(step);
        fly.remove();
      }
    }

    async function confirm() {
      if (busy || selection.size !== cfg.pickCount) return;
      const pick = [...selection].sort((a, b) => a - b);
      const drawn = CV().pickN(cfg.poolSize, cfg.drawCount);
      const matched = hits(pick, drawn);
      const locked = CV().lockRound(GAME, {
        stake,
        selection: pick,
        result: { drawn },
        meta: { matches: matched.length, matched }
      });
      if (!locked.ok) {
        alert(locked.error);
        return;
      }
      busy = true;
      sync();
      CV().Sfx.confirm();
      CV().markAnimating(GAME);
      $('[data-phase]').textContent = phaseLabel('animating');
      await runAnimation(drawn, matched);
      const pay = payoutFor(matched.length, stake, cfg.payoutDemo);
      CV().settleRound(GAME, pay);
      const banner = $('[data-result]');
      banner.classList.remove('hidden', 'win', 'lose');
      banner.classList.add(pay > 0 ? 'win' : 'lose');
      banner.innerHTML = `<b>${matched.length} korespondans</b><br>${pay > 0 ? `Retou demonstrasyon: +${pay}` : 'Pa gen retou'} · #${locked.round.id.slice(0, 8)}`;
      if (pay > 0) CV().Sfx.win();
      else CV().Sfx.lose();
      busy = false;
      CV().clearActive(GAME);
      sync();
    }

    // Resume unsettled round after refresh
    async function resumeIfNeeded() {
      const r = CV().state.active[GAME];
      if (!r || r.phase === 'settled') return;
      selection = new Set(r.selection || []);
      stake = r.stake;
      busy = true;
      sync();
      $('[data-phase]').textContent = phaseLabel(r.phase);
      if (r.phase === 'locked' || r.phase === 'animating') {
        CV().markAnimating(GAME);
        const matched = (r.meta && r.meta.matched) || hits(r.selection, r.result.drawn);
        await runAnimation(r.result.drawn, matched);
        const pay = payoutFor(matched.length, r.stake, cfg.payoutDemo);
        CV().settleRound(GAME, pay);
        const banner = $('[data-result]');
        banner.classList.remove('hidden');
        banner.classList.add(pay > 0 ? 'win' : 'lose');
        banner.innerHTML = `<b>Wonn rekipere</b><br>${matched.length} korespondans · ${pay > 0 ? '+' + pay : '0'} · #${r.id.slice(0, 8)}`;
      }
      busy = false;
      CV().clearActive(GAME);
      sync();
    }

    $('[data-back]').onclick = onBack;
    $('[data-rules]').onclick = () => {
      global.CashVirtualUI.openModal(
        'Règ Lucky Six (pwototip)',
        `<p>Règ <b>pwovizwa pou demonstrasyon</b> — pa prezante kòm règ ofisyèl NSoft.</p>
         <ul>
           <li>Chwazi ${cfg.pickCount} nimewo nan 1–${cfg.poolSize}.</li>
           <li>Machin nan tire ${cfg.drawCount} boul diferan.</li>
           <li>Retou yo soti nan yon tablo demonstrasyon configurable.</li>
           <li>Pa gen lajan reyèl. Kredi vityèl sèlman.</li>
         </ul>`
      );
    };
    $('[data-auto]').onclick = () => {
      if (busy) return;
      selection = new Set(CV().pickN(cfg.poolSize, cfg.pickCount));
      CV().Sfx.tap();
      sync();
    };
    $('[data-clear]').onclick = () => {
      if (busy) return;
      selection.clear();
      sync();
    };
    $('[data-confirm]').onclick = confirm;
    $('[data-stake-dec]').onclick = () => {
      if (busy) return;
      stake = Math.max(1, stake - 5);
      sync();
    };
    $('[data-stake-inc]').onclick = () => {
      if (busy) return;
      stake = Math.min(100, stake + 5);
      sync();
    };

    paintGrid();
    sync();
    resumeIfNeeded();
  }

  global.CashGames = global.CashGames || {};
  global.CashGames.lucky6 = { render, id: GAME, title: 'Lucky Six' };
})(window);
