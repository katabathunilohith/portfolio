/* =========================================================
   Hero "PORTFOLIO" — WebGL slice-glitch that follows the cursor.
   The word is rasterised to a texture; a fragment shader tears it
   into horizontal slices wherever the (decaying) cursor trail is.
   ========================================================= */
(function () {
  'use strict';

  var MAX_PTS = 20;
  var FONT = '"Anton", Impact, "Arial Narrow", sans-serif';
  var INK = '#0e0e0e';

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aPos * 0.5 + 0.5;',
    '  gl_Position = vec4(aPos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    '#define MAX_PTS ' + MAX_PTS,
    'varying vec2 vUv;',
    'uniform sampler2D uTex;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform float uGlobal;',
    'uniform float uDpr;',
    'uniform float uRadius;',
    'uniform vec3 uPts[MAX_PTS];',
    '',
    'float h11(float n) { return fract(sin(n * 12.9898) * 43758.5453); }',
    'float h21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    '',
    'void main() {',
    '  vec2 px = vUv * uRes;',
    '  float infl = 0.0;',
    '  for (int i = 0; i < MAX_PTS; i++) {',
    '    vec3 p = uPts[i];',
    '    if (p.z > 0.001) {',
    '      vec2 d = px - p.xy;',
    '      d.x *= 0.75;',
    '      infl += p.z * exp(-dot(d, d) / (uRadius * uRadius));',
    '    }',
    '  }',
    '  infl = clamp(1.0 - exp(-infl * 1.3) + uGlobal, 0.0, 1.0);',
    '',
    '  vec2 uv = vUv;',
    '  float tick = mod(floor(uTime * 15.0), 241.0);',
    '  if (infl > 0.003) {',
    '    float bA = floor(px.y / (6.0 * uDpr));',
    '    float bB = floor(px.y / (21.0 * uDpr));',
    '    float rA = h11(bA * 1.37 + tick * 3.1);',
    '    float rB = h11(bB * 7.13 + tick * 1.7);',
    '    float shift = step(0.52, rA) * (rA - 0.52) * 2.1 - step(0.6, rB) * (rB - 0.6) * 2.5;',
    '    uv.x += shift * infl * 48.0 * uDpr / uRes.x;',
    '    vec2 blk = floor(px / (vec2(34.0, 12.0) * uDpr));',
    '    float rb = h21(blk + tick);',
    '    if (rb < infl * infl * 0.14) {',
    '      uv.x += (h21(blk * 1.7 + 3.0) - 0.5) * 0.06;',
    '    }',
    '  }',
    '  vec4 col = texture2D(uTex, uv);',
    '  if (infl > 0.35) {',
    '    float g = h21(floor(px / (2.0 * uDpr)) * 0.731 + tick * 1.13);',
    '    col *= 1.0 - step(1.0 - (infl - 0.35) * 0.04, g);',
    '  }',
    '  gl_FragColor = col;',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[glitch] shader error', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function create(canvas, opts) {
    opts = opts || {};
    var stage = opts.stage || canvas.parentElement;
    var interactive = opts.interactive !== false;

    var tcan = document.createElement('canvas');
    var tctx = tcan.getContext('2d');
    var mctx = document.createElement('canvas').getContext('2d');

    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }

    var prog = null, tex = null, loc = {};
    var pts = new Float32Array(MAX_PTS * 3);
    var head = 0;
    var dpr = 1;
    var W = 0, H = 0, bandTop = 0, bandH = 0, capH = 0;
    var running = false, visible = true;
    var lastT = 0, t0 = performance.now();
    var pulse = { amt: 0, start: 0, dur: 1 };
    var lastPX = -9999, lastPY = -9999, lastMove = 0;
    var ambientTimer = null;

    if (gl) {
      var vs = compile(gl, gl.VERTEX_SHADER, VERT);
      var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (vs && fs) {
        prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          console.warn('[glitch] link error', gl.getProgramInfoLog(prog));
          prog = null;
        }
      }
      if (prog) {
        gl.useProgram(prog);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var aPos = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        ['uTex', 'uRes', 'uTime', 'uGlobal', 'uDpr', 'uRadius', 'uPts'].forEach(function (n) {
          loc[n] = gl.getUniformLocation(prog, n);
        });
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(loc.uTex, 0);
        gl.clearColor(0, 0, 0, 0);
      } else {
        gl = null;
      }
    }
    var ctx2d = gl ? null : canvas.getContext('2d');

    /* ---------- layout + text raster ---------- */
    function layout() {
      W = stage.clientWidth;
      H = stage.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var portrait = W / H <= 0.8;
      var lines = portrait ? ['PORT', 'FOLIO'] : ['PORTFOLIO'];

      mctx.font = '400 100px ' + FONT;
      var widest = 0;
      lines.forEach(function (l) { widest = Math.max(widest, mctx.measureText(l).width); });
      var m = mctx.measureText('PORTFOLIO');
      var cap100 = m.actualBoundingBoxAscent || 73;

      var fontPx = (W * (portrait ? 0.88 : 0.905)) / widest * 100;
      fontPx = Math.min(fontPx, (H * (portrait ? 0.17 : 0.31)) / (cap100 / 100));
      capH = cap100 / 100 * fontPx;
      var gap = capH * 0.14;
      var blockH = lines.length * capH + (lines.length - 1) * gap;
      var centerY = H * (portrait ? 0.29 : 0.44);
      var pad = capH * 0.28;
      bandTop = centerY - blockH / 2 - pad;
      bandH = blockH + pad * 2;

      canvas.style.top = bandTop + 'px';
      canvas.style.height = bandH + 'px';
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(bandH * dpr));

      tcan.width = canvas.width;
      tcan.height = canvas.height;
      tctx.clearRect(0, 0, tcan.width, tcan.height);
      tctx.fillStyle = INK;
      tctx.font = '400 ' + (fontPx * dpr) + 'px ' + FONT;
      tctx.textAlign = 'center';
      tctx.textBaseline = 'alphabetic';
      lines.forEach(function (l, i) {
        var base = (pad + capH * (i + 1) + gap * i) * dpr;
        tctx.fillText(l, (W * dpr) / 2, base);
      });

      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tcan);
        gl.uniform2f(loc.uRes, canvas.width, canvas.height);
        gl.uniform1f(loc.uDpr, dpr);
        gl.uniform1f(loc.uRadius, Math.max(56, capH * 0.42) * dpr);
      }
      draw(performance.now());
    }

    /* ---------- drawing ---------- */
    function globalAmt(now) {
      if (pulse.amt <= 0) return 0;
      var k = (now - pulse.start) / (pulse.dur * 1000);
      if (k >= 1) { pulse.amt = 0; return 0; }
      var e = 1 - k;
      return pulse.amt * e * e;
    }

    function draw(now) {
      if (!gl) {
        if (ctx2d) {
          ctx2d.clearRect(0, 0, canvas.width, canvas.height);
          ctx2d.drawImage(tcan, 0, 0);
        }
        return;
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(loc.uTime, ((now - t0) / 1000) % 1000);
      gl.uniform1f(loc.uGlobal, globalAmt(now));
      gl.uniform3fv(loc.uPts, pts);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - (lastT || now)) / 1000);
      lastT = now;
      var decay = Math.exp(-dt / 0.3);
      var maxS = 0;
      for (var i = 0; i < MAX_PTS; i++) {
        var s = pts[i * 3 + 2] * decay;
        if (s < 0.002) s = 0;
        pts[i * 3 + 2] = s;
        if (s > maxS) maxS = s;
      }
      var g = globalAmt(now);
      draw(now);
      if (maxS === 0 && g === 0) {
        running = false;
        draw(now); // settle on a clean frame
        return;
      }
      requestAnimationFrame(frame);
    }

    function wake() {
      if (!gl || running || !visible) return;
      running = true;
      lastT = 0;
      requestAnimationFrame(frame);
    }

    function push(x, y, s) {
      pts[head * 3] = x;
      pts[head * 3 + 1] = y;
      pts[head * 3 + 2] = Math.min(1, s);
      head = (head + 1) % MAX_PTS;
    }

    /* ---------- interaction ---------- */
    function onMove(e) {
      if (!visible) return;
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var sx = canvas.width / r.width;
      var sy = canvas.height / r.height;
      var x = (e.clientX - r.left) * sx;
      var y = (r.bottom - e.clientY) * sy;
      var dist = Math.hypot(x - lastPX, y - lastPY);
      if (dist < 7 * dpr) return;
      var speed = Math.min(1, dist / (70 * dpr));
      lastPX = x; lastPY = y;
      lastMove = performance.now();
      if (y < -bandH * dpr * 0.35 || y > bandH * dpr * 1.35) return;
      push(x, y, 0.28 + speed * 0.5);
      wake();
    }

    function ambient() {
      clearTimeout(ambientTimer);
      ambientTimer = setTimeout(function () {
        if (visible && performance.now() - lastMove > 2500 && gl) {
          var x = (0.12 + Math.random() * 0.76) * canvas.width;
          var y = canvas.height * (0.35 + Math.random() * 0.3);
          push(x, y, 0.42);
          push(x + (Math.random() - 0.5) * 120 * dpr, y + (Math.random() - 0.5) * 40 * dpr, 0.3);
          wake();
        }
        ambient();
      }, 3200 + Math.random() * 3800);
    }

    if (interactive && gl) {
      stage.addEventListener('pointermove', onMove, { passive: true });
      ambient();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) wake();
      }).observe(canvas);
    }

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(layout, 120);
    });

    return {
      layout: layout,
      supported: !!gl,
      pulse: function (amount, duration) {
        if (!gl) return;
        pulse.amt = amount;
        pulse.dur = duration || 1;
        pulse.start = performance.now();
        wake();
      }
    };
  }

  window.HeroGlitch = { create: create };
})();
