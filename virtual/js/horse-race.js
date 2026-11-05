(function (global) {
  const CV = () => global.CashVirtual;
  const GAME = 'horses';

  const NAMES = ['Tonèr', 'Zeklè', 'Van', 'Flanm', 'Loray', 'Zetwal', 'Chans', 'Fòs', 'Nwa', 'Blan'];
  const COLORS = ['#c62828', '#f5c84a', '#1d4ed8', '#15803d', '#111827', '#7e22ce', '#ea580c', '#008f96'];

  function horseSvg(color) {
    return `<svg class="horse-svg" viewBox="0 0 84 46" aria-hidden="true">
      <ellipse cx="36" cy="31" rx="24" ry="9" fill="${color}"/>
      <path d="M54 27 L68 16 L76 22 L70 30 L56 32 Z" fill="${color}"/>
      <path d="M72 19 L80 13" stroke="#1a1208" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="70" cy="21" r="1.5" fill="#041018"/>
      <path d="M14 29 Q5 15 14 8" stroke="${color}" stroke-width="3.8" fill="none" stroke-linecap="round"/>
      <path d="M22 35 L20 44 M32 35 L31 44 M42 34 L44 44 M52 34 L55 44" stroke="#2a1a0c" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="40" cy="17" r="5.5" fill="#9ef0d4"/>
      <path d="M36 12 L40 5 L44 12" fill="#0d2744"/>
      <rect x="37" y="17" width="6.5" height="9" rx="2" fill="#0d2744"/>
      <path d="M38 26 L46 26 L44 31 L40 31 Z" fill="#ffe08a"/>
    </svg>`;
  }

  function progressAt(rankIndex, t, runners) {
    const finishAt = 0.7 + rankIndex * (0.28 / Math.max(1, runners - 1));
    return t >= finishAt ? 1 : Math.pow(t / finishAt, 1.12);
  }

  function render(root, { onBack }) {
    const cfg = CV().state.config.horses;
    const nRunners = cfg.runners;
    let pick = null;
    let stake = cfg.stakeDefault;
    let busy = false;

    const runners = Array.from({ length: nRunners }, (_, i) => ({
      id: i + 1,
      name: NAMES[i % NAMES.length],
      color: COLORS[i % COLORS.length]
    }));

    root.innerHTML = `
      <div class="game-view">
        <div class="row-between">
          <button class="icon-btn" type="button" data-back aria-label="Retounen">←</button>
          <h1 style="margin:0;font-size:1.1rem">Kous cheval</h1>
          <button class="btn ghost" type="button" data-rules>Règ</button>
        </div>
        <p class="muted" style="margin:0 0 6px">${nRunners} cheval · kredi vityèl · pa RNG sètifye</p>
        <span class="phase-pill" data-phase>SELEKSYON</span>
        <div class="track horse" data-track>
          <div class="finish-line" aria-hidden="true"></div>
          ${runners
            .map(
              (r, i) => `<div class="lane" style="top:${(100 / nRunners) * i}%;height:${100 / nRunners}%">
              <div class="runner" data-runner="${r.id}" style="top:50%;transform:translateY(-50%)">
                <span class="silk" style="background:${r.color};color:${r.color === '#f5c84a' ? '#0d2744' : '#fff'}">${r.id}</span>
                <div class="runner-body">${horseSvg(r.color)}</div>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <div class="panel">
          <h3>Fich seleksyon</h3>
          <p class="muted" data-pick-label>Chwazi yon cheval anvan depa.</p>
          <div class="pick-grid" data-picks></div>
          <div class="stake-box">
            <button class="btn" type="button" data-stake-dec>-</button>
            <strong data-stake>${stake}</strong>
            <button class="btn" type="button" data-stake-inc>+</button>
          </div>
          <button class="btn primary block" type="button" data-go>Depa</button>
        </div>
        <div class="result-banner hidden" data-result></div>
        <div class="panel">
          <h3>Klasman / Istorik</h3>
          <div class="history-list" data-history></div>
        </div>
        <p class="config-note">Patisipan: ${nRunners} · dire ~${Math.round(cfg.raceMs / 1000)}s · peyman demonstrasyon x${cfg.payoutDemo}.</p>
      </div>`;

    const $ = (sel) => root.querySelector(sel);

    function syncPicks() {
      const box = $('[data-picks]');
      box.innerHTML = runners
        .map(
          (r) => `<button type="button" class="pick-card${pick === r.id ? ' selected' : ''}" data-id="${r.id}" ${busy ? 'disabled' : ''}>
            <div class="pick-swatch" style="background:${r.color}"></div>
            <div>#${r.id} ${r.name}</div>
          </button>`
        )
        .join('');
      box.querySelectorAll('.pick-card').forEach((btn) => {
        btn.onclick = () => {
          if (busy) return;
          pick = Number(btn.dataset.id);
          CV().Sfx.tap();
          sync();
        };
      });
      $('[data-pick-label]').textContent = pick
        ? `Ou chwazi: #${pick} ${runners[pick - 1].name} (an evidans sou pis la)`
        : 'Chwazi yon cheval anvan depa.';
      root.querySelectorAll('[data-runner]').forEach((el) => {
        el.classList.toggle('selected', Number(el.dataset.runner) === pick);
      });
    }

    function syncHistory() {
      const list = CV().state.history[GAME] || [];
      $('[data-history]').innerHTML = list.length
        ? list
            .map((h) => {
              const order = (h.result && h.result.order) || [];
              return `<div class="history-item"><div><b>Gayan #${order[0]}</b> · ou #${(h.selection && h.selection.pick) || '?'}<br><code>#${h.id.slice(0, 8)}</code></div><div>${h.payout > 0 ? '+' : ''}${h.payout}</div></div>`;
            })
            .join('')
        : '<p class="muted">Pa gen kous ankò.</p>';
    }

    function sync() {
      syncPicks();
      $('[data-stake]').textContent = stake;
      $('[data-go]').disabled = busy || !pick;
      $('[data-go]').textContent = busy ? 'Kous an kou…' : 'Depa';
      $('[data-stake-dec]').disabled = busy || stake <= 1;
      $('[data-stake-inc]').disabled = busy || stake >= 100;
      syncHistory();
    }

    function resetPositions() {
      root.querySelectorAll('[data-runner]').forEach((el) => {
        el.style.transition = 'none';
        el.style.left = '8px';
      });
    }

    async function animateRace(order) {
      const ms = CV().animDuration(cfg.raceMs);
      const track = $('[data-track]');
      const maxLeft = Math.max(40, track.clientWidth - 78);
      const rankOf = {};
      order.forEach((id, idx) => {
        rankOf[id] = idx;
      });
      if (!ms) {
        order.forEach((id) => {
          const el = root.querySelector(`[data-runner="${id}"]`);
          if (el) el.style.left = maxLeft + 'px';
        });
        return;
      }
      const start = performance.now();
      return new Promise((resolve) => {
        function frame(now) {
          const t = Math.min(1, (now - start) / ms);
          runners.forEach((r) => {
            const p = progressAt(rankOf[r.id], t, nRunners);
            const el = root.querySelector(`[data-runner="${r.id}"]`);
            if (el) el.style.left = 8 + p * (maxLeft - 8) + 'px';
          });
          if (t < 1) requestAnimationFrame(frame);
          else {
            order.forEach((id) => {
              const el = root.querySelector(`[data-runner="${id}"]`);
              if (el) el.style.left = maxLeft + 'px';
            });
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    }

    async function startRace() {
      if (busy || !pick) return;
      const order = CV().shuffle(runners.map((r) => r.id));
      const locked = CV().lockRound(GAME, {
        stake,
        selection: { pick },
        result: { order }
      });
      if (!locked.ok) {
        alert(locked.error);
        return;
      }
      busy = true;
      sync();
      $('[data-phase]').textContent = 'SELEKSYON FÈMEN';
      CV().Sfx.start();
      CV().markAnimating(GAME);
      $('[data-phase]').textContent = 'KOUS';
      resetPositions();
      await CV().wait(180);
      await animateRace(order);
      const won = order[0] === pick;
      const pay = won ? Math.round(stake * cfg.payoutDemo * 100) / 100 : 0;
      CV().settleRound(GAME, pay);
      const banner = $('[data-result]');
      banner.classList.remove('hidden', 'win', 'lose');
      banner.classList.add(won ? 'win' : 'lose');
      banner.innerHTML = `<b>Klasman final:</b> ${order.map((id) => '#' + id).join(' · ')}<br>${won ? 'Ou genyen +' + pay : 'Ou pedi'} · #${locked.round.id.slice(0, 8)}`;
      if (won) CV().Sfx.win();
      else CV().Sfx.lose();
      busy = false;
      CV().clearActive(GAME);
      $('[data-phase]').textContent = 'REZILTA';
      sync();
    }

    async function resumeIfNeeded() {
      const r = CV().state.active[GAME];
      if (!r || r.phase === 'settled') return;
      pick = r.selection.pick;
      stake = r.stake;
      busy = true;
      sync();
      $('[data-phase]').textContent = 'REKIPERE WONN';
      CV().markAnimating(GAME);
      resetPositions();
      await animateRace(r.result.order);
      const won = r.result.order[0] === pick;
      const pay = won ? Math.round(r.stake * cfg.payoutDemo * 100) / 100 : 0;
      CV().settleRound(GAME, pay);
      $('[data-result]').classList.remove('hidden');
      $('[data-result]').innerHTML = `<b>Wonn rekipere</b><br>Klasman ${r.result.order.map((id) => '#' + id).join(' · ')} · ${pay}`;
      busy = false;
      CV().clearActive(GAME);
      sync();
    }

    $('[data-back]').onclick = onBack;
    $('[data-rules]').onclick = () =>
      global.CashVirtualUI.openModal(
        'Règ Kous cheval (pwototip)',
        `<ul>
          <li>${nRunners} cheval ak kavalye/nimewo/koulè diferan.</li>
          <li>Seleksyon anvan depa; fèmen pandan kous la.</li>
          <li>Cheval ou chwazi a rete an evidans.</li>
          <li>Lòd arive = klasman final. Kredi vityèl sèlman.</li>
        </ul>`
      );
    $('[data-go]').onclick = startRace;
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

    resetPositions();
    sync();
    resumeIfNeeded();
  }

  global.CashGames = global.CashGames || {};
  global.CashGames.horses = { render, id: GAME, title: 'Kous cheval' };
})(window);
