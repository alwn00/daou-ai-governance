/* ════════════════════════════════════════════
   components.js — 토스트, 모달, AI Gate 신청 모달 등
   공용 인터랙션. 전역에는 window.UI 하나만 노출합니다.
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  var toastEl = null;
  var toastTimer = null;

  function ensureToast() {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    return toastEl;
  }

  function toast(msg) {
    var el = ensureToast();
    el.textContent = msg || '데모 환경에서는 지원하지 않는 동작입니다.';
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  function openModal(id) {
    var bg = document.getElementById(id);
    if (bg) bg.classList.add('show');
  }
  function closeModal(id) {
    var bg = document.getElementById(id);
    if (bg) bg.classList.remove('show');
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-bg.show').forEach(function (m) { m.classList.remove('show'); });
  }

  // 배경 클릭으로 닫기 (이벤트 위임)
  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('modal-bg')) {
      e.target.classList.remove('show');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllModals();
  });

  /* ── 체크칩 토글 (.checks 내부 label) ───────── */
  function initChips(container) {
    (container || document).querySelectorAll('.checks label').forEach(function (l) {
      var input = l.querySelector('input');
      if (!input) return;
      input.addEventListener('change', function () {
        l.classList.toggle('on', input.checked);
      });
    });
  }

  /* ── AI Gate 신청 모달 (대시보드·Gate 페이지 공용) ── */
  var GATE_MODAL_HTML =
    '<div class="modal-bg" id="gateModalBg" role="dialog" aria-modal="true" aria-labelledby="gateModalTitle">' +
      '<div class="modal">' +
        '<h3 id="gateModalTitle">AI 도입 심사 신청 (AI Gate)</h3>' +
        '<p class="m-sub">신규 AI 도구 도입 또는 제품 내 AI 기능 추가 시, 거버넌스 위원회의 사전 심사를 신청합니다.</p>' +
        '<div class="m-info">💡 처리 데이터에 <b>개인정보·인사정보</b>가 포함되거나 <b>채용·평가 의사결정</b>에 관여하는 경우, 고영향 AI 검토 절차(법무팀 협의)가 자동으로 추가됩니다.</div>' +
        '<div class="f-2">' +
          '<div class="f-row"><label for="gfType">도입 유형 <em>*</em></label>' +
            '<select id="gfType"><option>임직원 사용 도구</option><option>제품 탑재 AI 기능</option><option>외부 AI API 연동</option></select></div>' +
          '<div class="f-row"><label for="gfDept">신청 부서 <em>*</em></label>' +
            '<select id="gfDept"><option>XI Lab</option><option>서비스개발본부</option><option>비즈마케팅부문</option><option>영업본부</option><option>경영지원본부</option><option>고객지원본부</option></select></div>' +
        '</div>' +
        '<div class="f-row"><label for="gfName">AI 도구 / 기능명 <em>*</em></label>' +
          '<input id="gfName" type="text" placeholder="예: Notion AI, 다우오피스 회의록 자동 요약 기능"></div>' +
        '<div class="f-row"><label for="gfPurpose">사용 목적</label>' +
          '<textarea id="gfPurpose" rows="2" placeholder="어떤 업무에, 어떤 방식으로 활용할 예정인지 작성해 주세요."></textarea></div>' +
        '<div class="f-row"><label id="gfDataLabel">처리 데이터 유형 (해당 항목 모두 선택)</label>' +
          '<div class="checks" id="gfDataChecks" role="group" aria-labelledby="gfDataLabel">' +
            '<label><input type="checkbox" value="사내 일반 문서">사내 일반 문서</label>' +
            '<label><input type="checkbox" value="고객사 데이터">고객사 데이터</label>' +
            '<label><input type="checkbox" value="개인정보">개인정보</label>' +
            '<label><input type="checkbox" value="인사·채용 정보">인사·채용 정보</label>' +
            '<label><input type="checkbox" value="소스코드">소스코드</label>' +
            '<label><input type="checkbox" value="재무 정보">재무 정보</label>' +
          '</div></div>' +
        '<div class="m-actions">' +
          '<button type="button" class="btn-ghost" data-gate-cancel>취소</button>' +
          '<button type="button" class="btn-primary" data-gate-submit>심사 신청</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  /**
   * AI Gate 신청 모달 주입 + 동작 연결
   * @param {Object} opts
   * @param {Function} opts.onSubmit  ({name, type, dept, purpose, data[], dateStr}) => void
   */
  function initGateModal(opts) {
    opts = opts || {};
    if (!document.getElementById('gateModalBg')) {
      document.body.insertAdjacentHTML('beforeend', GATE_MODAL_HTML);
      initChips(document.getElementById('gateModalBg'));
    }
    var bg = document.getElementById('gateModalBg');

    bg.querySelector('[data-gate-cancel]').addEventListener('click', function () {
      bg.classList.remove('show');
    });
    bg.querySelector('[data-gate-submit]').addEventListener('click', function () {
      var name = document.getElementById('gfName').value.trim();
      if (!name) { toast('AI 도구 / 기능명을 입력해 주세요.'); return; }
      var today = new Date();
      var dateStr = today.getFullYear() + '.' +
        String(today.getMonth() + 1).padStart(2, '0') + '.' +
        String(today.getDate()).padStart(2, '0');
      var data = [];
      bg.querySelectorAll('#gfDataChecks input:checked').forEach(function (c) { data.push(c.value); });
      var payload = {
        name: name,
        type: document.getElementById('gfType').value,
        dept: document.getElementById('gfDept').value,
        purpose: document.getElementById('gfPurpose').value.trim(),
        data: data,
        dateStr: dateStr
      };
      if (typeof opts.onSubmit === 'function') opts.onSubmit(payload);
      document.getElementById('gfName').value = '';
      document.getElementById('gfPurpose').value = '';
      bg.classList.remove('show');
      toast('✓ 심사 신청이 접수되었습니다. 거버넌스 위원회 검토 후 결과가 통보됩니다.');
    });
  }

  function openGateModal() { openModal('gateModalBg'); }

  window.UI = {
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    initChips: initChips,
    initGateModal: initGateModal,
    openGateModal: openGateModal
  };
})();
