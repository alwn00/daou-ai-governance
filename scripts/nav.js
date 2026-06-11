/* ════════════════════════════════════════════
   nav.js — 공용 사이드바 주입 + 활성 상태 처리
   아이콘은 scripts/icons.js 레지스트리를 사용합니다.
   (메뉴 항목 추가 시 이 파일의 MENU 배열만 수정하면 됩니다)
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  var MENU = [
    { label: 'MENU' },
    { page: 'dashboard', icon: 'dashboard', text: '메인 대시보드' },
    { page: 'inventory', icon: 'inventory', text: 'AI 인벤토리' },
    { page: 'risk', icon: 'risk', text: '리스크 관리', badge: 5 },
    { page: 'gate', icon: 'gate', text: '도입 심사 (AI Gate)', badge: 3 },
    { page: 'monitoring', icon: 'monitoring', text: '모니터링' },
    { label: 'OPERATION' },
    { page: 'policy', icon: 'policy', text: '정책 관리' },
    { page: 'education', icon: 'education', text: '교육 관리' },
    { page: 'audit', icon: 'audit', text: '감사 리포트' }
  ];

  function buildNav() {
    var items = MENU.map(function (m) {
      if (m.label) return '<div class="label">' + m.label + '</div>';
      return '<a href="' + m.page + '.html" data-page="' + m.page + '">' +
        '<span class="ico" data-icon="' + m.icon + '" data-size="17"></span>' + m.text +
        (m.badge ? '<span class="badge">' + m.badge + '</span>' : '') +
        '</a>';
    }).join('');

    return '<aside class="sidebar" id="sidebar">' +
      '<div class="brand">' +
        '<img src="../assets/logo.svg" alt="DAOU 다우기술" class="brand-logo">' +
        '<div class="tag">AI 거버넌스 관리 플랫폼</div>' +
      '</div>' +
      '<nav class="nav" aria-label="주 메뉴">' + items + '</nav>' +
      '<div class="side-foot">AI 거버넌스 위원회 운영<br>XI Lab · 법무팀 · 보안팀 · 서비스개발팀</div>' +
    '</aside>';
  }

  function initNav() {
    var mount = document.getElementById('nav-mount');
    if (!mount) return;
    mount.outerHTML = buildNav();

    var sidebar = document.getElementById('sidebar');
    if (window.Icons) Icons.mount(sidebar);

    var page = document.body.dataset.page;
    var active = document.querySelector('.nav a[data-page="' + page + '"]');
    if (active) {
      active.classList.add('active');
      active.setAttribute('aria-current', 'page');
    }

    // 모바일 햄버거 토글 + 오버레이
    var toggle = document.createElement('button');
    toggle.className = 'menu-toggle';
    toggle.setAttribute('aria-label', '메뉴 열기');
    toggle.innerHTML = '☰';
    var overlay = document.createElement('div');
    overlay.className = 'side-overlay';
    document.body.appendChild(toggle);
    document.body.appendChild(overlay);

    function close() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show', sidebar.classList.contains('open'));
    });
    overlay.addEventListener('click', close);
  }

  document.addEventListener('DOMContentLoaded', initNav);
})();
