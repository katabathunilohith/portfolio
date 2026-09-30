/* =========================================================
   Procedural artwork for project posters and milestone cards.
   Everything is deterministic (seeded) so it renders the same
   on every visit.
   ========================================================= */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function sizeCanvas(canvas) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---------------- Interstellar: black hole ---------------- */
  function blackhole(canvas) {
    var c = sizeCanvas(canvas);
    if (!c) return;
    var ctx = c.ctx, w = c.w, h = c.h;
    var rnd = mulberry32(42);

    var bg = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, Math.max(w, h) * 0.85);
    bg.addColorStop(0, '#120c10');
    bg.addColorStop(0.5, '#050407');
    bg.addColorStop(1, '#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    for (var i = 0; i < 420; i++) {
      var x = rnd() * w, y = rnd() * h, r = Math.pow(rnd(), 3) * 1.25 + 0.25;
      ctx.globalAlpha = 0.2 + rnd() * 0.8;
      ctx.fillStyle = rnd() > 0.88 ? '#ffd9a8' : '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    var cx = w * 0.5, cy = h * 0.4, R = w * 0.14;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // soft outer glow
    var glow = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 3.4);
    glow.addColorStop(0, 'rgba(255,170,90,0.45)');
    glow.addColorStop(0.3, 'rgba(255,120,40,0.14)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // lensed halo (the far side of the disk bent around the shadow)
    var halo = ctx.createRadialGradient(cx, cy, R * 1.0, cx, cy, R * 1.62);
    halo.addColorStop(0, 'rgba(255,248,230,0.95)');
    halo.addColorStop(0.12, 'rgba(255,214,150,0.85)');
    halo.addColorStop(0.45, 'rgba(240,130,50,0.35)');
    halo.addColorStop(1, 'rgba(120,30,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.62, 0, Math.PI * 2);
    ctx.arc(cx, cy, R * 1.0, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // event horizon
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // photon ring
    ctx.strokeStyle = 'rgba(255,240,215,0.9)';
    ctx.lineWidth = Math.max(1, R * 0.02);
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.03, 0, Math.PI * 2); ctx.stroke();

    // accretion disk crossing in front
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(cx, cy);
    ctx.scale(1, 0.085);
    var disk = ctx.createRadialGradient(0, 0, R * 1.05, 0, 0, R * 3.9);
    disk.addColorStop(0, 'rgba(255,250,235,1)');
    disk.addColorStop(0.1, 'rgba(255,220,160,0.95)');
    disk.addColorStop(0.35, 'rgba(250,150,60,0.55)');
    disk.addColorStop(0.7, 'rgba(180,70,20,0.18)');
    disk.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(0, 0, R * 3.9, 0, Math.PI * 2);
    ctx.arc(0, 0, R * 1.05, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // near side of the disk passing in front of the shadow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var band = ctx.createLinearGradient(cx - R * 1.3, 0, cx + R * 1.3, 0);
    band.addColorStop(0, 'rgba(255,200,130,0)');
    band.addColorStop(0.18, 'rgba(255,225,170,0.9)');
    band.addColorStop(0.5, 'rgba(255,246,225,1)');
    band.addColorStop(0.82, 'rgba(255,205,140,0.85)');
    band.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.02, R * 1.3, R * 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'rgba(255,190,110,0.9)';
    ctx.shadowBlur = R * 0.25;
    ctx.fillStyle = 'rgba(255,240,215,0.55)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.02, R * 1.05, R * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // doppler: the approaching (left) side glows brighter
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var dop = ctx.createLinearGradient(cx - R * 3.6, 0, cx + R * 3.6, 0);
    dop.addColorStop(0, 'rgba(255,230,190,0.0)');
    dop.addColorStop(0.3, 'rgba(255,230,190,0.35)');
    dop.addColorStop(0.5, 'rgba(255,230,190,0.0)');
    ctx.fillStyle = dop;
    ctx.translate(cx, cy);
    ctx.scale(1, 0.05);
    ctx.beginPath(); ctx.arc(0, 0, R * 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // vignette
    var vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  /* ---------------- IEEE P3382: noisy MRI slice ---------------- */
  function mri(canvas) {
    var c = sizeCanvas(canvas);
    if (!c) return;
    var LW = 220, LH = Math.round(220 * c.h / c.w);
    var off = document.createElement('canvas');
    off.width = LW; off.height = LH;
    var octx = off.getContext('2d');
    var img = octx.createImageData(LW, LH);
    var d = img.data;
    var rnd = mulberry32(9);
    function gauss() {
      var u = 1 - rnd(), v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    var aspect = LW / LH;
    for (var y = 0; y < LH; y++) {
      for (var x = 0; x < LW; x++) {
        var u = (x / LW - 0.5) * 2 * aspect;
        var v = (y / LH - 0.5) * 2;
        var ex = u / 0.6, ey = v / 0.74;
        var r = Math.sqrt(ex * ex + ey * ey);
        var ang = Math.atan2(ey, ex);
        var wob = 0.018 * Math.sin(ang * 7) + 0.01 * Math.sin(ang * 13 + 1.3);
        var val = 0.03;
        if (r < 1 + wob) {
          if (r > 0.93 + wob) val = 0.82;
          else if (r > 0.885 + wob) val = 0.1;
          else if (r > 0.845 + wob) val = 0.5;
          else {
            var g = Math.sin(u * 23 + Math.sin(v * 9) * 2.3) * Math.cos(v * 19 + Math.sin(u * 11) * 2.5);
            val = 0.5 + 0.17 * g;
            val += Math.max(0, 1 - r / 0.62) * 0.2;
            var vl = Math.pow((u + 0.09) / 0.065, 2) + Math.pow((v + 0.03) / 0.21, 2);
            var vr = Math.pow((u - 0.09) / 0.065, 2) + Math.pow((v + 0.03) / 0.21, 2);
            if (vl < 1 || vr < 1) val = 0.07;
            if (Math.abs(u) < 0.01 && Math.abs(v) < 0.68) val *= 0.45;
          }
        }
        var n1 = gauss() * 0.075, n2 = gauss() * 0.075;
        val = Math.sqrt((val + n1) * (val + n1) + n2 * n2);
        var k = Math.max(0, Math.min(255, val * 255));
        var i = (y * LW + x) * 4;
        d[i] = k * 0.9; d[i + 1] = k; d[i + 2] = k * 1.04; d[i + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    var ctx = c.ctx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, c.w, c.h);
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (var s = 0; s < c.h; s += 3) ctx.fillRect(0, s, c.w, 1);
    var vg = ctx.createRadialGradient(c.w / 2, c.h / 2, c.w * 0.3, c.w / 2, c.h / 2, c.w * 0.9);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, c.w, c.h);
  }

  /* ---------------- ML internship: candles + forecast ---------------- */
  function candles(svg) {
    if (svg.childNodes.length) return;
    var rnd = mulberry32(7);
    var W = 300, H = 200, n = 24, split = 16, cw = W / n;
    var price = 100, data = [];
    for (var i = 0; i < n; i++) {
      var o = price;
      var c = o + (rnd() - 0.42) * 9;
      data.push({ o: o, c: c, h: Math.max(o, c) + rnd() * 5, l: Math.min(o, c) - rnd() * 5 });
      price = c;
    }
    var min = Infinity, max = -Infinity;
    data.forEach(function (d) { min = Math.min(min, d.l); max = Math.max(max, d.h); });
    min -= 8; max += 8;
    var y = function (v) { return H - (v - min) / (max - min) * H; };

    for (var g = 1; g < 5; g++) el('line', { x1: 0, x2: W, y1: g * H / 5, y2: g * H / 5, stroke: 'rgba(0,0,0,0.07)' }, svg);

    data.forEach(function (d, i) {
      var x = i * cw + cw / 2;
      var up = d.c >= d.o;
      var future = i >= split;
      var col = future ? 'rgba(0,0,0,0.18)' : (up ? '#16a34a' : '#e5484d');
      el('line', { x1: x, x2: x, y1: y(d.h), y2: y(d.l), stroke: col, 'stroke-width': 1 }, svg);
      el('rect', {
        x: x - cw * 0.3, y: y(Math.max(d.o, d.c)), width: cw * 0.6,
        height: Math.max(1.5, Math.abs(y(d.o) - y(d.c))), rx: 0.6,
        fill: future ? 'none' : col, stroke: future ? col : 'none'
      }, svg);
    });

    var pred = [];
    for (var j = split - 1; j < n; j++) {
      var a = data[Math.max(0, j - 1)].c, b = data[j].c, cc = data[Math.min(n - 1, j + 1)].c;
      pred.push([j * cw + cw / 2, y((a + b + cc) / 3 + 1.2)]);
    }
    var upper = pred.map(function (p, k) { return [p[0], p[1] - 5 - k * 1.7]; });
    var lower = pred.map(function (p, k) { return [p[0], p[1] + 5 + k * 1.7]; }).reverse();
    var toPath = function (arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L'); };
    el('path', { d: 'M' + toPath(upper.concat(lower)) + 'Z', fill: 'rgba(47,91,255,0.12)' }, svg);
    el('path', { d: 'M' + toPath(pred), fill: 'none', stroke: '#2f5bff', 'stroke-width': 1.7, 'stroke-dasharray': '4 3' }, svg);

    var nx = (split - 0.5) * cw;
    el('line', { x1: nx, x2: nx, y1: 0, y2: H, stroke: '#111', 'stroke-width': 0.8, 'stroke-dasharray': '2 3' }, svg);
    el('text', { x: nx + 4, y: 9, 'font-family': 'JetBrains Mono', 'font-size': 7, fill: '#111', 'letter-spacing': 1 }, svg, 'NOW');
  }

  /* ---------------- CodeChef: 241-day streak heatmap ---------------- */
  function heatmap(svg) {
    if (svg.childNodes.length) return;
    var cols = 36, rows = 7, size = 6, gap = 1, pitch = size + gap;
    svg.setAttribute('viewBox', '0 0 ' + (cols * pitch - gap) + ' ' + (rows * pitch - gap));
    var total = cols * rows, streak = 241;
    var rnd = mulberry32(3);
    var shades = ['#e6ddcc', '#bfe3c6', '#6fc68d', '#2f9e57', '#16693a'];
    for (var i = 0; i < total; i++) {
      var c = Math.floor(i / rows), r = i % rows;
      var lvl;
      if (i >= total - streak) {
        var v = rnd();
        lvl = v < 0.34 ? 1 : v < 0.7 ? 2 : v < 0.9 ? 3 : 4;
      } else {
        lvl = (i === total - streak - 1) ? 0 : (rnd() < 0.3 ? 1 : 0);
      }
      el('rect', { x: c * pitch, y: r * pitch, width: size, height: size, rx: 1.2, fill: shades[lvl] }, svg);
    }
  }

  /* ---------------- LeetCode: rating line ---------------- */
  function rating(svg) {
    if (svg.childNodes.length) return;
    var W = 300, H = 110;
    var vals = [1500, 1478, 1452, 1431, 1396, 1402, 1385, 1398, 1377, 1391, 1404, 1398, 1409, 1414];
    var min = 1360, max = 1510;
    var pts = vals.map(function (v, i) { return [i / (vals.length - 1) * (W - 8) + 4, H - (v - min) / (max - min) * (H - 14) - 7]; });
    var defs = el('defs', {}, svg);
    var lg = el('linearGradient', { id: 'lcfill', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ffa116', 'stop-opacity': 0.35 }, lg);
    el('stop', { offset: '100%', 'stop-color': '#ffa116', 'stop-opacity': 0 }, lg);
    for (var g = 1; g < 4; g++) el('line', { x1: 0, x2: W, y1: g * H / 4, y2: g * H / 4, stroke: 'rgba(255,255,255,0.07)' }, svg);
    var line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join('L');
    el('path', { d: 'M' + line + 'L' + (W - 4) + ',' + H + 'L4,' + H + 'Z', fill: 'url(#lcfill)' }, svg);
    el('path', { d: 'M' + line, fill: 'none', stroke: '#ffa116', 'stroke-width': 2, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, svg);
    var last = pts[pts.length - 1];
    el('circle', { cx: last[0], cy: last[1], r: 3.2, fill: '#ffa116' }, svg);
    el('circle', { cx: last[0], cy: last[1], r: 7, fill: 'none', stroke: 'rgba(255,161,22,0.45)' }, svg);
  }

  /* ---------------- File similarity: diff ---------------- */
  function diff(svg) {
    if (svg.childNodes.length) return;
    var rnd = mulberry32(5);
    var lines = 15, y0 = 40, lh = 14.6;
    var map = { 0: 0, 1: 1, 2: 3, 3: 2, 4: 4, 5: 5, 7: 6, 8: 8, 9: 9, 10: 11, 11: 10, 12: 12, 14: 14 };
    var matchedB = {};
    Object.keys(map).forEach(function (k) { matchedB[map[k]] = true; });
    var A = { x: 0, w: 168 }, B = { x: 232, w: 168 };
    [A, B].forEach(function (p, pi) {
      el('rect', { x: p.x, y: 0, width: p.w, height: 270, rx: 6, fill: '#fbfbf8', stroke: 'rgba(0,0,0,0.12)' }, svg);
      el('line', { x1: p.x, x2: p.x + p.w, y1: 24, y2: 24, stroke: 'rgba(0,0,0,0.1)' }, svg);
      el('text', { x: p.x + 12, y: 16, 'font-family': 'JetBrains Mono', 'font-size': 8.5, fill: '#111', 'letter-spacing': 0.5 }, svg, pi ? 'file_b.txt' : 'file_a.txt');
      el('circle', { cx: p.x + p.w - 14, cy: 12.5, r: 3, fill: pi ? '#3446ff' : '#111' }, svg);
      for (var i = 0; i < lines; i++) {
        var yy = y0 + i * lh;
        var ind = [0, 0, 10, 10, 20][Math.floor(rnd() * 5)];
        var wdt = 40 + rnd() * 90;
        var hit = pi ? matchedB[i] : (i in map);
        el('text', { x: p.x + 8, y: yy + 5.5, 'font-family': 'JetBrains Mono', 'font-size': 6, fill: 'rgba(0,0,0,0.35)' }, svg, String(i + 1).padStart(2, '0'));
        if (hit) el('rect', { x: p.x + 22, y: yy - 3, width: p.w - 28, height: 12, rx: 2, fill: 'rgba(52,70,255,0.08)' }, svg);
        el('rect', { x: p.x + 26 + ind, y: yy, width: Math.min(wdt, p.w - 36 - ind), height: 6, rx: 2, fill: hit ? '#3446ff' : '#c9c9c1' }, svg);
      }
    });
    Object.keys(map).forEach(function (k) {
      var ya = y0 + (+k) * lh + 3, yb = y0 + map[k] * lh + 3;
      el('path', { d: 'M168,' + ya + ' C200,' + ya + ' 200,' + yb + ' 232,' + yb, fill: 'none', stroke: '#3446ff', 'stroke-width': 1, opacity: 0.45 }, svg);
    });
  }

  /* ---------------- Job allocation: gantt ---------------- */
  function gantt(svg) {
    if (svg.childNodes.length) return;
    var W = 400, T = 12, left = 30, top = 6, rowH = 32, gap = 8;
    var unit = (W - left - 2) / T;
    var rows = ['W1', 'W2', 'W3', 'W4', 'W5'];
    var bottom = top + rows.length * (rowH + gap) - gap;
    for (var t = 0; t <= T; t++) {
      var x = left + t * unit;
      el('line', { x1: x, x2: x, y1: top - 4, y2: bottom + 4, stroke: 'rgba(0,0,0,' + (t % 3 === 0 ? 0.2 : 0.07) + ')' }, svg);
      if (t % 3 === 0) el('text', { x: x, y: bottom + 18, 'text-anchor': t === 0 ? 'start' : t === T ? 'end' : 'middle', 'font-family': 'JetBrains Mono', 'font-size': 8, fill: 'rgba(0,0,0,0.6)' }, svg, 't' + t);
    }
    rows.forEach(function (r, i) {
      el('text', { x: 0, y: top + i * (rowH + gap) + rowH / 2 + 3, 'font-family': 'JetBrains Mono', 'font-size': 9, 'font-weight': 700, fill: '#111' }, svg, r);
    });
    var R = '#e4412b', B = '#1f4bd8', Y = '#f2b705', K = '#111';
    var jobs = [
      [0, 0, 3, 'J1', R], [0, 3, 7, 'J4', K], [0, 8, 11, 'J7', B],
      [1, 0, 5, 'J2', B], [1, 5, 8, 'J6', Y], [1, 9, 12, 'J9', R],
      [2, 1, 4, 'J3', Y], [2, 4, 9, 'J5', R], [2, 10, 12, 'J12', K],
      [3, 0, 2, 'J8', K], [3, 2, 6, 'J10', B], [3, 7, 10, 'J11', Y],
      [4, 0, 4, 'J13', R], [4, 4, 6, 'J14', K], [4, 6, 11, 'J15', B]
    ];
    jobs.forEach(function (j) {
      var x = left + j[1] * unit + 1.5, y = top + j[0] * (rowH + gap), w = (j[2] - j[1]) * unit - 3;
      el('rect', { x: x, y: y, width: w, height: rowH, rx: 2, fill: j[4] }, svg);
      el('text', { x: x + 7, y: y + rowH / 2 + 3.5, 'font-family': 'JetBrains Mono', 'font-size': 9, 'font-weight': 700, fill: j[4] === Y ? '#111' : '#fff' }, svg, j[3]);
    });
  }

  var svgMakers = { candles: candles, heatmap: heatmap, rating: rating, diff: diff, gantt: gantt };
  var canvasMakers = { blackhole: blackhole, mri: mri };

  function drawAll() {
    Array.prototype.forEach.call(document.querySelectorAll('svg[data-visual]'), function (s) {
      var f = svgMakers[s.getAttribute('data-visual')];
      if (f) f(s);
    });
    Array.prototype.forEach.call(document.querySelectorAll('canvas[data-visual]'), function (cv) {
      var f = canvasMakers[cv.getAttribute('data-visual')];
      if (f) f(cv);
    });
  }

  var rt = null, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      Array.prototype.forEach.call(document.querySelectorAll('canvas[data-visual]'), function (cv) {
        var f = canvasMakers[cv.getAttribute('data-visual')];
        if (f) f(cv);
      });
    }, 200);
  });

  window.Visuals = { drawAll: drawAll };
})();
