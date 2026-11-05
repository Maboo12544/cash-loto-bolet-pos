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
    let stake = cfg.stakeDefault;

    root.innerHTML = `
      <div class="game-view l6-cp" id="l6">
        <div class="l6-top">
          <button class="icon-btn" type="button" data-back aria-label="Retounen">←</button>
          <div class="l6-brand">
            <b>Sis Chans</b>
            <small>Cash Paryaj · sak tiraj k ap vire</small>
          </div>
          <button class="btn ghost" type="button" data-rules>Règ</button>
        </div>

        <div class="l6-drawboard" data-stage>
          <div class="l6-drawboard-head">
            <span>SAK TIRAJ</span>
            <b data-draw-count>0 / ${cfg.drawCount}</b>
          </div>
          <div class="l6-machine">
            <div class="l6-sack-wrap">
              <div class="l6-sack" data-sack aria-label="Sak boul k ap vire">
                <div class="l6-sack-inner" data-sack-inner>
                  ${Array.from({ length: 10 }, (_, i) => `<i class="l6-tumble" style="--i:${i}"></i>`).join('')}
                </div>
                <div class="l6-sack-mouth" aria-hidden="true"></div>
              </div>
              <div class="l6-eject" data-eject aria-live="polite"></div>
            </div>
            <div class="l6-recent">
              <div class="l6-recent-label">Tiraj ki fèk · menm moman</div>
              <div class="l6-recent-rail" data-recent></div>
            </div>
          </div>
        </div>

        <div class="l6-hero">
          <div class="l6-side" style="grid-column:1/-1">
            <span class="phase-pill" data-phase>SELEKSYON</span>
            <div class="l6-sockets" data-ticket aria-label="Fich 6 nimewo"></div>
            <div class="l6-meter" aria-hidden="true"><i data-meter></i></div>
            <div class="row-between"><span class="muted">Fich</span><b data-count>0 / ${cfg.pickCount}</b></div>
            <div class="stake-box l6-stake">
              <button class="btn" type="button" data-stake-dec>−</button>
              <strong data-stake>${stake}</strong>
              <button class="btn" type="button" data-stake-inc>+</button>
            </div>
            <p class="muted" style="text-align:center;margin:0">Miz · kredi vityèl</p>
          </div>
        </div>

        <div class="l6-actions">
          <button class="btn" type="button" data-auto>Oto</button>
          <button class="btn danger" type="button" data-clear>Efase</button>
          <button class="btn primary" type="button" data-confirm>Konfime fich</button>
        </div>

        <div class="l6-grid" data-grid></div>
        <div class="result-banner hidden" data-result></div>
        <div class="panel">
          <h3>Istorik Sis Chans</h3>
          <div class="history-list" data-history></div>
        </div>
        <p class="config-note">Sak la vire, boul soti youn apre lòt, epi tiraj ki fèk yo rete vizib an menm tan. Demonstrasyon · configurable.</p>
      </div>`;

    const $ = (sel) => root.querySelector(sel);

    function phaseLabel(p) {
      return ({ select: 'SELEKSYON', locked: 'FICH FÈMEN', animating: 'TIRAJ', settled: 'REZILTA' }[p] || p);
    }

    function setSpinning(on) {
      const sack = $('[data-sack]');
      if (!sack) return;
      sack.classList.toggle('spinning', !!on);
      if (CV().reducedMotion()) sack.classList.remove('spinning');
    }

    function paintSockets(matchedSet) {
      const box = $('[data-ticket]');
      const picks = [...selection].sort((a, b) => a - b);
      box.innerHTML = '';
      for (let i = 0; i < cfg.pickCount; i++) {
        const slot = document.createElement('div');
        slot.className = 'l6-socket';
        if (picks[i] != null) {
          slot.classList.add('filled');
          if (matchedSet && matchedSet.has(picks[i])) slot.classList.add('hit');
          slot.textContent = picks[i];
        } else {
          slot.innerHTML = `<span>${i + 1}</span>`;
        }
        box.appendChild(slot);
      }
      $('[data-meter]').style.width = (selection.size / cfg.pickCount) * 100 + '%';
      $('[data-count]').textContent = `${selection.size} / ${cfg.pickCount}`;
      $('[data-stake]').textContent = stake;
    }

    function paintGrid(drawn = [], matched = []) {
      const grid = $('[data-grid]');
      grid.innerHTML = '';
      for (let n = 1; n <= cfg.poolSize; n++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'l6-cell';
        b.textContent = n;
        b.dataset.n = n;
        if (selection.has(n)) b.classList.add('selected');
        if (drawn.includes(n)) b.classList.add('drawn');
        if (matched.includes(n)) b.classList.add('hit');
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

    function syncHistory() {
      const box = $('[data-history]');
      const list = CV().state.history[GAME] || [];
      box.innerHTML = list.length
        ? list
            .map(
              (h) =>
                `<div class="history-item"><div><b>${(h.meta && h.meta.matches) || 0} korespondans</b><br><code>#${h.id.slice(0, 8)}</code></div><div>${h.payout > 0 ? '+' : ''}${h.payout} · miz ${h.stake}</div></div>`
            )
            .join('')
        : '<p class="muted">Pa gen wonn ankò.</p>';
    }

    function sync(drawn, matched) {
      paintSockets(matched ? new Set(matched) : null);
      paintGrid(drawn || [], matched || []);
      $('[data-phase]').textContent = phaseLabel(busy ? 'animating' : 'select');
      $('[data-confirm]').disabled = busy || selection.size !== cfg.pickCount;
      $('[data-auto]').disabled = busy;
      $('[data-clear]').disabled = busy;
      $('[data-stake-dec]').disabled = busy || stake <= 1;
      $('[data-stake-inc]').disabled = busy || stake >= 100;
      syncHistory();
    }

    function clearDrawUI() {
      $('[data-recent]').innerHTML = '';
      $('[data-eject]').innerHTML = '';
      $('[data-draw-count]').textContent = `0 / ${cfg.drawCount}`;
      setSpinning(false);
    }

    async function runAnimation(drawn, matched) {
      const recent = $('[data-recent]');
      const eject = $('[data-eject]');
      recent.innerHTML = '';
      eject.innerHTML = '';
      $('[data-draw-count]').textContent = `0 / ${drawn.length}`;
      setSpinning(true);

      const ms = CV().animDuration(cfg.roundMs);
      const step = drawn.length ? Math.max(ms / drawn.length, CV().reducedMotion() ? 0 : 180) : 0;
      const seen = [];

      for (let i = 0; i < drawn.length; i++) {
        const n = drawn[i];
        const isHit = matched.includes(n);
        seen.push(n);

        // Ball exits the spinning sack
        const out = document.createElement('div');
        out.className = 'l6-ball-out' + (isHit ? ' hit' : '');
        out.textContent = n;
        eject.innerHTML = '';
        eject.appendChild(out);
        CV().Sfx.ball();

        // Same moment: add to "tiraj ki fèk" rail
        const chip = document.createElement('span');
        chip.className = 'l6-recent-ball' + (isHit ? ' hit' : '');
        chip.textContent = n;
        chip.title = `Boul #${i + 1}`;
        recent.appendChild(chip);
        recent.scrollLeft = recent.scrollWidth;

        $('[data-draw-count]').textContent = `${i + 1} / ${drawn.length}`;
        paintGrid(seen, matched.filter((x) => seen.includes(x)));
        paintSockets(new Set(matched.filter((x) => seen.includes(x))));

        await CV().wait(step);
      }

      setSpinning(false);
      // Keep last ejected ball visible briefly
      paintGrid(drawn, matched);
      paintSockets(new Set(matched));
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
      sync(drawn, matched);
      $('[data-phase]').textContent = phaseLabel('settled');
    }

    async function resumeIfNeeded() {
      const r = CV().state.active[GAME];
      if (!r || r.phase === 'settled') return;
      selection = new Set(r.selection || []);
      stake = r.stake;
      busy = true;
      sync();
      $('[data-phase]').textContent = 'REKIPERE';
      CV().markAnimating(GAME);
      const matched = (r.meta && r.meta.matched) || hits(r.selection, r.result.drawn);
      await runAnimation(r.result.drawn, matched);
      const pay = payoutFor(matched.length, r.stake, cfg.payoutDemo);
      CV().settleRound(GAME, pay);
      const banner = $('[data-result]');
      banner.classList.remove('hidden');
      banner.classList.add(pay > 0 ? 'win' : 'lose');
      banner.innerHTML = `<b>Wonn rekipere</b><br>${matched.length} korespondans · ${pay > 0 ? '+' + pay : '0'} · #${r.id.slice(0, 8)}`;
      busy = false;
      CV().clearActive(GAME);
      sync(r.result.drawn, matched);
    }

    $('[data-back]').onclick = onBack;
    $('[data-rules]').onclick = () => {
      global.CashVirtualUI.openModal(
        'Règ Sis Chans',
        `<p><b>Sis Chans</b> — sak tiraj Cash Paryaj.</p>
         <ul>
           <li>Chwazi ${cfg.pickCount} nimewo nan 1–${cfg.poolSize}.</li>
           <li>Sak la vire, epi boul yo soti youn apre lòt.</li>
           <li>Ray « Tiraj ki fèk » montre boul yo an menm tan yo soti.</li>
           <li>Rezilta fikse anvan animasyon. Kredi vityèl sèlman.</li>
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
      clearDrawUI();
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

    clearDrawUI();
    sync();
    resumeIfNeeded();
  }

  global.CashGames = global.CashGames || {};
  global.CashGames.lucky6 = { render, id: GAME, title: 'Sis Chans' };
})(window);
