/* ════════════════════════════════════════════
   audit.js — 감사 리포트: 컴플라이언스 게이지,
   리포트 생성 미리보기, 이전 리포트 목록
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  var HISTORY = [
    { date: '2026.06.01', type: '분기 AI 현황 보고서', range: '2026.03.01 – 05.31', by: '김미주 (CAIO Office)' },
    { date: '2026.05.15', type: '한국 AI 기본법 준수 보고서', range: '2026.01.22 – 05.10', by: '법무팀 정한별' },
    { date: '2026.04.28', type: '내부 감사 보고서', range: '2026.01.01 – 04.20', by: '보안팀 강현우' },
    { date: '2026.03.30', type: 'EU AI Act 컴플라이언스 리포트', range: '2026.01.01 – 03.25', by: 'XI Lab 김미주' },
    { date: '2026.02.12', type: '한국 AI 기본법 준수 보고서', range: '2026.01.22 – 02.10', by: '법무팀 정한별' }
  ];

  var REPORT_BODIES = {
    '한국 AI 기본법 준수 보고서':
      '<h4>1. 적용 범위</h4>' +
      '<p>등록 AI 시스템 7건 전체. 이 중 고영향 AI 해당 가능성 시스템 1건(다우오피스 HR AI).</p>' +
      '<h4>2. 의무 이행 현황</h4>' +
      '<ul>' +
        '<li><b>투명성 고지:</b> 제품 탑재 AI 5건 중 4건 적용 완료. Gemini 임직원 사용 고지 기준 적용 진행 중 (RSK-003, 기한 06.24).</li>' +
        '<li><b>고영향 AI 관리:</b> 다우오피스 HR AI 사전 영향평가 미실시 — 과기정통부 확인 요청 절차 착수 단계 (RSK-001, 기한 07.01).</li>' +
        '<li><b>AI 생성물 표시:</b> 이원화 표시(사람 인식 + 기계 판독) 기준 수립 중. 뿌리오 AI 워터마킹 대응 계획 수립 필요 (RSK-005).</li>' +
        '<li><b>AI 리터러시 교육:</b> 전사 이수율 77% · 마감 06.30 · 미이수 52명.</li>' +
      '</ul>' +
      '<h4>3. 종합 의견</h4>' +
      '<p>현재 과태료 유예 기간(2027년 전)이나, 고영향 AI 확인 절차를 6월 내 착수해야 일정상 안전합니다. 종합 준수 점수 <b>72/100</b>.</p>',
    'EU AI Act 컴플라이언스 리포트':
      '<h4>1. 적용 범위</h4>' +
      '<p>EU 역외 적용 대상 검토 중. EU 소재 고객사·이용자 전수 조사 진행 중 (RSK-002).</p>' +
      '<h4>2. 의무 이행 현황</h4>' +
      '<ul>' +
        '<li><b>위험 분류:</b> 4단계 분류 완료 — 고위험 1건(HR AI, Annex III 고용 영역), 제한적 위험 4건, 최소 위험 2건.</li>' +
        '<li><b>워터마킹(제50조):</b> 미적용. 기한 2026.12.02 — 뿌리오 AI 우선 대응 필요.</li>' +
        '<li><b>고위험 AI 의무(제9·11조):</b> 기술 문서·위험 관리 체계 미비. Digital Omnibus로 기한 2027.12.02 연장.</li>' +
      '</ul>' +
      '<h4>3. 종합 의견</h4>' +
      '<p>EU 기준 충족 시 한국 AI 기본법 의무가 자동 충족되므로 EU 기준을 전사 컴플라이언스 베이스라인으로 권고합니다. 종합 준수 점수 <b>58/100</b>.</p>',
    '내부 감사 보고서':
      '<h4>1. 감사 범위</h4>' +
      '<p>데이터 보안 원칙 운영, AI Gate 프로세스, 인벤토리 관리 체계.</p>' +
      '<h4>2. 점검 결과</h4>' +
      '<ul>' +
        '<li><b>고객 데이터 학습 미사용:</b> 원칙 공시 및 계약 반영 확인. 단, 정기 검증 프로세스 미구축 — 감사 로그 체계 구축 권고 (30일 내).</li>' +
        '<li><b>AI Gate:</b> 심사 3건 진행 중 · 평균 처리 6.2일로 SLA(10일) 충족. 단계별 검토 기록 양호.</li>' +
        '<li><b>인벤토리:</b> 등록률 100% · 7건 전체 검토 주기 준수.</li>' +
      '</ul>' +
      '<h4>3. 종합 의견</h4>' +
      '<p>운영 성숙도 양호. 검증 자동화가 보완되면 우수 등급 가능. 종합 점수 <b>89/100</b>.</p>',
    '분기 AI 현황 보고서':
      '<h4>1. 운영 현황</h4>' +
      '<ul>' +
        '<li>등록 AI 시스템 7건 (제품 탑재 5 · 임직원 도구 2) — 분기 중 신규 등록 1건.</li>' +
        '<li>AI Gate 심사 3건 진행 중 · 분기 승인 2건.</li>' +
        '<li>미조치 리스크 5건 (고위험 2 · 중위험 3) — 분기 중 조치 완료 3건.</li>' +
      '</ul>' +
      '<h4>2. 사용량 동향</h4>' +
      '<p>일평균 API 호출 약 2,600건. 다우오피스 AI가 전체의 55%를 차지하며 전 분기 대비 21% 증가.</p>' +
      '<h4>3. 차기 분기 중점 과제</h4>' +
      '<ul>' +
        '<li>고영향 AI 사전 영향평가 완료 (HR AI)</li>' +
        '<li>워터마킹 기술 적용 로드맵 확정 (뿌리오 AI)</li>' +
        '<li>교육 이수율 90% 달성</li>' +
      '</ul>'
  };

  function fmtDate(iso) {
    return iso ? iso.replace(/-/g, '.') : '';
  }

  function renderHistory() {
    var tbody = document.getElementById('rptHistory');
    tbody.innerHTML = '';
    HISTORY.forEach(function (h) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="td-sub">' + h.date + '</td>' +
        '<td><span class="ai-name">' + h.type + '</span></td>' +
        '<td class="td-sub">' + h.range + '</td>' +
        '<td>' + h.by + '</td>' +
        '<td><button class="dl-link" data-dl="' + h.type + '">⬇ PDF</button></td>';
      tbody.appendChild(tr);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var css = getComputedStyle(document.documentElement);
    function v(name) { return css.getPropertyValue(name).trim(); }

    // 컴플라이언스 점수 게이지 (SVG radial, 로드 애니메이션)
    SVGCharts.gauge('gaugeKr', { value: 72, color: v('--mid'), label: '한국 AI 기본법' });
    SVGCharts.gauge('gaugeEu', { value: 58, color: v('--high'), label: 'EU AI Act' });
    SVGCharts.gauge('gaugeInt', { value: 89, color: v('--low'), label: '내부 감사' });

    renderHistory();

    // 리포트 생성 → 인라인 미리보기
    document.getElementById('btnGenerate').addEventListener('click', function () {
      var type = document.getElementById('rptType').value;
      var from = fmtDate(document.getElementById('rptFrom').value);
      var to = fmtDate(document.getElementById('rptTo').value);
      if (!from || !to) { UI.toast('대상 기간을 선택해 주세요.'); return; }

      var preview = document.getElementById('rptPreview');
      preview.innerHTML =
        '<h3>' + type + '</h3>' +
        '<div class="rp-meta">대상 기간 ' + from + ' – ' + to + ' · 생성 2026.06.11 · 작성 김미주 (CAIO Office) · DAOU AI Governance Platform 자동 생성</div>' +
        REPORT_BODIES[type] +
        '<div class="rp-actions">' +
          '<button class="btn-primary btn-sm" data-rpt-download>⬇ PDF 다운로드</button>' +
          '<button class="btn-ghost btn-sm" data-rpt-save>이전 리포트에 저장</button>' +
        '</div>';
      preview.classList.add('show');
      preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      UI.toast('✓ 리포트가 생성되었습니다. 아래 미리보기를 확인하세요.');
    });

    // 미리보기 액션 + 이전 리포트 다운로드 (이벤트 위임)
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-rpt-download]') || e.target.closest('[data-dl]')) {
        UI.toast('📄 PDF 다운로드 — 데모 환경에서는 시뮬레이션됩니다.');
      }
      if (e.target.closest('[data-rpt-save]')) {
        var type = document.getElementById('rptType').value;
        var from = fmtDate(document.getElementById('rptFrom').value);
        var to = fmtDate(document.getElementById('rptTo').value);
        HISTORY.unshift({ date: '2026.06.11', type: type, range: from + ' – ' + to, by: '김미주 (CAIO Office)' });
        renderHistory();
        UI.toast('✓ 이전 리포트 목록에 저장되었습니다.');
      }
    });
  });
})();
