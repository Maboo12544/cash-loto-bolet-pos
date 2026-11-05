/**
 * Atizay orijinal Cash Paryaj (canvas) — pa materyèl NSoft.
 */
(function (global) {
  function glossyBall(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffffffee');
    g.addColorStop(0.18, color);
    g.addColorStop(0.75, color);
    g.addColorStop(1, '#000000aa');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - r * 0.3, y - r * 0.4, r * 0.35, r * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fill();
  }

  function tileLucky(c) {
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#061820';
    ctx.fillRect(0, 0, c.width, c.height);
    const colors = ['#00b4bc', '#ffc42a', '#1d4ed8', '#e53935', '#9ef0d4'];
    colors.forEach((col, i) => glossyBall(ctx, 28 + i * 28, 48 + (i % 2) * 6, 16, col));
    ctx.fillStyle = '#9ef0d4';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SIS CHANS', 12, 18);
  }

  function tileRoulette(c) {
    const ctx = c.getContext('2d');
    const cx = c.width / 2;
    const cy = c.height / 2 + 4;
    ctx.fillStyle = '#140a06';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#5a3214';
    ctx.fill();
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 42, (i * Math.PI) / 9, ((i + 1) * Math.PI) / 9);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? '#c62828' : '#1a1f2b';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#008f96';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - 38, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  function tileKeno(c) {
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#071820';
    ctx.fillRect(0, 0, c.width, c.height);
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 6; col++) {
        glossyBall(ctx, 22 + col * 24, 28 + r * 24, 9, r === 1 && col < 3 ? '#ffc42a' : '#1a8f98');
      }
    }
  }

  function tileDogs(c) {
    const ctx = c.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, 0, c.height);
    grd.addColorStop(0, '#1a3d24');
    grd.addColorStop(1, '#0d2416');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#4f8a45';
    ctx.fillRect(0, 48, c.width, 52);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff18' : '#00000018';
      ctx.fillRect(i * 32, 48, 32, 52);
    }
    ['#00b4bc', '#e53935', '#1d4ed8', '#ff9900'].forEach((col, i) => {
      const x = 28 + i * 36;
      const y = 62;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, 14, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 12, y - 5, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 16, y - 7);
      ctx.lineTo(x + 24, y - 12);
      ctx.lineTo(x + 20, y - 2);
      ctx.fill();
      ctx.strokeStyle = '#1a1208';
      ctx.lineWidth = 2;
      [[-8, 4], [-2, 5], [4, 4], [10, 4]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - 1, y + dy + 8);
        ctx.stroke();
      });
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 6, y - 16, 14, 12);
      ctx.fillStyle = '#041018';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(String(i + 1), x - 2, y - 7);
    });
    ctx.fillStyle = '#fff';
    for (let y = 16; y < 100; y += 10) ctx.fillRect(c.width - 16, y, 8, 5);
    ctx.fillStyle = '#111';
    for (let y = 21; y < 100; y += 10) ctx.fillRect(c.width - 16, y, 8, 5);
  }

  function tileHorses(c) {
    const ctx = c.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, 0, c.height);
    grd.addColorStop(0, '#4a3018');
    grd.addColorStop(1, '#2a1a0c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#b8955a';
    ctx.fillRect(0, 50, c.width, 50);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff14' : '#00000014';
      ctx.fillRect(i * 40, 50, 40, 50);
    }
    ['#c62828', '#1d4ed8', '#15803d', '#7e22ce'].forEach((col, i) => {
      const x = 30 + i * 38;
      const y = 64;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 12, y - 2);
      ctx.lineTo(x + 28, y - 12);
      ctx.lineTo(x + 32, y - 4);
      ctx.lineTo(x + 16, y + 3);
      ctx.fill();
      ctx.fillStyle = '#9ef0d4';
      ctx.beginPath();
      ctx.arc(x, y - 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0d2744';
      ctx.fillRect(x - 3, y - 12, 6, 8);
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 4);
      ctx.lineTo(x + 5, y - 4);
      ctx.lineTo(x + 3, y + 1);
      ctx.lineTo(x - 2, y + 1);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(String(i + 1), x - 3, y + 4);
    });
  }

  function paintTile(canvas, id) {
    const map = { lucky6: tileLucky, roulette: tileRoulette, keno: tileKeno, dogs: tileDogs, horses: tileHorses };
    (map[id] || tileLucky)(canvas);
  }

  function drawEuWheel(canvas, rotationDeg = 0, highlight = null) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const order = global.CashVirtual.EU_ORDER;
    const n = order.length;
    const step = (Math.PI * 2) / n;
    ctx.clearRect(0, 0, w, h);
    // wood rim
    const wood = ctx.createRadialGradient(cx, cy, w * 0.35, cx, cy, w * 0.5);
    wood.addColorStop(0, '#8a5a2b');
    wood.addColorStop(1, '#3a1e0c');
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.49, 0, Math.PI * 2);
    ctx.fillStyle = wood;
    ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    for (let i = 0; i < n; i++) {
      const num = order[i];
      const a0 = i * step - Math.PI / 2;
      const a1 = a0 + step;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, w * 0.42, a0, a1);
      ctx.closePath();
      let col = '#0f7a3a';
      if (num !== 0) col = global.CashVirtual.colorOf(num) === 'red' ? '#c62828' : '#161a22';
      if (highlight === num) col = '#ffc42a';
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      const mid = a0 + step / 2;
      ctx.save();
      ctx.rotate(mid + Math.PI / 2);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(9, w * 0.035)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(num), 0, -w * 0.33);
      ctx.restore();
    }
    ctx.restore();
    // hub
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#0a3036';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#00b4bc';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe08a';
    ctx.fill();
    // pointer
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx - 7, 22);
    ctx.lineTo(cx + 7, 22);
    ctx.closePath();
    ctx.fillStyle = '#ffe08a';
    ctx.fill();
  }

  global.CashArt = { paintTile, drawEuWheel, glossyBall };
})(window);
