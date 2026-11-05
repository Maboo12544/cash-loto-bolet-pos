/**
 * Tès rapid nwayo (kouri nan Node oswa navigatè).
 * node virtual/js/selftest.js
 */
const isNode = typeof window === 'undefined';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function run() {
  if (isNode) {
    // Minimal stubs for Node
    global.localStorage = {
      _d: {},
      getItem(k) {
        return this._d[k] ?? null;
      },
      setItem(k, v) {
        this._d[k] = String(v);
      }
    };
    global.crypto = require('crypto').webcrypto;
    global.navigator = { onLine: true };
    global.window = global;
    require('./core.js');
  }
  const CV = global.CashVirtual || window.CashVirtual;
  CV.refillDemo(1000);
  const posBefore = CV.getPosBalanceSnapshot();

  // Double debit / credit
  const id = CV.uuid();
  const d1 = CV.debitOnce(id, 50);
  const d2 = CV.debitOnce(id, 50);
  assert(d1.ok && !d1.already, 'premye debi');
  assert(d2.ok && d2.already, 'dezyèm debi ignore');
  assert(CV.state.credits === 950, 'kredi apre debi');
  const c1 = CV.creditOnce(id, 100);
  const c2 = CV.creditOnce(id, 100);
  assert(c1.ok && !c1.already, 'premye kredi');
  assert(c2.ok && c2.already, 'dezyèm kredi ignore');
  assert(CV.state.credits === 1050, 'kredi apre retou');

  // Lock round result immutable
  CV.refillDemo(500);
  const drawn = CV.pickN(48, 35);
  const locked = CV.lockRound('lucky6', {
    stake: 10,
    selection: [1, 2, 3, 4, 5, 6],
    result: { drawn },
    meta: { matches: 0 }
  });
  assert(locked.ok, 'lock ok');
  const snap = locked.round.result.drawn.slice();
  CV.markAnimating('lucky6');
  assert(JSON.stringify(CV.state.active.lucky6.result.drawn) === JSON.stringify(snap), 'rezilta pa chanje');
  CV.settleRound('lucky6', 0);
  const again = CV.settleRound('lucky6', 99);
  assert(again.already, 'pa double settle kredi');
  assert(CV.state.credits === 490, '10 debi, 0 retou');

  // POS balance untouched
  const posAfter = CV.getPosBalanceSnapshot();
  assert(posBefore === posAfter, 'balans POS pa manyen');

  // Race order animation helper consistency: shuffle length
  const order = CV.shuffle([1, 2, 3, 4, 5, 6]);
  assert(order.length === 6 && new Set(order).size === 6, 'klasman konplè');

  console.log('SELFTEST_OK');
}

run().catch((e) => {
  console.error('SELFTEST_FAIL', e);
  if (isNode) process.exit(1);
});
