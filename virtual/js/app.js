(function () {
  const AUTH_KEY = 'cash-paryaj-virtual-auth-demo-v1';
  const root = document.getElementById('app');
  const creditEl = document.getElementById('creditValue');
  const soundBtn = document.getElementById('soundBtn');
  const statusBar = document.getElementById('statusBar');
  const modalHost = document.getElementById('modalHost');
  const authGate = document.getElementById('authGate');

  const GAMES = [
    { id: 'lucky6', title: 'Lucky 6', blurb: 'Modèl Cash Paryaj · 6 nan 48' },
    { id: 'roulette', title: 'Woulèt', blurb: 'Ewopeyen 0–36' },
    { id: 'keno', title: 'Keno', blurb: '1–80 · 20 tire' },
    { id: 'dogs', title: 'Kous chen', blurb: '6 chen · pis nèt' },
    { id: 'horses', title: 'Kous cheval', blurb: '8 cheval · klasman' }
  ];

  function loadAuth() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch {
      return null;
    }
  }
  function saveAuth(a) {
    if (!a) localStorage.removeItem(AUTH_KEY);
    else localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  }
  function isAuthed() {
    const a = loadAuth();
    return !!(a && a.email);
  }

  function fmtMoney(n) {
    return '$' + Number(n || 0).toFixed(2);
  }

  function updateChrome() {
    const s = CashVirtual.state;
    creditEl.textContent = fmtMoney(s.credits);
    soundBtn.textContent = s.sound ? '🔊' : '🔇';
    const on = CashVirtual.online();
    statusBar.className = 'status-bar on ' + (on ? 'online' : 'offline');
    statusBar.innerHTML = `<span class="status-dot"></span>${on ? 'Konekte' : 'Dekonekte — wonn aktif yo ap rekipere'}`;
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

  function showAuth(force) {
    if (isAuthed() && !force) {
      authGate.hidden = true;
      return;
    }
    authGate.hidden = false;
  }

  function completeAuth(email) {
    const remember = document.getElementById('rememberMe').checked;
    const session = { email: email || 'demo@cashparyaj.ht', at: Date.now(), demo: true };
    if (remember) saveAuth(session);
    else sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
    // also keep a short session even without remember
    if (!remember) saveAuth(session);
    authGate.hidden = true;
    CashVirtual.Sfx.confirm();
    route();
  }

  function wireAuth() {
    const pass = document.getElementById('authPass');
    const passField = document.getElementById('passField');
    document.getElementById('togglePass').onclick = () => {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      passField.classList.toggle('autofill', show);
    };
    document.getElementById('signInBtn').onclick = () => {
      const email = document.getElementById('authEmail').value.trim() || 'demo@cashparyaj.ht';
      completeAuth(email);
    };
    document.getElementById('registerBtn').onclick = () => {
      completeAuth(document.getElementById('authEmail').value.trim() || 'nouvo@cashparyaj.ht');
    };
    document.getElementById('authClose').onclick = () => {
      // Fèmen san sesyon → rete sou gate, men pèmèt gade hub lekti?
      // Demo: fèmen = sesyon envite pou ka wè UI a
      completeAuth('envite@cashparyaj.ht');
    };
    document.getElementById('forgotLink').onclick = (e) => {
      e.preventDefault();
      openModal('Bliye modpas', '<p>Demonstrasyon sèlman — pa gen reset reyèl. Peze Konekte pou antre ak balans kont lan.</p>');
    };
    document.getElementById('userBtn').onclick = () => showAuth(true);
    document.getElementById('menuBtn').onclick = () => {
      openModal(
        'Meni',
        `<p><b>Cash Paryaj</b> · Yon sèl balans kont</p>
         <p class="muted">Balans: <b>${fmtMoney(CashVirtual.state.credits)}</b></p>
         <button class="btn block" type="button" id="mSound">${CashVirtual.state.sound ? 'Dezaktive son' : 'Aktive son'}</button>
         <button class="btn block" type="button" id="mRefill" style="margin-top:8px">Ranpli balans kont ($1000)</button>
         <button class="btn block" type="button" id="mPos" style="margin-top:8px">Retounen POS</button>
         <button class="btn danger block" type="button" id="mOut" style="margin-top:8px">Dekonekte</button>`
      );
      modalHost.querySelector('#mSound').onclick = () => {
        CashVirtual.toggleSound();
        updateChrome();
        modalHost.innerHTML = '';
      };
      modalHost.querySelector('#mRefill').onclick = () => {
        CashVirtual.refillDemo(1000);
        updateChrome();
        modalHost.innerHTML = '';
      };
      modalHost.querySelector('#mPos').onclick = () => {
        location.href = '../index.html';
      };
      modalHost.querySelector('#mOut').onclick = () => {
        saveAuth(null);
        sessionStorage.removeItem(AUTH_KEY);
        modalHost.innerHTML = '';
        showAuth(true);
      };
    };
  }

  function setNav(active) {
    document.querySelectorAll('.bottom-nav [data-nav]').forEach((b) => {
      b.classList.toggle('active', b.dataset.nav === active);
    });
  }

  function renderHub() {
    root.innerHTML = `
      <div class="hub">
        <div class="hub-cats">
          <button type="button" class="cat-tile virtual active" data-cat="virtual">
            <span class="big">5</span>
            <b>JWÈT VITYÈL</b>
            <span>Lucky Six · Woulèt · Keno · Kous</span>
          </button>
          <button type="button" class="cat-tile casino" data-cat="casino" disabled title="Poko nan aperçu sa">
            <span class="big">♠</span>
            <b>KAZINO</b>
            <span>Poko aktif nan demonstrasyon</span>
          </button>
        </div>
        <div class="section-title">Chwazi yon jwèt</div>
        <div class="game-tiles">
          ${GAMES.map(
            (g) => `<button type="button" class="game-tile" data-open="${g.id}">
              <div class="art"><canvas data-tile="${g.id}" width="320" height="180" style="width:100%;height:96px"></canvas></div>
              <div class="meta"><b>${g.title}</b><span>${g.blurb}</span></div>
            </button>`
          ).join('')}
        </div>
        <div class="panel" style="margin-top:14px">
          <div class="row-between">
            <div>
              <h3 style="margin:0">Balans kont</h3>
              <p class="muted" style="margin:4px 0 0">Menm balans ak POS — yon sèl kont.</p>
            </div>
            <button class="btn" type="button" data-refill>Ranpli</button>
          </div>
          <p class="config-note" id="posGuard"></p>
        </div>
      </div>`;
    root.querySelectorAll('canvas[data-tile]').forEach((c) => CashArt.paintTile(c, c.dataset.tile));
    root.querySelectorAll('[data-open]').forEach((btn) => {
      btn.onclick = () => {
        if (!isAuthed()) {
          showAuth(true);
          return;
        }
        CashVirtual.Sfx.tap();
        location.hash = `#game/${btn.dataset.open}`;
      };
    });
    root.querySelector('[data-refill]').onclick = () => {
      CashVirtual.refillDemo(1000);
      CashVirtual.Sfx.confirm();
      updateChrome();
      document.getElementById('posGuard').textContent =
        `Balans kont: ${fmtMoney(CashVirtual.getAccountBalance())} · pataje ak POS`;
    };
    document.getElementById('posGuard').textContent =
      `Balans kont: ${fmtMoney(CashVirtual.getAccountBalance())} · pataje ak POS`;
  }

  function route() {
    if (!isAuthed()) {
      showAuth(true);
      renderHub();
      updateChrome();
      setNav('hub');
      return;
    }
    authGate.hidden = true;
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
    setNav('game');
    game.render(root, {
      onBack: () => {
        location.hash = '#hub';
      }
    });
  }

  document.getElementById('navHub').onclick = () => {
    location.hash = '#hub';
  };
  document.getElementById('navGames').onclick = () => {
    location.hash = '#hub';
  };
  document.getElementById('navInfo').onclick = () => {
    openModal(
      'Sou demonstrasyon an',
      `<p>Shell ak etap yo swiv yon eksperyans tip « demo jwèt vityèl », men grafik/son yo <b>orijinal Cash Paryaj</b> — pa kopi logo ni materyèl NSoft/Sportradar.</p>
       <ul>
         <li>Modal Konekte / Enskri pou sesyon demonstrasyon.</li>
         <li>Tuil JWÈT VITYÈL tankou kategori prensipal.</li>
         <li>Senk jwèt · <b>yon sèl balans kont</b> pataje ak POS.</li>
       </ul>`
    );
  };

  wireAuth();
  CashVirtual.subscribe(updateChrome);
  window.addEventListener('hashchange', route);
  window.addEventListener('online', updateChrome);
  window.addEventListener('offline', updateChrome);
  updateChrome();
  route();
})();
