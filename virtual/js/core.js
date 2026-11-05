/**
 * Cash Paryaj — nwayo demonstrasyon jwèt vityèl
 * Kredi vityèl yo separe nèt ak balans POS / kliyan reyèl.
 */
(function (global) {
  const STORE_KEY = 'cash-paryaj-virtual-demo-v2';
  const POS_KEY = 'cashloto-active-pos-v6'; // pa janm modifye sa pou jwèt yo

  const DEFAULT_CONFIG = {
    lucky6: {
      pickCount: 6,
      poolSize: 48,
      drawCount: 35,
      roundMs: 9000,
      // Tablo demonstrasyon sèlman — pa ofisyèl
      payoutDemo: { 0: 0, 1: 0, 2: 0, 3: 1.5, 4: 8, 5: 80, 6: 1000 },
      stakeDefault: 10
    },
    roulette: {
      roundMs: 6500,
      chipValues: [1, 5, 10, 25, 50],
      payoutDemo: {
        straight: 35,
        color: 1,
        parity: 1,
        range: 1,
        dozen: 2,
        column: 2
      }
    },
    keno: {
      maxPick: 10,
      minPick: 1,
      poolSize: 80,
      drawCount: 20,
      roundMs: 8000,
      // Tablo demonstrasyon selon kantite korespondans (pou 10 chwazi)
      payoutDemo: {
        1: { 1: 0 },
        2: { 2: 5 },
        3: { 2: 1, 3: 15 },
        4: { 2: 1, 3: 4, 4: 40 },
        5: { 3: 2, 4: 10, 5: 100 },
        6: { 3: 1, 4: 5, 5: 40, 6: 300 },
        7: { 4: 3, 5: 15, 6: 80, 7: 800 },
        8: { 4: 2, 5: 10, 6: 40, 7: 200, 8: 1500 },
        9: { 4: 1, 5: 5, 6: 20, 7: 80, 8: 400, 9: 2000 },
        10: { 5: 3, 6: 10, 7: 40, 8: 150, 9: 600, 10: 2500 }
      },
      stakeDefault: 10
    },
    dogs: {
      runners: 6,
      raceMs: 7000,
      payoutDemo: 5,
      stakeDefault: 10
    },
    horses: {
      runners: 8,
      raceMs: 8000,
      payoutDemo: 6,
      stakeDefault: 10
    }
  };

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    a[6] = (a[6] & 0x0f) | 0x40;
    a[8] = (a[8] & 0x3f) | 0x80;
    const h = [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return null;
      return raw;
    } catch {
      return null;
    }
  }

  function blankState() {
    return {
      version: 2,
      credits: 1000,
      sound: true,
      config: structuredClone(DEFAULT_CONFIG),
      history: { lucky6: [], roulette: [], keno: [], dogs: [], horses: [] },
      active: { lucky6: null, roulette: null, keno: null, dogs: null, horses: null },
      processedDebits: {},
      processedCredits: {}
    };
  }

  let state = load() || blankState();
  if (!state.config) state.config = structuredClone(DEFAULT_CONFIG);
  // Merge missing config keys without wiping custom values
  for (const k of Object.keys(DEFAULT_CONFIG)) {
    state.config[k] = { ...DEFAULT_CONFIG[k], ...(state.config[k] || {}) };
  }
  if (!state.history) state.history = blankState().history;
  if (!state.active) state.active = blankState().active;
  if (!state.processedDebits) state.processedDebits = {};
  if (!state.processedCredits) state.processedCredits = {};

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    // Garanti nou pa manyen balans POS
    void POS_KEY;
  }

  function getPosBalanceSnapshot() {
    try {
      const pos = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      return pos && typeof pos.balance === 'number' ? pos.balance : null;
    } catch {
      return null;
    }
  }

  const listeners = new Set();
  function emit() {
    listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (_) {}
    });
  }
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // —— Son orijinal (Web Audio, pa gen fichye NSoft) ——
  let audioCtx = null;
  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function beep({ freq = 440, dur = 0.08, type = 'sine', gain = 0.04, when = 0 }) {
    if (!state.sound) return;
    try {
      const c = ctx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = gain;
      o.connect(g);
      g.connect(c.destination);
      const t = c.currentTime + when;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (_) {}
  }
  const Sfx = {
    tap() {
      beep({ freq: 520, dur: 0.04, type: 'triangle', gain: 0.03 });
    },
    confirm() {
      beep({ freq: 660, dur: 0.07, type: 'sine', gain: 0.045 });
      beep({ freq: 880, dur: 0.08, type: 'sine', gain: 0.035, when: 0.07 });
    },
    ball() {
      beep({ freq: 380 + Math.random() * 120, dur: 0.06, type: 'square', gain: 0.025 });
    },
    spin() {
      for (let i = 0; i < 8; i++) beep({ freq: 200 + i * 30, dur: 0.05, type: 'sawtooth', gain: 0.015, when: i * 0.05 });
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => beep({ freq: f, dur: 0.12, type: 'sine', gain: 0.04, when: i * 0.1 }));
    },
    lose() {
      beep({ freq: 220, dur: 0.18, type: 'triangle', gain: 0.03 });
    },
    start() {
      beep({ freq: 300, dur: 0.1, type: 'square', gain: 0.03 });
      beep({ freq: 450, dur: 0.12, type: 'square', gain: 0.03, when: 0.12 });
    }
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const buf = new Uint32Array(1);
      const lim = Math.floor(0x100000000 / (i + 1)) * (i + 1);
      let x;
      do {
        crypto.getRandomValues(buf);
        x = buf[0];
      } while (x >= lim);
      const j = x % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickN(poolSize, n) {
    return shuffle(Array.from({ length: poolSize }, (_, i) => i + 1)).slice(0, n);
  }

  function debitOnce(roundId, amount) {
    if (state.processedDebits[roundId]) return { ok: true, already: true };
    if (amount > state.credits) return { ok: false, error: 'Kredi vityèl pa sifi.' };
    state.credits = Math.round((state.credits - amount) * 100) / 100;
    state.processedDebits[roundId] = { amount, at: Date.now() };
    save();
    emit();
    return { ok: true, already: false };
  }

  function creditOnce(roundId, amount) {
    if (state.processedCredits[roundId]) return { ok: true, already: true };
    if (amount > 0) {
      state.credits = Math.round((state.credits + amount) * 100) / 100;
    }
    state.processedCredits[roundId] = { amount, at: Date.now() };
    save();
    emit();
    return { ok: true, already: false };
  }

  function setActive(game, round) {
    state.active[game] = round;
    save();
    emit();
  }

  function clearActive(game) {
    state.active[game] = null;
    save();
    emit();
  }

  function pushHistory(game, entry) {
    const list = state.history[game] || [];
    list.unshift(entry);
    state.history[game] = list.slice(0, 30);
    save();
    emit();
  }

  function refillDemo(amount = 1000) {
    state.credits = amount;
    save();
    emit();
  }

  function toggleSound() {
    state.sound = !state.sound;
    save();
    emit();
    if (state.sound) Sfx.tap();
    return state.sound;
  }

  function online() {
    return navigator.onLine;
  }

  /**
   * Kreye yon wonn ak rezilta fikse yon sèl fwa.
   * Debi fèt yon sèl fwa atravè roundId.
   */
  function lockRound(game, { stake, selection, result, meta }) {
    const existing = state.active[game];
    if (existing && existing.phase !== 'settled' && existing.phase !== 'select') {
      return { ok: false, error: 'Yon wonn deja an kou.', round: existing };
    }
    const id = uuid();
    const deb = debitOnce(id, stake);
    if (!deb.ok) return { ok: false, error: deb.error };
    const round = {
      id,
      game,
      phase: 'locked',
      stake,
      selection,
      result, // fikse — animasyon dwe montre sa a sèlman
      meta: meta || {},
      payout: null,
      createdAt: new Date().toISOString(),
      settledAt: null
    };
    setActive(game, round);
    return { ok: true, round };
  }

  function markAnimating(game) {
    const r = state.active[game];
    if (!r || r.phase === 'settled') return r;
    r.phase = 'animating';
    setActive(game, r);
    return r;
  }

  function settleRound(game, payout) {
    const r = state.active[game];
    if (!r) return { ok: false, error: 'Pa gen wonn.' };
    if (r.phase === 'settled') return { ok: true, round: r, already: true };
    creditOnce(r.id, payout);
    r.payout = payout;
    r.phase = 'settled';
    r.settledAt = new Date().toISOString();
    pushHistory(game, {
      id: r.id,
      at: r.settledAt,
      stake: r.stake,
      payout,
      selection: r.selection,
      result: r.result,
      meta: r.meta
    });
    setActive(game, r);
    return { ok: true, round: r };
  }

  function wait(ms) {
    if (reducedMotion()) return Promise.resolve();
    return new Promise((res) => setTimeout(res, ms));
  }

  function animDuration(configuredMs) {
    return reducedMotion() ? 0 : configuredMs;
  }

  global.CashVirtual = {
    STORE_KEY,
    get state() {
      return state;
    },
    save,
    subscribe,
    uuid,
    shuffle,
    pickN,
    Sfx,
    reducedMotion,
    wait,
    animDuration,
    online,
    getPosBalanceSnapshot,
    refillDemo,
    toggleSound,
    lockRound,
    markAnimating,
    settleRound,
    clearActive,
    setActive,
    debitOnce,
    creditOnce,
    DEFAULT_CONFIG,
    // European roulette helpers
    EU_ORDER: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    REDS: new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]),
    colorOf(n) {
      if (n === 0) return 'green';
      return this.REDS.has(n) ? 'red' : 'black';
    }
  };
})(window);
