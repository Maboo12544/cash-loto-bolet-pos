(function (global) {
  const CV = () => global.CashVirtual;
  const GAME = 'dogs';

  const DOG_NAMES = ['Zeklè', 'Tonè', 'Van', 'Flanm', 'Loray', 'Zetwal', 'Chans', 'Fòs'];
  const COLORS = ['#008f96', '#c62828', '#1a3a5c', '#e0a820', '#7c3aed', '#0f7a3a', '#ea580c', '#0ea5e9'];

  function dogSvg(color) {
    return `<svg class="dog-svg" viewBox="0 0 64 40" aria-hidden="true">
      <ellipse cx="28" cy="28" rx="18" ry="8" fill="${color}"/>
      <ellipse cx="44" cy="22" rx="10" ry="7" fill="${color}"/>
      <circle cx="50" cy="20" r="2" fill="#0d2744"/>
      <path d="M52 18 L58 14 L54 20 Z" fill="${color}"/>
      <path d="M12 26 Q6 18 10 14" stroke="${color}" stroke-width="3" fill="none"/>
      <rect x="18" y="30" width="3" height="8" rx="1" fill="#0d2744"/>
      <rect x="26" y="30" width="3" height="8" rx="1" fill="#0d2744"/>
      <rect x="34" y="29" width="3" height="8" rx="1" fill="#0d2744"/>
      <rect x="40" y="29" width="3" height="8" rx="1" fill="#0d2744"/>
    </svg>`;
  }

  /** Klasman fikse → pozisyon 0..1 sou tan (ekwasyon ki asire lòd arive = klasman) */
  function progressAt(rankIndex, t, runners) {
    // rankIndex 0 = winner finishes at t=1 first
    const finishAt = 0.72 + rankIndex * (0.25 / Math.max(1, runners - 1));
    const eased = t >= finishAt ? 1 : Math.pow(t / finishAt, 1.15);
    // slight noise but never overtake wrong order near end
    return Math.min(1, eased);
  }

  function render(root, { onBack }) {
    const cfg = CV().state.config.dogs;
    const nRunners = cfg.runners;
    let pick = null;
    let stake = cfg.stakeDefault;
    let busy = false;

    const runners = Array.from({ length: nRunners }, (_, i) => ({
      id: i + 1,
      name: DOG_NAMES[i % DOG_NAMES.length],
      color: COLORS[i % COLORS.length]
    }));

    root.innerHTML = `
      <div class="game-view">
        <div class="row-between">
          <button class="icon-btn" type="button" data-back aria-label="Retounen">←</button>
          <h1 style="margin:0;font-size:1.1rem">Kous chen</h1>
          <button class="btn ghost" type="button" data-rules>Règ</button>
        </div>
        <div class="demo-banner">Demonstrasyon · Kredi vityèl · ${nRunners} chen · Pa RNG sètifye</div>
        <span class="phase-pill" data-phase>SELEKSYON</span>
        <div class="track" data-track>
          <div class="finish-line" aria-hidden="true"></div>
          ${runners
            .map(
              (r, i) => `<div class="lane" style="top:${(100 / nRunners) * i}%;height:${100 / nRunners}%">
              <div class="runner" data-runner="${r.id}" style="top:50%;transform:translateY(-50%)">
                <span class="silk" style="background:${r.color}">${r.id}</span>
                <div class="runner-body">${dogSvg(r.color)}</div>
              </div>
            </div>`
            )
            .join('')}
        </div>
        <div class="panel">
          <h3>Fich seleksyon</h3>
          <p class="muted" data-pick-label>Chwazi yon chen anvan depa.</p>
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
        <p class="config-note">Patisipan: ${nRunners} · dire kous ~${Math.round(cfg.raceMs / 1000)}s · peyman demonstrasyon x${cfg.payoutDemo}.</p>
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
        ? `Ou chwazi: #${pick} ${runners[pick - 1].name}`
        : 'Chwazi yon chen anvan depa.';
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
      const maxLeft = Math.max(40, track.clientWidth - 70);
      // Map dog id -> rank index
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
            // Ensure exact finish order visually: winners fully at finish
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
      // Fix ranking once
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
      await CV().wait(200);
      await animateRace(order);
      const won = order[0] === pick;
      const pay = won ? Math.round(stake * cfg.payoutDemo * 100) / 100 : 0;
      CV().settleRound(GAME, pay);
      const banner = $('[data-result]');
      banner.classList.remove('hidden', 'win', 'lose');
      banner.classList.add(won ? 'win' : 'lose');
      banner.innerHTML = `<b>Klasman:</b> ${order.map((id) => '#' + id).join(' · ')}<br>${won ? 'Ou genyen +' + pay : 'Ou pedi'} · #${locked.round.id.slice(0, 8)}`;
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
        'Règ Kous chen (pwototip)',
        `<ul>
          <li>${nRunners} chen ak nimewo/koulè diferan.</li>
          <li>Chwazi anvan depa — seleksyon fèmen lè kous la kòmanse.</li>
          <li>Lòd franchisman liy arive a egzakteman klasman final la.</li>
          <li>Kredi vityèl sèlman · peyman demonstrasyon configurable.</li>
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
  global.CashGames.dogs = { render, id: GAME, title: 'Kous chen' };
})(window);
