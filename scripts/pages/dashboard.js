/* ════════════════════════════════════════════
   dashboard.js — 메인 대시보드 인터랙션
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var css = getComputedStyle(document.documentElement);

    // 위험 등급 분포 도넛 (SVG)
    SVGCharts.donut('riskDonut', {
      segments: [
        { label: '고위험', value: 1, color: css.getPropertyValue('--high').trim() },
        { label: '중위험', value: 3, color: css.getPropertyValue('--mid').trim() },
        { label: '저위험', value: 3, color: css.getPropertyValue('--low').trim() }
      ],
      total: 7,
      centerLabel: '등록 AI'
    });

    // AI Gate 신청 모달 — 제출 시 목록 맨 위에 '접수' 단계로 추가
    UI.initGateModal({
      onSubmit: function (app) {
        var item = document.createElement('div');
        item.className = 'gate-item';
        item.innerHTML =
          '<div class="gate-ico"></div>' +
          '<div class="gate-body">' +
            '<b></b>' +
            '<span>방금 신청 · ' + app.dateStr + ' · ' + app.type + '</span>' +
            '<div class="gate-steps"><i class="on"></i><i></i><i></i><i></i></div>' +
          '</div>' +
          '<span class="stage s1">접수</span>';
        item.querySelector('.gate-ico').textContent = app.name.charAt(0).toUpperCase();
        item.querySelector('b').textContent = app.name;
        document.getElementById('gateList').prepend(item);
      }
    });

    // "AI 도입 심사 신청" 버튼들 (이벤트 위임)
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action="open-gate-modal"]');
      if (btn) UI.openGateModal();
    });

    // 인벤토리 미니 테이블 행 클릭 → 인벤토리 페이지로 이동
    var tbody = document.querySelector('tbody[data-href]');
    if (tbody) {
      tbody.addEventListener('click', function () {
        window.location.href = tbody.dataset.href;
      });
    }
  });
})();
