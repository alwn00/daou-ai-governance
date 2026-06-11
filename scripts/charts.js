/* ════════════════════════════════════════════
   charts.js — 경량 SVG 차트 엔진 (의존성 없음)
   donut / line / gauge / semicircle
   모든 차트는 viewBox 기반 반응형이며
   requestAnimationFrame으로 로드 애니메이션을 수행합니다.
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function animate(duration, frame) {
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      frame(easeOut(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ── 1. Donut ───────────────────────────────
     SVGCharts.donut('id', {segments:[{label,value,color}], total, centerLabel}) */
  function donut(containerId, cfg) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = '';
    var size = 160, r = 62, cx = 80, cy = 80;
    var C = 2 * Math.PI * r;
    var total = cfg.total || cfg.segments.reduce(function (s, x) { return s + x.value; }, 0);

    var svg = el('svg', { viewBox: '0 0 ' + size + ' ' + size, role: 'img', 'aria-label': cfg.centerLabel || '도넛 차트' }, box);
    svg.style.width = '100%';
    svg.style.height = '100%';

    el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: cssVar('--bar-bg'), 'stroke-width': 22 }, svg);

    var segs = cfg.segments.map(function (s) {
      var c = el('circle', {
        cx: cx, cy: cy, r: r, fill: 'none', stroke: s.color, 'stroke-width': 22,
        'stroke-dasharray': '0 ' + C, transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
      }, svg);
      return { node: c, value: s.value };
    });

    var num = el('text', {
      x: cx, y: cy - 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-size': 26, 'font-weight': 800, fill: cssVar('--txt'), 'font-family': 'inherit'
    }, svg);
    num.textContent = total;
    var lbl = el('text', {
      x: cx, y: cy + 19, 'text-anchor': 'middle',
      'font-size': 10.5, fill: cssVar('--sub'), 'font-family': 'inherit'
    }, svg);
    lbl.textContent = cfg.centerLabel || '';

    animate(900, function (t) {
      var offset = 0;
      segs.forEach(function (s) {
        var len = (s.value / total) * C * t;
        s.node.setAttribute('stroke-dasharray', len + ' ' + (C - len));
        s.node.setAttribute('stroke-dashoffset', -offset);
        offset += (s.value / total) * C * t;
      });
    });
  }

  /* ── 2. Line ───────────────────────────────
     SVGCharts.line('id', {series:[{name,data,color}], labels:[], height}) */
  function line(containerId, cfg) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = '';
    box.classList.add('chart-wrap');

    var W = 720, H = cfg.height || 220;
    var padL = 46, padR = 14, padT = 12, padB = 26;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var labels = cfg.labels || [];
    var n = labels.length;
    var maxV = 0;
    cfg.series.forEach(function (s) {
      s.data.forEach(function (v) { if (v > maxV) maxV = v; });
    });
    maxV = Math.ceil(maxV * 1.1 / 100) * 100 || 100;

    function X(i) { return padL + (n <= 1 ? 0 : (i / (n - 1)) * plotW); }
    function Y(v) { return padT + plotH - (v / maxV) * plotH; }

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'AI 호출량 추이 차트' }, box);
    svg.style.width = '100%';
    svg.style.height = 'auto';

    var defs = el('defs', {}, svg);

    // y축 그리드 + 라벨
    var ticks = 4;
    for (var i = 0; i <= ticks; i++) {
      var v = (maxV / ticks) * i;
      var y = Y(v);
      el('line', { x1: padL, y1: y, x2: W - padR, y2: y, stroke: cssVar('--line'), 'stroke-width': 1 }, svg);
      var tl = el('text', { x: padL - 8, y: y + 3.5, 'text-anchor': 'end', 'font-size': 10, fill: cssVar('--sub'), 'font-family': 'inherit' }, svg);
      tl.textContent = v >= 1000 ? (v / 1000) + 'k' : v;
    }
    // x축 라벨
    labels.forEach(function (l, idx) {
      var tx = el('text', { x: X(idx), y: H - 8, 'text-anchor': 'middle', 'font-size': 10, fill: cssVar('--sub'), 'font-family': 'inherit' }, svg);
      tx.textContent = l;
    });

    var paths = [];
    cfg.series.forEach(function (s, si) {
      var d = s.data.map(function (v, idx) {
        return (idx === 0 ? 'M' : 'L') + X(idx).toFixed(1) + ' ' + Y(v).toFixed(1);
      }).join(' ');

      // 첫 번째 시리즈에 그라디언트 면 채우기
      if (si === 0) {
        var gid = containerId + '-grad';
        var grad = el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        el('stop', { offset: '0%', 'stop-color': s.color, 'stop-opacity': 0.22 }, grad);
        el('stop', { offset: '100%', 'stop-color': s.color, 'stop-opacity': 0 }, grad);
        var area = d + ' L' + X(s.data.length - 1).toFixed(1) + ' ' + (padT + plotH) + ' L' + padL + ' ' + (padT + plotH) + ' Z';
        var areaPath = el('path', { d: area, fill: 'url(#' + gid + ')', stroke: 'none', opacity: 0 }, svg);
        setTimeout(function () {
          areaPath.style.transition = 'opacity .7s ease';
          areaPath.setAttribute('opacity', 1);
        }, 500);
      }

      var p = el('path', { d: d, fill: 'none', stroke: s.color, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
      paths.push(p);
    });

    // stroke-dashoffset 라인 드로잉 애니메이션
    paths.forEach(function (p) {
      var len = p.getTotalLength();
      p.setAttribute('stroke-dasharray', len);
      p.setAttribute('stroke-dashoffset', len);
      animate(1100, function (t) { p.setAttribute('stroke-dashoffset', len * (1 - t)); });
    });

    // 호버 툴팁
    var tip = document.createElement('div');
    tip.className = 'chart-tip';
    box.appendChild(tip);
    var guide = el('line', { x1: 0, y1: padT, x2: 0, y2: padT + plotH, stroke: cssVar('--sub'), 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0 }, svg);
    var dots = cfg.series.map(function (s) {
      return el('circle', { r: 3.5, fill: s.color, stroke: cssVar('--card'), 'stroke-width': 1.5, opacity: 0 }, svg);
    });

    svg.addEventListener('mousemove', function (e) {
      var rect = svg.getBoundingClientRect();
      var mx = (e.clientX - rect.left) / rect.width * W;
      var idx = Math.round((mx - padL) / (plotW / (n - 1)));
      if (idx < 0 || idx > n - 1) { hide(); return; }
      var gx = X(idx);
      guide.setAttribute('x1', gx); guide.setAttribute('x2', gx);
      guide.setAttribute('opacity', 0.5);
      var html = '<span class="tt-date">' + labels[idx] + '</span>';
      cfg.series.forEach(function (s, si) {
        dots[si].setAttribute('cx', gx);
        dots[si].setAttribute('cy', Y(s.data[idx]));
        dots[si].setAttribute('opacity', 1);
        html += s.name + ': <b>' + s.data[idx].toLocaleString() + '</b><br>';
      });
      tip.innerHTML = html;
      tip.classList.add('show');
      var bx = box.getBoundingClientRect();
      var left = (gx / W) * bx.width + 14;
      if (left + tip.offsetWidth > bx.width - 4) left = left - tip.offsetWidth - 28;
      tip.style.left = left + 'px';
      tip.style.top = '10px';
    });
    svg.addEventListener('mouseleave', hide);
    function hide() {
      tip.classList.remove('show');
      guide.setAttribute('opacity', 0);
      dots.forEach(function (d) { d.setAttribute('opacity', 0); });
    }
  }

  /* ── 3. Radial gauge ───────────────────────
     SVGCharts.gauge('id', {value, color, label}) */
  function gauge(containerId, cfg) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = '';
    var size = 140, r = 56, cx = 70, cy = 70;
    var C = 2 * Math.PI * r;

    var svg = el('svg', { viewBox: '0 0 ' + size + ' ' + size, role: 'img', 'aria-label': (cfg.label || '') + ' ' + cfg.value + '점' }, box);
    svg.style.width = '100%';
    svg.style.height = '100%';

    el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: cssVar('--bar-bg'), 'stroke-width': 11 }, svg);
    var arc = el('circle', {
      cx: cx, cy: cy, r: r, fill: 'none', stroke: cfg.color, 'stroke-width': 11,
      'stroke-linecap': 'round', 'stroke-dasharray': C, 'stroke-dashoffset': C,
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
    }, svg);

    var num = el('text', {
      x: cx, y: cy + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'font-size': 30, 'font-weight': 800, fill: cssVar('--txt'), 'font-family': 'inherit'
    }, svg);
    var sub = el('text', { x: cx, y: cy + 24, 'text-anchor': 'middle', 'font-size': 10, fill: cssVar('--sub'), 'font-family': 'inherit' }, svg);
    sub.textContent = '/ 100점';

    animate(1000, function (t) {
      var v = cfg.value * t;
      arc.setAttribute('stroke-dashoffset', C * (1 - v / 100));
      num.textContent = Math.round(v);
    });
  }

  /* ── 4. Semicircle gauge ───────────────────
     SVGCharts.semicircle('id', {value, color, label}) */
  function semicircle(containerId, cfg) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = '';
    var W = 200, H = 118, r = 78, cx = 100, cy = 100;
    var C = Math.PI * r; // 반원 둘레

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': (cfg.label || '이수율') + ' ' + cfg.value + '%' }, box);
    svg.style.width = '100%';
    svg.style.height = 'auto';

    var dTrack = 'M ' + (cx - r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy;
    el('path', { d: dTrack, fill: 'none', stroke: cssVar('--bar-bg'), 'stroke-width': 14, 'stroke-linecap': 'round' }, svg);
    var arc = el('path', {
      d: dTrack, fill: 'none', stroke: cfg.color, 'stroke-width': 14, 'stroke-linecap': 'round',
      'stroke-dasharray': C, 'stroke-dashoffset': C
    }, svg);

    var num = el('text', {
      x: cx, y: cy - 8, 'text-anchor': 'middle',
      'font-size': 30, 'font-weight': 800, fill: cssVar('--txt'), 'font-family': 'inherit'
    }, svg);
    var sub = el('text', { x: cx, y: cy + 12, 'text-anchor': 'middle', 'font-size': 11, fill: cssVar('--sub'), 'font-family': 'inherit' }, svg);
    sub.textContent = cfg.label || '전사 이수율';

    animate(1000, function (t) {
      var v = cfg.value * t;
      arc.setAttribute('stroke-dashoffset', C * (1 - v / 100));
      num.textContent = Math.round(v) + '%';
    });
  }

  window.SVGCharts = { donut: donut, line: line, gauge: gauge, semicircle: semicircle };
})();
