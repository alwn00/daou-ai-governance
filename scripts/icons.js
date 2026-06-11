/* ════════════════════════════════════════════
   icons.js — 중앙 SVG 아이콘 레지스트리
   ─ 아이콘 추가·수정은 이 파일 한 곳에서만 합니다.
   ─ HTML에서는 <span data-icon="bell"></span> 형태로 사용하면
     페이지 로드 시 자동으로 SVG가 주입됩니다.
   ─ 크기 지정: data-size="20" (기본 18px)
   스타일: 24×24 viewBox · 2px stroke · currentColor
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  var PATHS = {
    /* ── 내비게이션 아이콘 (assets/icons/*.svg 와 동일 도형) ── */
    dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    inventory: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/>',
    risk: '<path d="M12 3.5 L21.5 20 L2.5 20 Z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>',
    gate: '<path d="M12 3 L20 6 V12 C20 17 16.5 20 12 21 C7.5 20 4 17 4 12 V6 Z"/><path d="M8.5 11.5 L11 14 L15.5 9.5"/>',
    monitoring: '<polyline points="3 14 8 9 12 13 16 6 21 11"/><line x1="3" y1="20" x2="21" y2="20"/>',
    policy: '<path d="M6 3 H14 L19 8 V21 H6 Z"/><path d="M14 3 V8 H19"/><line x1="9" y1="12" x2="16" y2="12"/><line x1="9" y1="16" x2="16" y2="16"/>',
    education: '<path d="M2 9.5 L12 4.5 L22 9.5 L12 14.5 Z"/><path d="M6.5 12 V16.5 C6.5 18 9 19.5 12 19.5 C15 19.5 17.5 18 17.5 16.5 V12"/><line x1="22" y1="9.5" x2="22" y2="15"/>',
    audit: '<path d="M5 3 H13 L18 8 V21 H5 Z"/><path d="M13 3 V8 H18"/><circle cx="10.5" cy="13.5" r="2.8"/><line x1="12.6" y1="15.6" x2="15" y2="18"/>',

    /* ── 콘텐츠·헤더용 아이콘 ── */
    bell: '<path d="M18 9 A6 6 0 0 0 6 9 C6 14 4 16 4 16 H20 C20 16 18 14 18 9 Z"/><path d="M10.3 19.5 A2 2 0 0 0 13.7 19.5"/>',
    scale: '<line x1="12" y1="4" x2="12" y2="20"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7 L2.5 13 A2.8 2.8 0 0 0 7.5 13 Z"/><path d="M19 7 L16.5 13 A2.8 2.8 0 0 0 21.5 13 Z"/><line x1="8" y1="20" x2="16" y2="20"/>',
    pie: '<path d="M12 3 A9 9 0 1 1 4.2 16.5 L12 12 Z"/><path d="M14.5 3.4 A9 9 0 0 1 20.6 9.5 L14.5 9.5 Z"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11 V8 A4 4 0 0 1 16 8 V11"/><circle cx="12" cy="15.5" r="1" fill="currentColor"/>',
    globe: '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3 C15 6 15 18 12 21 C9 18 9 6 12 3 Z"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5 L11 15.5 L16.5 9.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
    send: '<path d="M21 3 L10.5 13.5"/><path d="M21 3 L14.5 21 L10.5 13.5 L3 9.5 Z"/>',
    report: '<path d="M6 3 H14 L19 8 V21 H6 Z"/><path d="M14 3 V8 H19"/><line x1="9" y1="13" x2="9" y2="17"/><line x1="12.5" y1="11" x2="12.5" y2="17"/><line x1="16" y1="14.5" x2="16" y2="17"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20 C3 16.5 5.5 14.5 9 14.5 C12.5 14.5 15 16.5 15 20"/><path d="M16 9 A3 3 0 0 1 16 15"/><path d="M17.5 14.8 C20 15.4 21 17.3 21 20"/>',
    arrow: '<line x1="4" y1="12" x2="20" y2="12"/><polyline points="13 5 20 12 13 19"/>'
  };

  function svg(name, size) {
    var body = PATHS[name];
    if (!body) return '';
    return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /* [data-icon] 요소에 SVG 자동 주입 */
  function mount(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = svg(el.dataset.icon, el.dataset.size ? +el.dataset.size : 18);
    });
  }

  document.addEventListener('DOMContentLoaded', function () { mount(document); });

  window.Icons = { svg: svg, mount: mount };
})();
