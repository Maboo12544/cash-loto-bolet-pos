(function (global) {
  const CV = () => global.CashVirtual;
  const GAME = 'lucky6';
  const COLORS = [
    '#ff1537', '#135dff', '#ff9900', '#00c766', '#00b9e3', '#155eff', '#e51a32', '#858591',
    '#00be75', '#008d80', '#08bada', '#eebf11', '#c111cf', '#9844e6', '#ff7622', '#dd1835'
  ];

  function hits(selection, drawn) {
    const set = new Set(drawn);
    return selection.filter((n) => set.has(n));
  }

  function payoutFor(matchCount, stake, table) {
    const mult = table[matchCount] ?? 0;
    return Math.round(stake * mult * 100) / 100;
  }

  function ballEl(n, extraClass) {
    const b = document.createElement('span');
    b.className = 'l6m-ball' + (extraClass ? ' ' + extraClass : '');
    b.style.setProperty('--color', COLORS[(n - 1) % COLORS.length]);
    b.textContent = n;
    return b;
  }

  function render(root, { onBack }) {
    const cfg = CV().state.config.lucky6;
    let selection = new Set();
    let busy = false;
    let stake = cfg.stakeDefault;
    let page = 'play'; // play | confirm | results | history
    let lastDrawn = [];
    let lastMatched = [];

    root.innerHTML = `
      <div class="l6m" id="l6">
        <div class="l6m-notice"><span>CASH PARYAJ · LUCKY 6</span><span>BALANS KONT</span></div>
        <div class="l6m-screen">
          <div class="l6m-toprow">
            <button class="l6m-back" type="button" data-back aria-label="Retounen">←</button>
            <div class="l6m-balance"><small>BALANS</small><b data-balance>0</b></div>
          </div>
          <div class="l6m-clock">TIRAJ TÈS<strong data-clock>00:35</strong><small data-round>TOU #001</small><small data-clock-sub>Apre konfimasyon</small></div>
          <span class="l6m-badge">● DEMO</span>

          <div class="l6m-page" data-page="play">
            <div class="l6m-tabs">
              <button type="button" class="active" data-tab="choose">CHWAZI BOUL</button>
              <button type="button" data-tab="auto">CHWA OTOMATIK</button>
              <button type="button" data-tab="rules">RÈG JWÈT LA</button>
            </div>
            <div class="l6m-board">
              <div class="l6m-board-head"><span>CHWAZI 6 NIMEWO (1–48)</span><span data-count>0 / 6</span></div>
              <div class="l6m-mini" data-mini></div>
              <div class="l6m-grid" data-grid></div>
            </div>
            <div class="l6m-actions">
              <button type="button" data-auto>⤨ CHWA OTOMATIK</button>
              <button type="button" data-clear>⌫ EFASE TOUT</button>
            </div>
            <div class="l6m-stake">
              <label>MONTAN TÈS</label>
              <button type="button" data-stake-dec>−</button>
              <strong data-stake>${stake}</strong>
              <button type="button" data-stake-inc>+</button>
            </div>
            <button class="l6m-primary" type="button" data-review>VERIFYE TIKÈ ›</button>
          </div>

          <div class="l6m-page hidden" data-page="confirm">
            <div class="l6m-confirm-nums" data-selected></div>
            <div class="l6m-confirm-row">
              <div class="l6m-clock l6m-clock-inline">TIRAJ TÈS<strong data-clock>00:35</strong><small data-round>TOU #001</small></div>
              <div class="l6m-cards">
                <div class="l6m-card"><span>MONTAN TÈS</span><b data-amount></b></div>
                <div class="l6m-card gold"><span>MÒD DEMONSTRASYON</span><b>PA GEN PEMAN</b></div>
              </div>
            </div>
            <button class="l6m-primary go" type="button" data-go>✓ KONFIME EPI JWE</button>
            <button class="l6m-edit" type="button" data-edit>✎ MODIFYE NIMEWO YO</button>
            <div class="l6m-how">
              <h2>❔ KIJAN POU JWE LUCKY 6</h2>
              <div class="l6m-steps">
                <div><b>①</b>Chwazi 6 nimewo<br>(1–48)</div>
                <div><b>②</b>Konfime tikè tès ou</div>
                <div><b>③</b>Suiv tiraj<br>35 boul la</div>
                <div><b>④</b>Gade konbyen ou jwenn</div>
              </div>
            </div>
          </div>

          <div class="l6m-page hidden" data-page="results">
            <div class="l6m-results-head">
              <h2 data-result-title>Tiraj an kou</h2>
              <p data-progress>Kòmanse yon tiraj pou wè rezilta.</p>
            </div>
            <div class="l6m-live">
              <div class="l6m-sack spinning-off" data-sack>
                <div class="l6m-sack-inner">${Array.from({ length: 10 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
                <div class="l6m-eject" data-eject></div>
              </div>
              <div class="l6m-drawn" data-drawn></div>
            </div>
            <p class="l6m-status" data-status role="status">Seleksyon an fèmen. Boul yo ap soti nan sak la.</p>
            <button class="l6m-primary" type="button" data-again hidden>Retounen nan jwèt la</button>
          </div>

          <div class="l6m-page hidden" data-page="history">
            <h2 class="l6m-hist-title">Istwa sesyon an</h2>
            <div class="l6m-entries" data-history></div>
            <button class="l6m-primary" type="button" data-back-play>Retounen</button>
          </div>

          <nav class="l6m-nav">
            <button type="button" data-nav="play" class="active"><b>⌂</b>Jwe</button>
            <button type="button" data-nav="results"><b>▥</b>Rezilta</button>
            <button type="button" data-nav="history"><b>◷</b>Istwa</button>
            <button type="button" data-nav="rules"><b>•••</b>Plis</button>
          </nav>
        </div>
        <div class="l6m-foot">Demo lokal · Yon sèl balans kont (POS + jwèt)</div>
      </div>`;

    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => [...root.querySelectorAll(sel)];

    function showPage(name) {
      page = name;
      $$('.l6m-page').forEach((p) => p.classList.toggle('hidden', p.dataset.page !== name));
      $$('.l6m-nav [data-nav]').forEach((b) => b.classList.toggle('active', b.dataset.nav === name));
    }

    function paintGrid() {
      const grid = $('[data-grid]');
      grid.innerHTML = '';
      for (let n = 1; n <= cfg.poolSize; n++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'l6m-ball';
        b.style.setProperty('--color', COLORS[(n - 1) % COLORS.length]);
        b.textContent = n;
        b.setAttribute('aria-pressed', String(selection.has(n)));
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

    function sync() {
      const bal = CV().state.credits;
      $$('[data-balance]').forEach((el) => (el.textContent = '$' + Number(bal).toFixed(2)));
      $$('[data-stake]').forEach((el) => (el.textContent = '$' + Number(stake).toFixed(2)));
      $('[data-count]').textContent = `${selection.size} / ${cfg.pickCount}`;
      const mini = $('[data-mini]');
      mini.innerHTML = '';
      [...selection].sort((a, b) => a - b).forEach((n) => mini.appendChild(ballEl(n)));
      paintGrid();
      $('[data-review]').disabled = busy || selection.size !== cfg.pickCount;
      $('[data-auto]').disabled = busy;
      $('[data-clear]').disabled = busy;
      syncHistory();
      const hist = CV().state.history[GAME] || [];
      const tou = String((hist.length || 0) + 1).padStart(3, '0');
      $$('[data-round]').forEach((el) => (el.textContent = 'TOU #' + tou));
    }

    function syncHistory() {
      const box = $('[data-history]');
      const list = CV().state.history[GAME] || [];
      if (!list.length) {
        box.innerHTML = '<p class="l6m-empty">Pa gen tikè ankò.</p>';
        return;
      }
      box.innerHTML = list
        .map((h, i) => {
          const nums = (h.selection || []).join(' – ');
          const hitsN = (h.meta && h.meta.matches) || 0;
          return `<div class="l6m-entry">Tou #${String(list.length - i).padStart(3, '0')} · ${nums} · ${hitsN}/6 · $${Number(h.stake).toFixed(2)} · ${h.payout > 0 ? '+$' + Number(h.payout).toFixed(2) : '$0.00'}</div>`;
        })
        .join('');
    }

    function openRules() {
      global.CashVirtualUI.openModal(
        'Lucky 6 · Demo',
        `<p>Chwazi 6 nimewo diferan ant 1 ak 48.<br>
         Chwa otomatik chwazi 6 nimewo pou ou.<br>
         Montan: 1–100 pwen tès.<br>
         Apre konfimasyon, ${cfg.drawCount} boul soti nan sak la san repetisyon.<br>
         Rezilta a montre konbyen nimewo ou jwenn.<br>
         Pa gen peman nan vèsyon tès sa a.</p>`
      );
    }

    async function runDraw(drawn, matched) {
      const sack = $('[data-sack]');
      const eject = $('[data-eject]');
      const drawnBox = $('[data-drawn]');
      drawnBox.innerHTML = '';
      eject.innerHTML = '';
      sack.classList.add('spinning');
      if (CV().reducedMotion()) sack.classList.remove('spinning');

      $('[data-result-title]').textContent = 'Tiraj an kou';
      $('[data-status]').textContent = 'Seleksyon an fèmen. Boul yo ap soti nan sak la.';
      $('[data-again]').hidden = true;

      const ms = CV().animDuration(cfg.roundMs);
      const step = drawn.length ? Math.max(ms / drawn.length, CV().reducedMotion() ? 0 : 160) : 0;
      let hitCount = 0;

      for (let i = 0; i < drawn.length; i++) {
        const n = drawn[i];
        const isHit = matched.includes(n);
        if (isHit) hitCount++;

        const out = ballEl(n, 'l6m-eject-ball' + (isHit ? ' hit' : ''));
        eject.innerHTML = '';
        eject.appendChild(out);
        CV().Sfx.ball();

        const chip = ballEl(n, isHit ? 'hit' : '');
        drawnBox.appendChild(chip);
        drawnBox.scrollTop = drawnBox.scrollHeight;

        $('[data-progress]').textContent = `${i + 1}/${drawn.length} boul · ${hitCount}/6 nimewo jwenn`;
        await CV().wait(step);
      }

      sack.classList.remove('spinning');
      lastDrawn = drawn;
      lastMatched = matched;
    }

    async function startRound() {
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
      showPage('results');
      await runDraw(drawn, matched);
      const pay = payoutFor(matched.length, stake, cfg.payoutDemo);
      CV().settleRound(GAME, pay);
      $('[data-result-title]').textContent =
        matched.length === 6 ? 'Tout 6 nimewo yo soti!' : matched.length + ' sou 6 nimewo soti';
      $('[data-status]').textContent =
        pay > 0 ? `Retou demonstrasyon +${pay} · #${locked.round.id.slice(0, 8)}` : `Pa gen retou · #${locked.round.id.slice(0, 8)}`;
      if (pay > 0) CV().Sfx.win();
      else CV().Sfx.lose();
      $('[data-again]').hidden = false;
      busy = false;
      CV().clearActive(GAME);
      sync();
    }

    async function resumeIfNeeded() {
      const r = CV().state.active[GAME];
      if (!r || r.phase === 'settled') return;
      selection = new Set(r.selection || []);
      stake = r.stake;
      busy = true;
      sync();
      showPage('results');
      CV().markAnimating(GAME);
      const matched = (r.meta && r.meta.matched) || hits(r.selection, r.result.drawn);
      await runDraw(r.result.drawn, matched);
      const pay = payoutFor(matched.length, r.stake, cfg.payoutDemo);
      CV().settleRound(GAME, pay);
      $('[data-result-title]').textContent = 'Wonn rekipere';
      $('[data-status]').textContent = `${matched.length}/6 · ${pay > 0 ? '+' + pay : '0'} · #${r.id.slice(0, 8)}`;
      $('[data-again]').hidden = false;
      busy = false;
      CV().clearActive(GAME);
      sync();
    }

    $('[data-back]').onclick = onBack;
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
    $('[data-review]').onclick = () => {
      if (selection.size !== cfg.pickCount) return;
      const box = $('[data-selected]');
      box.innerHTML = '';
      [...selection].sort((a, b) => a - b).forEach((n) => box.appendChild(ballEl(n)));
      $('[data-amount]').textContent = '$' + Number(stake).toFixed(2);
      showPage('confirm');
    };
    $('[data-edit]').onclick = () => showPage('play');
    $('[data-go]').onclick = startRound;
    $('[data-again]').onclick = () => {
      selection.clear();
      showPage('play');
      sync();
    };
    $('[data-back-play]').onclick = () => showPage('play');

    $$('.l6m-tabs [data-tab]').forEach((btn) => {
      btn.onclick = () => {
        if (btn.dataset.tab === 'auto') $('[data-auto]').click();
        else if (btn.dataset.tab === 'rules') openRules();
        $$('.l6m-tabs button').forEach((b) => b.classList.toggle('active', b === btn || (btn.dataset.tab === 'choose' && b.dataset.tab === 'choose')));
        if (btn.dataset.tab === 'choose') btn.classList.add('active');
      };
    });

    $$('.l6m-nav [data-nav]').forEach((btn) => {
      btn.onclick = () => {
        if (btn.dataset.nav === 'rules') return openRules();
        if (btn.dataset.nav === 'results' && !lastDrawn.length && !busy) {
          $('[data-result-title]').textContent = 'Rezilta tiraj la';
          $('[data-progress]').textContent = 'Kòmanse yon tiraj pou wè rezilta.';
        }
        if (btn.dataset.nav === 'results' && lastDrawn.length) {
          const box = $('[data-drawn]');
          box.innerHTML = '';
          lastDrawn.forEach((n) => box.appendChild(ballEl(n, lastMatched.includes(n) ? 'hit' : '')));
        }
        showPage(btn.dataset.nav);
        sync();
      };
    });

    sync();
    showPage('play');
    resumeIfNeeded();
  }

  global.CashGames = global.CashGames || {};
  global.CashGames.lucky6 = { render, id: GAME, title: 'Lucky 6' };
})(window);
