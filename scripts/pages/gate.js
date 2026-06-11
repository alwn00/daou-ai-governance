/* ════════════════════════════════════════════
   gate.js — AI Gate: 칸반 드래그앤드롭, 상세 모달,
   SVG 단계 진행 인디케이터, 신규 신청
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  var STAGES = ['접수', '위험 평가', '보안·법무 검토', '위원회 승인'];
  var TODAY = new Date(2026, 5, 11); // 2026.06.11 (데모 기준일)

  var APPS = [
    {
      id: 'GA-2026-014', name: 'Google Workspace Enterprise', dept: '경영지원본부',
      date: '2026.06.03', risk: 'mid', riskLabel: '중위험', stage: 3,
      type: '임직원 사용 도구', purpose: '전직원 협업 환경 전환 — 문서·메일·미팅 전반에 Gemini 기능 포함',
      data: ['사내 일반 문서', '개인정보'],
      reviews: [
        { by: '보안팀 · 강현우', date: '2026.06.09', text: '데이터 리전(서울) 확약 확인. DLP 정책 연동 조건부 적격.' },
        { by: 'XI Lab · 김미주', date: '2026.06.05', text: '위험 평가 완료 — 중위험. 개인정보 처리 범위 보안 검토 필요.' },
        { by: '시스템', date: '2026.06.03', text: '접수 완료 (경영지원본부 신청)' }
      ]
    },
    {
      id: 'GA-2026-015', name: '사방넷 AI 상품 연동 고도화', dept: '서비스개발팀',
      date: '2026.06.05', risk: 'mid', riskLabel: '중위험', stage: 2,
      type: '제품 탑재 AI 기능', purpose: '사방넷 상품 데이터 자동 매핑·카테고리 추천 기능 고도화',
      data: ['고객사 데이터', '상품 데이터'],
      reviews: [
        { by: 'XI Lab · 김미주', date: '2026.06.08', text: '고객사 데이터 처리 범위 확인 중 — 학습 미사용 원칙 적용 여부 검토.' },
        { by: '시스템', date: '2026.06.05', text: '접수 완료 (서비스개발팀 신청)' }
      ]
    },
    {
      id: 'GA-2026-016', name: 'Perplexity 업무 활용', dept: '마케팅팀',
      date: '2026.06.09', risk: 'low', riskLabel: '저위험', stage: 1,
      type: '임직원 사용 도구', purpose: '시장 조사·경쟁사 분석 리서치 업무 효율화 (부서 단위)',
      data: ['사내 일반 문서'],
      reviews: [
        { by: '시스템', date: '2026.06.09', text: '접수 완료 (마케팅팀 신청)' }
      ]
    }
  ];

  var seq = 17; // 신규 신청 ID 시퀀스

  function daysElapsed(dateStr) {
    var p = dateStr.split('.');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return Math.max(0, Math.round((TODAY - d) / 86400000));
  }

  /* ── 칸반 렌더 ─────────────────────────── */
  function renderKanban() {
    document.querySelectorAll('.kan-col').forEach(function (col) {
      var stage = +col.dataset.stage;
      var wrap = col.querySelector('.kan-cards');
      wrap.innerHTML = '';
      var items = APPS.filter(function (a) { return a.stage === stage; });
      col.querySelector('.kan-count').textContent = items.length;
      items.forEach(function (a) {
        var card = document.createElement('div');
        card.className = 'kan-card';
        card.draggable = true;
        card.dataset.id = a.id;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', a.name + ' 상세 보기');
        card.innerHTML =
          '<div class="kc-name"></div>' +
          '<div class="kc-meta">' + a.dept + ' · 접수 ' + a.date + '</div>' +
          '<div class="kc-foot"><span class="risk ' + a.risk + '">' + a.riskLabel + '</span>' +
          '<span class="kc-days">경과 ' + daysElapsed(a.date) + '일</span></div>';
        card.querySelector('.kc-name').textContent = a.name;
        wrap.appendChild(card);
      });
    });
  }

  /* ── 테이블 렌더 ───────────────────────── */
  function renderTable() {
    var tbody = document.getElementById('gateTableBody');
    tbody.innerHTML = '';
    APPS.slice().sort(function (a, b) { return b.id.localeCompare(a.id); }).forEach(function (a) {
      var tr = document.createElement('tr');
      tr.className = 'clickable';
      tr.dataset.id = a.id;
      var stageClass = 's' + a.stage;
      tr.innerHTML =
        '<td class="td-sub">' + a.id + '</td>' +
        '<td><span class="ai-name"></span></td>' +
        '<td>' + a.dept + '</td>' +
        '<td class="td-sub">' + a.date + '</td>' +
        '<td><span class="risk ' + a.risk + '">' + a.riskLabel + '</span></td>' +
        '<td><span class="stage ' + stageClass + '">' + STAGES[a.stage - 1] + '</span></td>' +
        '<td class="td-sub">' + daysElapsed(a.date) + '일</td>';
      tr.querySelector('.ai-name').textContent = a.name;
      tbody.appendChild(tr);
    });
  }

  /* ── SVG 단계 진행 인디케이터 ───────────── */
  function stageSVG(current) {
    var NS = 'http://www.w3.org/2000/svg';
    var W = 580, H = 64, n = STAGES.length;
    var padX = 60, gap = (W - padX * 2) / (n - 1), cy = 24, r = 11;
    var css = getComputedStyle(document.documentElement);
    function v(name) { return css.getPropertyValue(name).trim(); }

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'stage-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '현재 단계: ' + STAGES[current - 1]);

    function el(tag, attrs) {
      var node = document.createElementNS(NS, tag);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      svg.appendChild(node);
      return node;
    }

    for (var i = 0; i < n - 1; i++) {
      var x1 = padX + gap * i + r, x2 = padX + gap * (i + 1) - r;
      el('line', {
        x1: x1, y1: cy, x2: x2, y2: cy,
        stroke: i < current - 1 ? v('--blue') : v('--step-bg'), 'stroke-width': 3, 'stroke-linecap': 'round'
      });
    }
    for (var j = 0; j < n; j++) {
      var cx = padX + gap * j;
      var done = j < current - 1, active = j === current - 1;
      el('circle', {
        cx: cx, cy: cy, r: r,
        fill: done || active ? v('--blue') : v('--card'),
        stroke: done || active ? v('--blue') : v('--step-bg'), 'stroke-width': 2.5
      });
      if (done) {
        el('path', {
          d: 'M' + (cx - 4.5) + ' ' + cy + ' l3.2 3.4 l6 -6.4',
          fill: 'none', stroke: v('--card'), 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        });
      } else {
        var num = el('text', {
          x: cx, y: cy + 3.8, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 800,
          fill: active ? v('--card') : v('--sub'), 'font-family': 'inherit'
        });
        num.textContent = j + 1;
      }
      var lbl = el('text', {
        x: cx, y: cy + 30, 'text-anchor': 'middle', 'font-size': 11,
        'font-weight': active ? 800 : 600,
        fill: active ? v('--blue') : v('--sub'), 'font-family': 'inherit'
      });
      lbl.textContent = STAGES[j];
    }
    return svg;
  }

  /* ── 상세 모달 ─────────────────────────── */
  var currentApp = null;

  function openDetail(id) {
    var a = APPS.find(function (x) { return x.id === id; });
    if (!a) return;
    currentApp = a;
    document.getElementById('gdTitle').textContent = a.name;
    document.getElementById('gdSub').textContent = a.id + ' · ' + a.dept + ' · 접수 ' + a.date + ' · 경과 ' + daysElapsed(a.date) + '일';
    var stageBox = document.getElementById('gdStage');
    stageBox.innerHTML = '';
    stageBox.appendChild(stageSVG(a.stage));
    document.getElementById('gdBody').innerHTML =
      '<div class="p-section"><h4>신청 정보</h4>' +
        '<div class="p-kv"><span class="k">도입 유형</span><span class="v">' + a.type + '</span></div>' +
        '<div class="p-kv"><span class="k">위험 등급(잠정)</span><span class="v"><span class="risk ' + a.risk + '">' + a.riskLabel + '</span></span></div>' +
        '<div class="p-kv"><span class="k">사용 목적</span><span class="v" style="max-width:60%">' + (a.purpose || '—') + '</span></div>' +
      '</div>' +
      '<div class="p-section"><h4>처리 데이터 유형</h4><div class="chip-list">' +
        (a.data.length ? a.data.map(function (d) { return '<span class="chip data">' + d + '</span>'; }).join('') : '<span class="td-sub">선택 항목 없음</span>') +
      '</div></div>' +
      '<div class="p-section"><h4>검토 이력</h4><div class="review-box">' +
        a.reviews.map(function (rv) {
          return '<div class="rv-row"><b>' + rv.by + '</b><span class="rv-date">' + rv.date + '</span><br>' + rv.text + '</div>';
        }).join('') +
      '</div></div>';
    document.getElementById('gdComment').value = '';
    UI.openModal('gateDetailBg');
  }

  /* ── 드래그 앤 드롭 ────────────────────── */
  var dragId = null;
  var dragMoved = false;

  function initDnD() {
    var kanban = document.getElementById('kanban');

    kanban.addEventListener('dragstart', function (e) {
      var card = e.target.closest('.kan-card');
      if (!card) return;
      dragId = card.dataset.id;
      dragMoved = false;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragId);
    });
    kanban.addEventListener('dragend', function (e) {
      var card = e.target.closest('.kan-card');
      if (card) card.classList.remove('dragging');
      document.querySelectorAll('.kan-col').forEach(function (c) { c.classList.remove('drag-over'); });
    });
    kanban.addEventListener('dragover', function (e) {
      var col = e.target.closest('.kan-col');
      if (!col) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.kan-col').forEach(function (c) { c.classList.toggle('drag-over', c === col); });
    });
    kanban.addEventListener('drop', function (e) {
      var col = e.target.closest('.kan-col');
      if (!col || !dragId) return;
      e.preventDefault();
      var a = APPS.find(function (x) { return x.id === dragId; });
      var newStage = +col.dataset.stage;
      if (a && a.stage !== newStage) {
        a.stage = newStage;
        a.reviews.unshift({ by: '시스템', date: '2026.06.11', text: '단계 이동 — ' + STAGES[newStage - 1] + ' (김미주 · CAIO Office)' });
        dragMoved = true;
        renderKanban();
        renderTable();
        UI.toast('「' + a.name + '」 단계가 「' + STAGES[newStage - 1] + '」(으)로 이동되었습니다.');
      }
      dragId = null;
      document.querySelectorAll('.kan-col').forEach(function (c) { c.classList.remove('drag-over'); });
    });

    // 카드 클릭 / 키보드 → 상세 (드래그 직후 클릭 무시)
    kanban.addEventListener('click', function (e) {
      var card = e.target.closest('.kan-card');
      if (card && !dragMoved) openDetail(card.dataset.id);
      dragMoved = false;
    });
    kanban.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.kan-card');
      if (card) { e.preventDefault(); openDetail(card.dataset.id); }
    });
  }

  /* ── 초기화 ────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    renderKanban();
    renderTable();
    initDnD();

    // 신규 신청 모달 (공용) — 제출 시 '접수' 칼럼에 카드 추가
    UI.initGateModal({
      onSubmit: function (form) {
        APPS.unshift({
          id: 'GA-2026-0' + (seq++),
          name: form.name, dept: form.dept, date: form.dateStr,
          risk: (form.data.indexOf('개인정보') >= 0 || form.data.indexOf('인사·채용 정보') >= 0) ? 'mid' : 'low',
          riskLabel: (form.data.indexOf('개인정보') >= 0 || form.data.indexOf('인사·채용 정보') >= 0) ? '중위험' : '저위험',
          stage: 1, type: form.type, purpose: form.purpose, data: form.data,
          reviews: [{ by: '시스템', date: form.dateStr, text: '접수 완료 (' + form.dept + ' 신청)' }]
        });
        renderKanban();
        renderTable();
      }
    });
    document.getElementById('btnNewGate').addEventListener('click', UI.openGateModal);

    // 테이블 행 → 상세
    document.getElementById('gateTableBody').addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-id]');
      if (tr) openDetail(tr.dataset.id);
    });

    // 상세 모달 버튼
    document.getElementById('gdClose').addEventListener('click', function () {
      UI.closeModal('gateDetailBg');
    });
    document.getElementById('gdSaveComment').addEventListener('click', function () {
      var text = document.getElementById('gdComment').value.trim();
      if (!text) { UI.toast('코멘트를 입력해 주세요.'); return; }
      if (currentApp) {
        currentApp.reviews.unshift({ by: '김미주 · CAIO Office', date: '2026.06.11', text: text });
        openDetail(currentApp.id); // 이력 갱신 재렌더
        UI.toast('✓ 코멘트가 검토 이력에 저장되었습니다.');
      }
    });
  });
})();
