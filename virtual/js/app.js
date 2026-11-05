(function () {
  const root = document.getElementById('app');
  const creditEl = document.getElementById('creditValue');
  const soundBtn = document.getElementById('soundBtn');
  const statusBar = document.getElementById('statusBar');
  const modalHost = document.getElementById('modalHost');

  const GAMES = [
    {
      id: 'lucky6',
      title: 'Lucky Six',
      blurb: 'Chwazi 6 nimewo · tiraj boul',
      thumb: `<svg viewBox="0 0 72 72" width="56" height="56"><circle cx="24" cy="28" r="12" fill="#008f96"/><circle cx="44" cy="40" r="14" fill="#9ef0d4"/><circle cx="50" cy="22" r="9" fill="#0d2744"/><text x="24" y="32" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">6</text></svg>`
    },
    {
      id: 'roulette',
      title: 'Woulèt',
      blurb: 'Wou Ewopeyen 0–36',
      thumb: `<svg viewBox="0 0 72 72" width="56" height="56"><circle cx="36" cy="36" r="26" fill="#0d2744"/><path d="M36 10 A26 26 0 0 1 62 36 L36 36 Z" fill="#c62828"/><path d="M36 10 A26 26 0 0 0 10 36 L36 36 Z" fill="#1a1f2b"/><circle cx="36" cy="36" r="8" fill="#008f96"/><circle cx="36" cy="14" r="3" fill="#fff"/></svg>`
    },
    {
      id: 'keno',
      title: 'Keno',
      blurb: 'Griy 1–80 · 20 nimewo',
      thumb: `<svg viewBox="0 0 72 72" width="56" height="56"><rect x="10" y="14" width="52" height="44" rx="8" fill="#e8fff7" stroke="#008f96" stroke-width="3"/><circle cx="24" cy="30" r="6" fill="#008f96"/><circle cx="36" cy="30" r="6" fill="#9ef0d4"/><circle cx="48" cy="30" r="6" fill="#0d2744"/><circle cx="24" cy="46" r="6" fill="#0d2744"/><circle cx="36" cy="46" r="6" fill="#008f96"/><circle cx="48" cy="46" r="6" fill="#9ef0d4"/></svg>`
    },
    {
      id: 'dogs',
      title: 'Kous chen',
      blurb: '6 chen · animasyon kous',
      thumb: `<svg viewBox="0 0 72 72" width="56" height="56"><rect x="8" y="40" width="56" height="16" fill="#5e9750"/><ellipse cx="34" cy="38" rx="16" ry="8" fill="#008f96"/><ellipse cx="50" cy="34" rx="9" ry="6" fill="#008f96"/><circle cx="55" cy="32" r="1.5" fill="#0d2744"/></svg>`
    },
    {
      id: 'horses',
      title: 'Kous cheval',
      blurb: 'Pis · klasman final',
      thumb: `<svg viewBox="0 0 72 72" width="56" height="56"><rect x="8" y="42" width="56" height="14" fill="#b8955a"/><ellipse cx="32" cy="38" rx="18" ry="8" fill="#1d4ed8"/><path d="M46 34 Q60 26 62 34 Q56 42 48 38 Z" fill="#1d4ed8"/><circle cx="36" cy="30" r="4" fill="#9ef0d4"/></svg>`
    }
  ];

  function updateChrome() {
    const s = CashVirtual.state;
    creditEl.textContent = Number(s.credits).toLocaleString('fr-HT');
    soundBtn.textContent = s.sound ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', s.sound ? 'Dezaktive son' : 'Aktive son');
    const on = CashVirtual.online();
    statusBar.className = 'status-bar on ' + (on ? 'online' : 'offline');
    statusBar.innerHTML = `<span class="status-dot"></span>${on ? 'Konekte' : 'Dekonekte — wonn aktif yo ap rekipere lè w tounen'}`;
  }

  function openModal(title, html) {
    modalHost.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal"><button class="btn close" type="button" data-close>Fèmen</button>
      <h2>${title}</h2>${html}</div></div>`;
    modalHost.querySelector('[data-close]').onclick = () => {
      modalHost.innerHTML = '';
    };
    modalHost.querySelector('.modal-backdrop').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) modalHost.innerHTML = '';
    });
  }
  window.CashVirtualUI = { openModal };

  function route() {
    const hash = (location.hash || '#hub').replace(/^#/, '');
    const gameId = hash.startsWith('game/') ? hash.slice(5) : null;
    updateChrome();
    if (!gameId) {
      renderHub();
      setNav('hub');
      return;
    }
    const game = CashGames[gameId];
    if (!game) {
      location.hash = '#hub';
      return;
    }
    setNav('games');
    game.render(root, {
      onBack: () => {
        location.hash = '#hub';
      }
    });
  }

  function setNav(active) {
    document.querySelectorAll('.bottom-nav [data-nav]').forEach((b) => {
      b.classList.toggle('active', b.dataset.nav === active);
    });
  }

  function renderHub() {
    root.innerHTML = `
      <div class="hub">
        <section class="hub-hero">
          <p class="brand">Cash Paryaj</p>
          <p>Jwèt vityèl · kredi vityèl pou demonstrasyon. Pa gen depo, retrè ni lajan reyèl.</p>
        </section>
        <div class="hub-grid">
          ${GAMES.map(
            (g) => `<button type="button" class="game-card" data-open="${g.id}">
              <div class="thumb">${g.thumb}</div>
              <div><h2>${g.title}</h2><p>${g.blurb}</p></div>
              <span class="go">›</span>
            </button>`
          ).join('')}
        </div>
        <div class="panel" style="margin-top:14px">
          <div class="row-between">
            <div>
              <h3 style="margin:0">Kredi vityèl</h3>
              <p class="muted" style="margin:4px 0 0">Separe nèt ak balans POS / kliyan.</p>
            </div>
            <button class="btn" type="button" data-refill>Ranpli 1000</button>
          </div>
          <p class="config-note" id="posGuard"></p>
        </div>
      </div>`;
    root.querySelectorAll('[data-open]').forEach((btn) => {
      btn.onclick = () => {
        CashVirtual.Sfx.tap();
        location.hash = `#game/${btn.dataset.open}`;
      };
    });
    root.querySelector('[data-refill]').onclick = () => {
      CashVirtual.refillDemo(1000);
      CashVirtual.Sfx.confirm();
      updateChrome();
    };
    const pos = CashVirtual.getPosBalanceSnapshot();
    document.getElementById('posGuard').textContent =
      pos == null
        ? 'Balans POS pa detekte nan navigatè sa a (nòmal si ou pa louvri POS la).'
        : `Balans POS aktyèl (pa manyen): ${pos.toFixed(2)} — jwèt yo pa modifye li.`;
  }

  soundBtn.onclick = () => {
    CashVirtual.toggleSound();
    updateChrome();
  };
  document.getElementById('navHub').onclick = () => {
    location.hash = '#hub';
  };
  document.getElementById('navGames').onclick = () => {
    location.hash = '#hub';
  };
  document.getElementById('navInfo').onclick = () => {
    openModal(
      'Sou demonstrasyon an',
      `<p>Senk jwèt vityèl orijinal pou Cash Paryaj.</p>
       <ul>
         <li>Tout tèks prensipal an kreyòl.</li>
         <li>Rezilta fikse yon sèl fwa anvan animasyon.</li>
         <li>Rafrechi / dekonekte pa double-debi ni double-kredi.</li>
         <li>Tablo rekonpans yo se demonstrasyon configurable — pa ofisyèl.</li>
         <li>Pa prezante kòm RNG sètifye.</li>
       </ul>`
    );
  };

  CashVirtual.subscribe(updateChrome);
  window.addEventListener('hashchange', route);
  window.addEventListener('online', updateChrome);
  window.addEventListener('offline', updateChrome);
  updateChrome();
  route();
})();
