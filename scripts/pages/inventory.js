/* ════════════════════════════════════════════
   inventory.js — AI 인벤토리: 데이터, 필터, 상세 패널
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  var SYSTEMS = [
    {
      id: 'AI-001', name: '다우오피스 AI', type: '제품 탑재', risk: 'low', riskLabel: '저위험',
      status: '운영 중', statusClass: 'ok', owner: '서비스개발본부',
      registered: '2025.11.12', reviewed: '2026.06.01',
      data: ['사내 일반 문서', '메일', '게시판'],
      reg: ['한국 AI 기본법 제31조 — 생성형 AI 사용 사실 고지', 'EU AI Act 제50조 — 투명성 의무 (제한적 위험)'],
      contact: '박지훈 책임 · 서비스개발본부 (jhpark@daou.co.kr)',
      history: [
        { date: '2026.06.01', text: '정기 점검 완료 — 이상 없음' },
        { date: '2026.03.14', text: 'AI 사용 고지 문구 제품 내 반영' },
        { date: '2025.11.12', text: '인벤토리 최초 등록 (Gate 승인)' }
      ]
    },
    {
      id: 'AI-002', name: '다우오피스 HR AI', type: '제품 탑재', risk: 'high', riskLabel: '고위험',
      status: '운영 중 (감시)', statusClass: 'act', owner: '서비스개발본부',
      registered: '2025.12.03', reviewed: '2026.06.08',
      data: ['인사·채용 정보', '근태 데이터', '개인정보'],
      reg: ['한국 AI 기본법 — 고영향 AI 해당 (채용·인사 의사결정), 사전 영향평가 의무', 'EU AI Act Annex III — 고위험 AI (고용·근로자 관리)'],
      contact: '이서연 수석 · 서비스개발본부 (sylee@daou.co.kr)',
      history: [
        { date: '2026.06.08', text: '고영향 AI 확인 요청 절차 검토 시작 (법무팀)' },
        { date: '2026.05.20', text: '월간 감시 점검 — 편향성 모니터링 지표 보고' },
        { date: '2025.12.03', text: '인벤토리 등록 · 고위험 등급 부여' }
      ]
    },
    {
      id: 'AI-003', name: '뿌리오 AI', type: '제품 탑재', risk: 'mid', riskLabel: '중위험',
      status: '운영 중', statusClass: 'ok', owner: '비즈마케팅부문',
      registered: '2025.12.18', reviewed: '2026.06.05',
      data: ['마케팅 문구', '발송 데이터'],
      reg: ['EU AI Act 제50조 — AI 생성 콘텐츠 워터마킹 (기한 2026.12.02)', '한국 AI 기본법 — AI 생성물 표시 이원화 (사람 인식 + 기계 판독)'],
      contact: '최민호 팀장 · 비즈마케팅부문 (mhchoi@daou.co.kr)',
      history: [
        { date: '2026.06.05', text: '워터마킹 미적용 리스크 등록 (RSK-005)' },
        { date: '2026.02.10', text: '생성 문구 검수 프로세스 도입' },
        { date: '2025.12.18', text: '인벤토리 등록' }
      ]
    },
    {
      id: 'AI-004', name: '사방넷 AI', type: '제품 탑재', risk: 'mid', riskLabel: '중위험',
      status: '운영 중', statusClass: 'ok', owner: '서비스개발본부',
      registered: '2026.01.15', reviewed: '2026.05.30',
      data: ['상품 데이터', 'CS 데이터'],
      reg: ['한국 AI 기본법 제31조 — 투명성 고지', 'EU AI Act — 제한적 위험 (투명성 의무)'],
      contact: '정태우 책임 · 서비스개발본부 (twjung@daou.co.kr)',
      history: [
        { date: '2026.05.30', text: '정기 점검 완료' },
        { date: '2026.06.05', text: '상품 연동 고도화 기능 Gate 심사 진행 중 (GA-2026-015)' },
        { date: '2026.01.15', text: '인벤토리 등록' }
      ]
    },
    {
      id: 'AI-005', name: '알리GPT', type: '제품 탑재', risk: 'mid', riskLabel: '중위험',
      status: '운영 중', statusClass: 'ok', owner: '고객지원본부',
      registered: '2025.11.28', reviewed: '2026.06.02',
      data: ['고객 문의', 'FAQ 2,500건'],
      reg: ['한국 AI 기본법 제31조 — 챗봇 AI 사용 사실 고지', '외부 API 계약 — 데이터 처리 조항 재검토 중 (RSK-004)'],
      contact: '한지원 매니저 · 고객지원본부 (jwhan@daou.co.kr)',
      history: [
        { date: '2026.06.02', text: '정기 점검 — 응답 정확도 92% 유지' },
        { date: '2026.05.12', text: 'GPT-3.5 API 계약 데이터 처리 조항 재검토 착수' },
        { date: '2025.11.28', text: '인벤토리 등록' }
      ]
    },
    {
      id: 'AI-006', name: 'Gemini for Workspace', type: '임직원 도구', risk: 'mid', riskLabel: '중위험',
      status: '운영 중', statusClass: 'rev', owner: '경영지원본부',
      registered: '2026.02.02', reviewed: '2026.05.28',
      data: ['업무 문서 전반', '사내 일반 문서'],
      reg: ['한국 AI 기본법 — 임직원 AI 사용 고지 기준 적용 필요 (RSK-003)', '사내 정책 — 금지 데이터 유형 입력 차단 교육 의무'],
      contact: '오세훈 차장 · 경영지원본부 (shoh@daou.co.kr)',
      history: [
        { date: '2026.05.28', text: 'AI 사용 고지 미적용 리스크 등록 (RSK-003)' },
        { date: '2026.04.07', text: '전직원 확대 적용' },
        { date: '2026.02.02', text: '인벤토리 등록 (Gate 승인)' }
      ]
    },
    {
      id: 'AI-007', name: 'Claude Code', type: '임직원 도구', risk: 'low', riskLabel: '저위험',
      status: '운영 중', statusClass: 'ok', owner: '서비스개발본부',
      registered: '2026.03.10', reviewed: '2026.05.26',
      data: ['소스코드 (개발자)'],
      reg: ['사내 정책 — 소스코드 외부 전송 기준 준수 (사내 승인 환경 한정)', '한국 AI 기본법 — 저위험 일반 AI'],
      contact: '김도현 수석 · 서비스개발본부 (dhkim@daou.co.kr)',
      history: [
        { date: '2026.05.26', text: '정기 점검 완료 — 접근 권한 감사 이상 없음' },
        { date: '2026.03.10', text: '인벤토리 등록 (개발 조직 한정 승인)' }
      ]
    }
  ];

  var filters = { type: 'all', risk: 'all', status: 'all' };

  function statusBucket(s) {
    // '운영 중 (감시)'도 '운영 중' 필터에 포함
    if (s.indexOf('운영 중') === 0) return '운영 중';
    return s;
  }

  function render() {
    var tbody = document.getElementById('invBody');
    var visible = SYSTEMS.filter(function (s) {
      return (filters.type === 'all' || s.type === filters.type) &&
             (filters.risk === 'all' || s.risk === filters.risk) &&
             (filters.status === 'all' || statusBucket(s.status) === filters.status);
    });
    document.getElementById('invCount').textContent = visible.length;

    tbody.innerHTML = '';
    if (!visible.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-note">조건에 해당하는 AI 시스템이 없습니다.</td></tr>';
      return;
    }
    visible.forEach(function (s) {
      var tr = document.createElement('tr');
      tr.className = 'clickable';
      tr.dataset.id = s.id;
      tr.innerHTML =
        '<td><span class="ai-name">' + s.name + '</span><span class="td-sub">' + s.id + '</span></td>' +
        '<td><span class="chip ' + (s.type === '제품 탑재' ? 'prod' : 'emp') + '">' + (s.type === '제품 탑재' ? '제품' : '임직원') + '</span></td>' +
        '<td><span class="risk ' + s.risk + '">' + s.riskLabel + '</span></td>' +
        '<td>' + s.owner + '</td>' +
        '<td class="td-sub">' + s.registered + '</td>' +
        '<td class="td-sub">' + s.reviewed + '</td>' +
        '<td><span class="status ' + s.statusClass + '"><span class="s-dot"></span>' + s.status + '</span></td>' +
        '<td><button class="btn-detail" data-id="' + s.id + '">상세보기</button></td>';
      tbody.appendChild(tr);
    });
  }

  function openPanel(id) {
    var s = SYSTEMS.find(function (x) { return x.id === id; });
    if (!s) return;
    document.getElementById('invPanelTitle').textContent = s.name;
    document.getElementById('invPanelSub').textContent = s.id + ' · ' + s.type;
    document.getElementById('invPanelBody').innerHTML =
      '<div class="p-section"><h4>AI 기본 정보</h4>' +
        '<div class="p-kv"><span class="k">위험 등급</span><span class="v"><span class="risk ' + s.risk + '">' + s.riskLabel + '</span></span></div>' +
        '<div class="p-kv"><span class="k">상태</span><span class="v">' + s.status + '</span></div>' +
        '<div class="p-kv"><span class="k">담당 부서</span><span class="v">' + s.owner + '</span></div>' +
        '<div class="p-kv"><span class="k">등록일</span><span class="v">' + s.registered + '</span></div>' +
        '<div class="p-kv"><span class="k">마지막 검토일</span><span class="v">' + s.reviewed + '</span></div>' +
      '</div>' +
      '<div class="p-section"><h4>처리 데이터 유형</h4>' +
        '<div class="chip-list">' + s.data.map(function (d) { return '<span class="chip data">' + d + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="p-section"><h4>규제 연계</h4>' +
        s.reg.map(function (r) { return '<div class="reg-box" style="margin-bottom:7px">' + r + '</div>'; }).join('') +
      '</div>' +
      '<div class="p-section"><h4>최근 검토 이력</h4>' +
        '<ul class="timeline">' + s.history.map(function (h) {
          return '<li><span class="t-date">' + h.date + '</span>' + h.text + '</li>';
        }).join('') + '</ul>' +
      '</div>' +
      '<div class="p-section"><h4>담당자 연락처</h4>' +
        '<div class="reg-box">' + s.contact + '</div>' +
      '</div>';
    document.getElementById('invPanel').classList.add('show');
    document.getElementById('invPanelBg').classList.add('show');
  }

  function closePanel() {
    document.getElementById('invPanel').classList.remove('show');
    document.getElementById('invPanelBg').classList.remove('show');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var css = getComputedStyle(document.documentElement);

    // 요약 도넛 (고1 / 중4 / 저2)
    SVGCharts.donut('invDonut', {
      segments: [
        { label: '고위험', value: 1, color: css.getPropertyValue('--high').trim() },
        { label: '중위험', value: 4, color: css.getPropertyValue('--mid').trim() },
        { label: '저위험', value: 2, color: css.getPropertyValue('--low').trim() }
      ],
      total: 7,
      centerLabel: '등록 AI'
    });

    render();

    // 필터 (이벤트 위임)
    document.querySelectorAll('.seg').forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        seg.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
        btn.classList.add('on');
        filters[seg.dataset.filter] = btn.dataset.val;
        render();
      });
    });

    // 행/버튼 클릭 → 상세 패널
    document.getElementById('invBody').addEventListener('click', function (e) {
      var row = e.target.closest('tr[data-id]');
      if (row) openPanel(row.dataset.id);
    });

    document.getElementById('invPanelClose').addEventListener('click', closePanel);
    document.getElementById('invPanelBg').addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
  });
})();
