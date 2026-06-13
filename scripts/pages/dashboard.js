/* ════════════════════════════════════════════
   dashboard.js — 메인 대시보드 인터랙션
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var css = getComputedStyle(document.documentElement);

    // 리스크 유형 분포 도넛 (SVG)
    SVGCharts.donut('riskDonut', {
      segments: [
        { label: '데이터 보안', value: 3, color: css.getPropertyValue('--high').trim() },
        { label: '환각·신뢰성', value: 2, color: css.getPropertyValue('--mid').trim() },
        { label: '편향성·공정성', value: 1, color: css.getPropertyValue('--purple').trim() },
        { label: '저작권·투명성', value: 1, color: css.getPropertyValue('--low').trim() }
      ],
      total: 7,
      centerLabel: '리스크'
    });

    // AI Gate 신청 모달 — 제출 시 목록 맨 위에 '접수' 단계로 추가
    UI.initGateModal({
      onSubmit: function (app) {
        var gateList = document.getElementById('gateList');
        if (!gateList) {
          UI.toast(app.name + ' 도입 심사 요청이 접수되었습니다.');
          return;
        }
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
        gateList.prepend(item);
      }
    });

    // "AI 도입 심사 신청" 버튼들 (이벤트 위임)
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action="open-gate-modal"]');
      if (btn) UI.openGateModal();
    });

    var MODEL_CARDS = {
      daouoffice: {
        title: '다우오피스 AI — 메일 요약 모델 카드',
        sub: 'AI-001 · 운영 중 · 메일/게시판/사내 문서',
        rows: [
          ['파운데이션 모델', 'GPT-4o mini + 사내 RAG'],
          ['주요 기능', '메일 요약, 게시판 요약, 회의록 초안'],
          ['학습/참조 데이터', '고객 데이터 학습 미사용 · 권한 기반 문서 검색'],
          ['프롬프트 업데이트', '2026.06.01 · 보안 문구 필터 강화'],
          ['책임 부서/담당자', '서비스개발본부 · 박지훈 책임'],
          ['최근 사용자 클레임', '3건 · 부정확 요약 2건, 권한 문서 노출 우려 1건']
        ],
        risks: ['데이터 보안', '환각', '투명성'],
        controls: ['권한 체크 후 RAG 검색', '민감정보 마스킹', 'AI 사용 사실 고지', '월 1회 품질 샘플링']
      },
      hr: {
        title: '다우오피스 HR AI — 고영향 AI FactSheet',
        sub: 'AI-002 · 운영 중(감시) · 인사/채용 데이터',
        rows: [
          ['파운데이션 모델', 'Claude 3.5 Sonnet + 사내 평가 룰셋'],
          ['주요 기능', '채용 서류 요약, 근태 이상 패턴 탐지'],
          ['학습/참조 데이터', '인사·채용 정보, 근태 데이터, 개인정보'],
          ['프롬프트 업데이트', '2026.05.20 · 편향 표현 차단 규칙 추가'],
          ['책임 부서/담당자', '서비스개발본부 · 이서연 수석'],
          ['최근 사용자 클레임', '5건 · 평가 근거 설명 부족 3건, 편향 우려 2건']
        ],
        risks: ['편향성', '책임성', '데이터 보안'],
        controls: ['고영향 AI 해당 여부 확인 요청', '사람 최종 승인 원칙', '편향성 월간 리포트', '법무 검토 대기']
      },
      ppurio: {
        title: '뿌리오 AI — 생성 문구 모델 카드',
        sub: 'AI-003 · 개발/테스트 · 마케팅 문구 생성',
        rows: [
          ['파운데이션 모델', 'GPT-4o mini'],
          ['주요 기능', '문자 발송 문구 생성, A/B 카피 초안'],
          ['학습/참조 데이터', '마케팅 문구 템플릿, 발송 성과 집계'],
          ['프롬프트 업데이트', '2026.06.05 · 금칙어/과장광고 차단 강화'],
          ['책임 부서/담당자', '비즈마케팅부문 · 최민호 팀장'],
          ['최근 사용자 클레임', '1건 · AI 생성 표시 위치 문의']
        ],
        risks: ['저작권', '투명성', '환각'],
        controls: ['워터마킹 적용 예정', '문구 검수 워크플로우', '금칙어 필터', '발송 전 사람 승인']
      },
      aligpt: {
        title: '알리GPT — 고객지원 모델 카드',
        sub: 'AI-005 · 운영 중 · FAQ/고객 문의',
        rows: [
          ['파운데이션 모델', 'GPT-4o mini'],
          ['주요 기능', 'FAQ 응답, 상담 초안 생성'],
          ['학습/참조 데이터', 'FAQ 2,500건, 제품 도움말'],
          ['프롬프트 업데이트', '2026.06.02 · 불확실 답변 회피 규칙 추가'],
          ['책임 부서/담당자', '고객지원본부 · 한지원 매니저'],
          ['최근 사용자 클레임', '2건 · 답변 정확도 이슈']
        ],
        risks: ['환각', '고객정보', '신뢰성'],
        controls: ['출처 링크 표시', '상담원 전환 버튼', 'PII 입력 차단 안내', '정확도 샘플링']
      },
      gemini: {
        title: 'Gemini for Workspace — 임직원 도구 FactSheet',
        sub: 'AI-006 · 기획 심사 중 · 업무 문서 전반',
        rows: [
          ['파운데이션 모델', 'Gemini Enterprise'],
          ['주요 기능', '문서 요약, 이메일 작성, 회의록 정리'],
          ['학습/참조 데이터', '사내 업무 문서 전반'],
          ['프롬프트 업데이트', '벤더 관리형 · 사내 금지 데이터 정책 검토 중'],
          ['책임 부서/담당자', '경영지원본부 · 오세훈 차장'],
          ['최근 사용자 클레임', '0건 · 파일럿 전 심사 단계']
        ],
        risks: ['데이터 보안', '개인정보', '통제권'],
        controls: ['DLP 정책 연동 검토', '벤더 데이터 처리 조항 검토', '임직원 사용 가이드', '부서 단위 파일럿']
      },
      sabangnet: {
        title: '사방넷 AI — 상품 추천 모델 카드',
        sub: 'AI-004 · 개발/테스트 · 상품/CS 데이터',
        rows: [
          ['파운데이션 모델', '사내 추천 모델 + GPT-4o mini'],
          ['주요 기능', '상품 추천, CS 응답 초안, 카테고리 매핑'],
          ['학습/참조 데이터', '상품 메타데이터, CS 이력, 판매 집계'],
          ['프롬프트 업데이트', '2026.05.30 · 특정 판매자 과다 노출 방지'],
          ['책임 부서/담당자', '서비스개발본부 · 정태우 책임'],
          ['최근 사용자 클레임', '1건 · 추천 결과 설명 요청']
        ],
        risks: ['편향성', '상품노출', '공정성'],
        controls: ['추천 다양성 지표', '판매자 편중 모니터링', '설명 가능성 문구', 'A/B 테스트 승인제']
      },
      claude: {
        title: 'Claude Code — 개발 도구 모델 카드',
        sub: 'AI-007 · 운영 중 · 소스코드',
        rows: [
          ['파운데이션 모델', 'Claude Sonnet 4 계열'],
          ['주요 기능', '코드 생성, 리팩터링, 테스트 작성'],
          ['학습/참조 데이터', '개발자 입력 소스코드, 이슈 문맥'],
          ['프롬프트 업데이트', '2026.05.26 · 사내 승인 환경 기준 반영'],
          ['책임 부서/담당자', '서비스개발본부 · 김도현 수석'],
          ['최근 사용자 클레임', '0건 · 접근 권한 감사 이상 없음']
        ],
        risks: ['소스코드', '보안', '책임성'],
        controls: ['승인 환경에서만 사용', '비밀키 탐지', '코드 리뷰 의무', '접근 로그 감사']
      }
    };

    function renderModelCard(card) {
      return '<div class="model-card-grid">' +
        '<div class="p-section">' +
          '<h4>기본 정보</h4>' +
          card.rows.map(function (row) {
            return '<div class="p-kv"><span class="k">' + row[0] + '</span><span class="v">' + row[1] + '</span></div>';
          }).join('') +
        '</div>' +
        '<div class="p-section">' +
          '<h4>주요 리스크</h4>' +
          '<div class="chip-list">' + card.risks.map(function (r) { return '<span class="chip data">' + r + '</span>'; }).join('') + '</div>' +
          '<h4 class="model-card-subhead">통제 장치</h4>' +
          '<ul class="control-list">' + card.controls.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>' +
        '</div>' +
      '</div>';
    }

    function openModelCard(id) {
      var card = MODEL_CARDS[id];
      if (!card) return;
      document.getElementById('modelCardTitle').textContent = card.title;
      document.getElementById('modelCardSub').textContent = card.sub;
      document.getElementById('modelCardBody').innerHTML = renderModelCard(card);
      document.getElementById('modelCardBg').classList.add('show');
    }

    function closeModelCard() {
      document.getElementById('modelCardBg').classList.remove('show');
    }

    var scopeSummary = {
      all: '전체 AI 시스템 7개를 통합 관제 중입니다.',
      external: '고객 제공 서비스 5개를 외부 규제와 고객 영향도 기준으로 관제 중입니다.',
      internal: '사내 임직원용 도구 2개를 보안·권한·사용 가이드 기준으로 관제 중입니다.'
    };

    function applyScope(scope) {
      var visibleCount = 0;
      document.querySelectorAll('[data-scope]').forEach(function (el) {
        var visible = scope === 'all' || el.dataset.scope === scope;
        el.classList.toggle('is-hidden', !visible);
        if (visible && el.matches('#modelCardRows tr')) visibleCount += 1;
      });
      document.querySelectorAll('[data-scope-filter]').forEach(function (btn) {
        btn.classList.toggle('on', btn.dataset.scopeFilter === scope);
      });
      document.getElementById('scopeSummary').textContent = scopeSummary[scope];
      document.getElementById('visibleSystemCount').textContent = visibleCount;
    }

    document.querySelectorAll('[data-scope-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyScope(btn.dataset.scopeFilter);
      });
    });

    var modelRows = document.getElementById('modelCardRows');
    if (modelRows) {
      modelRows.addEventListener('click', function (e) {
        var actionBtn = e.target.closest('[data-action="request-action"]');
        if (actionBtn) {
          var row = actionBtn.closest('[data-card], .action-item');
          var titleEl = row ? row.querySelector('.ai-name, .action-title') : null;
          UI.toast((titleEl ? titleEl.textContent : '담당 서비스') + ' 담당팀에 조치 요청 알림을 발송했습니다.');
          return;
        }
        var detailBtn = e.target.closest('[data-open-card]');
        if (detailBtn) {
          openModelCard(detailBtn.dataset.openCard);
          return;
        }
        var rowTarget = e.target.closest('tr[data-card]');
        if (rowTarget) openModelCard(rowTarget.dataset.card);
      });
    }

    document.querySelectorAll('.action-list [data-action="request-action"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.action-item');
        var title = item.querySelector('.action-title').textContent;
        UI.toast(title + ' 담당팀에 조치 요청 알림을 발송했습니다.');
      });
    });

    document.getElementById('modelCardClose').addEventListener('click', closeModelCard);
    document.getElementById('modelCardBg').addEventListener('click', function (e) {
      if (e.target.id === 'modelCardBg') closeModelCard();
    });
    applyScope('all');
  });
})();
