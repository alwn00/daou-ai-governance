/* ════════════════════════════════════════════
   dashboard-data.js — 리스크 기반 거버넌스 데이터 모델
   백엔드 없이 동작하는 정적 샘플 데이터.
   전역에는 window.DASH 하나만 노출합니다.

   구성
   - riskModel : 위험요인 · 가중치 · 임계값 · 강제 고위험 트리거
   - systems   : AI별 점수 분해 · heatmap 좌표 · 담당 · Evidence Pack · 모델카드
   - kpiCatalog: 역할별로 조합되는 KPI 카드 정의
   - roles     : 역할별 화면 정의(KPI 세트 · 액션 필터 · 기본 조직)
   - actions   : 조치 워크플로우 항목(감지→배정→개선→재검토→종료)
   - orgs      : 관계사/조직 필터 라벨
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 리스크 평가 모델 ───────────────────────── */
  // 보건통계의 Risk Stratification(위험군 분류) 방식을 AI 거버넌스에 적용.
  // 위험요인을 정의하고 가중치를 부여해 임계값 기준으로 고위험군을 분류한다.
  var riskModel = {
    factors: [
      { id: 'dataSensitivity',    label: '데이터 민감도',     max: 25, desc: '개인정보·인사·고객 문의·소스코드 포함 여부', ex: 'HR AI, 메일 요약' },
      { id: 'decisionImpact',     label: '자동 의사결정 영향', max: 20, desc: '채용·추천·평가·배정 등 사용자에게 주는 영향', ex: 'HR AI, 사방넷 추천' },
      { id: 'externalExposure',   label: '외부 노출 범위',     max: 15, desc: '고객사·최종 사용자·외부 파트너 노출 여부', ex: '다우오피스, 뿌리오' },
      { id: 'generativeRisk',     label: '생성형 AI 특성',     max: 15, desc: '환각·부정확 생성·저작권·표시 의무 발생', ex: '뿌리오, 알리GPT' },
      { id: 'securityAccess',     label: '보안·접근권한',      max: 15, desc: 'DLP·API·권한 기반 검색·로그 관리 수준', ex: '메일 요약, Claude Code' },
      { id: 'regulatoryExposure', label: '규제 노출',          max: 10, desc: 'AI 기본법·EU AI Act·개인정보보호법 적용', ex: 'HR AI, 생성 문자' }
    ],
    // 임계값 기반 분류 — 합산 점수(0~100)를 등급으로 환산
    thresholds: [
      { min: 85, level: 'Critical', cls: 'crit', action: '즉시 조치 · CAIO 보고 · 배포 차단 가능' },
      { min: 70, level: 'High',     cls: 'high', action: 'AI Gate 필수 · 법무·보안 검토' },
      { min: 50, level: 'Moderate', cls: 'mod',  action: 'XI Lab 검토 · 보완 후 승인' },
      { min: 0,  level: 'Low',      cls: 'low',  action: '등록 후 모니터링' }
    ],
    // 점수가 70점 미만이어도 아래 중 하나라도 해당되면 High 이상으로 강제 상향
    forcedTriggers: [
      '채용·인사·근태·성과평가에 사용',
      '개인정보 또는 민감정보를 대량 처리',
      '고객에게 자동 추천·자동 판단 결과 제공',
      'AI 생성물이 외부 고객에게 직접 발송',
      '유럽 서비스 또는 글로벌 고객 접점 존재',
      '모델 접근권한·데이터 보존·로그 정책이 불명확'
    ],
    // 등급 환산 헬퍼
    levelOf: function (score, forced) {
      var t = riskModel.thresholds;
      var base = t[t.length - 1];
      for (var i = 0; i < t.length; i++) { if (score >= t[i].min) { base = t[i]; break; } }
      // 강제 트리거가 있으면 최소 High 보장
      if (forced && forced.length && (base.cls === 'mod' || base.cls === 'low')) {
        return { level: 'High', cls: 'high', action: 'AI Gate 필수 · 법무·보안 검토', forced: true };
      }
      return base;
    }
  };

  /* ── 조직(관계사) 필터 ──────────────────────── */
  // 실제 회사명으로 단정하지 않고 샘플 조직으로 표기
  var orgs = [
    { id: 'all',       label: '전체' },
    { id: 'hq',        label: '다우기술 본사' },
    { id: 'commerce',  label: '커머스 서비스' },
    { id: 'messaging', label: '메시징 서비스' },
    { id: 'group',     label: '그룹 관계사' },
    { id: 'internal',  label: '사내 공통 도구' }
  ];

  /* ── Evidence Pack 항목 템플릿 ───────────────── */
  // status: done(완료) / review(검토 중) / progress(진행) / collect(수집 중) / wait(대기)
  function evi(name, desc, status) { return { name: name, desc: desc, status: status }; }

  /* ── AI 시스템 마스터 데이터 ─────────────────── */
  var systems = [
    {
      id: 'hr', name: '다우오피스 HR AI', org: 'hq', scope: 'external',
      scopeLabel: '고객 제공', lifecycle: '운영 중(감시)', dataLabel: '인사/채용 데이터',
      score: 90,
      breakdown: { dataSensitivity: 25, decisionImpact: 20, externalExposure: 12, generativeRisk: 8, securityAccess: 15, regulatoryExposure: 10 },
      forced: ['채용·인사·근태·성과평가에 사용', '개인정보 또는 민감정보를 대량 처리', '고객에게 자동 추천·자동 판단 결과 제공'],
      keyFactors: [
        { metric: '채용·인사 데이터 자동 분석', threshold: '고영향 AI 해당 가능', note: '설명가능성 요구' },
        { metric: '평가 근거 설명 부족 클레임 3건', threshold: '사람 최종 승인 원칙', note: '편향 우려 2건' }
      ],
      controls: ['고영향 AI 판단 체크리스트 수행', '편향성 월간 테스트', '설명가능성 리포트 작성', '법무 검토 후 CAIO 승인'],
      owner: '서비스개발본부', reviewer: 'XI Lab', consulted: ['법무팀', '보안팀'], accountable: 'CAIO',
      heat: { likelihood: 4, impact: 5 },
      regTags: ['AI 기본법', '개인정보보호법'],
      model: {
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
        risks: ['편향성', '책임성', '데이터 보안']
      },
      evidence: [
        evi('AI 서비스 설명서', '목적·사용자·사용 범위', 'done'),
        evi('모델 정보', '모델명·제공사·버전·외부 API 여부', 'done'),
        evi('데이터 범위', '입력 데이터·개인정보 여부·보존 기간', 'review'),
        evi('위험평가 결과', '점수·등급·강제 트리거', 'done'),
        evi('법무 검토', 'AI 기본법·EU AI Act·개인정보보호법', 'wait'),
        evi('보안 검토', 'DLP·접근권한·로그·마스킹', 'progress'),
        evi('승인 이력', '담당자·승인자·승인일', 'wait'),
        evi('운영 로그', '사용량·오류·이상징후', 'collect'),
        evi('사고 대응 이력', '조치 요청·재검토·종료', 'progress')
      ]
    },
    {
      id: 'sabangnet', name: '사방넷 AI 추천', org: 'commerce', scope: 'external',
      scopeLabel: '고객 제공', lifecycle: '개발/테스트', dataLabel: '상품/CS 데이터',
      score: 80,
      breakdown: { dataSensitivity: 14, decisionImpact: 20, externalExposure: 15, generativeRisk: 7, securityAccess: 14, regulatoryExposure: 10 },
      forced: ['고객에게 자동 추천·자동 판단 결과 제공'],
      keyFactors: [
        { metric: '특정 판매자 상품 노출 비중 42%', threshold: '내부 기준 30%', note: '기준 초과 — 추천 공정성 재점검' },
        { metric: '추천 결과 설명 요청 1건', threshold: '설명가능성 문구 필요', note: 'A/B 테스트 승인제 적용' }
      ],
      controls: ['추천 로직 편향성 테스트', '판매자별 노출 분포 리포트 생성', '설명 가능성 문구 추가', '서비스개발본부 조치 후 XI Lab 재검토'],
      owner: '서비스개발본부', reviewer: 'XI Lab', consulted: ['법무팀'], accountable: 'CAIO',
      heat: { likelihood: 3, impact: 5 },
      regTags: ['공정성', 'AI 기본법'],
      model: {
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
        risks: ['편향성', '상품노출', '공정성']
      },
      evidence: [
        evi('AI 서비스 설명서', '목적·사용자·사용 범위', 'done'),
        evi('모델 정보', '모델명·제공사·버전·외부 API 여부', 'done'),
        evi('데이터 범위', '입력 데이터·개인정보 여부·보존 기간', 'done'),
        evi('위험평가 결과', '점수·등급·강제 트리거', 'done'),
        evi('법무 검토', '공정성·설명가능성', 'progress'),
        evi('보안 검토', 'DLP·접근권한·로그', 'review'),
        evi('승인 이력', '담당자·승인자·승인일', 'wait'),
        evi('운영 로그', '사용량·오류·이상징후', 'collect'),
        evi('사고 대응 이력', '조치 요청·재검토·종료', 'progress')
      ]
    },
    {
      id: 'daouoffice', name: '다우오피스 메일 요약', org: 'hq', scope: 'external',
      scopeLabel: '고객 제공', lifecycle: '운영 중', dataLabel: '메일/게시판/문서',
      score: 77,
      breakdown: { dataSensitivity: 24, decisionImpact: 6, externalExposure: 12, generativeRisk: 12, securityAccess: 15, regulatoryExposure: 8 },
      forced: ['개인정보 또는 민감정보를 대량 처리', 'AI 생성물이 외부 고객에게 직접 발송'],
      keyFactors: [
        { metric: '요약 결과 내 개인정보 마스킹 미흡 3건', threshold: '허용 기준 0건', note: '출력 단계 통제 부족' },
        { metric: '권한 기반 검색 정상', threshold: '출력 단계 마스킹 필요', note: '개인정보보호법·고객사 보안 요구사항 연계' }
      ],
      controls: ['출력 전 PII 마스킹 룰 재검토', '샘플링 검수 100건 수행', '보안팀 승인 전 배포 제한', 'AI 사용 사실 고지'],
      owner: '서비스개발본부', reviewer: '보안팀', consulted: ['법무팀'], accountable: 'CAIO',
      heat: { likelihood: 4, impact: 4 },
      regTags: ['개인정보보호법', 'AI 기본법'],
      model: {
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
        risks: ['데이터 보안', '환각', '투명성']
      },
      evidence: [
        evi('AI 서비스 설명서', '목적·사용자·사용 범위', 'done'),
        evi('모델 정보', '모델명·제공사·버전·외부 API 여부', 'done'),
        evi('데이터 범위', '입력 데이터·개인정보 여부·보존 기간', 'done'),
        evi('위험평가 결과', '점수·등급·강제 트리거', 'done'),
        evi('법무 검토', '개인정보보호법·AI 기본법', 'review'),
        evi('보안 검토', 'DLP·접근권한·로그·마스킹', 'progress'),
        evi('승인 이력', '담당자·승인자·승인일', 'wait'),
        evi('운영 로그', '사용량·오류·이상징후', 'done'),
        evi('사고 대응 이력', '조치 요청·재검토·종료', 'progress')
      ]
    },
    {
      id: 'ppurio', name: '뿌리오 AI', org: 'messaging', scope: 'external',
      scopeLabel: '고객 제공', lifecycle: '개발/테스트', dataLabel: '생성 문자',
      score: 71,
      breakdown: { dataSensitivity: 10, decisionImpact: 8, externalExposure: 15, generativeRisk: 15, securityAccess: 13, regulatoryExposure: 10 },
      forced: ['AI 생성물이 외부 고객에게 직접 발송', '유럽 서비스 또는 글로벌 고객 접점 존재'],
      keyFactors: [
        { metric: 'AI 생성 문자 표시 기준 미적용', threshold: '2026.08.02 적용', note: 'EU AI Act Article 50 표시 의무' },
        { metric: 'AI 생성 표시 위치 문의 1건', threshold: '표시·검증 로그 필요', note: '발송 전 사람 승인 운영 중' }
      ],
      controls: ['AI 생성물 표시 기준·검증 로그 준비', '문구 검수 워크플로우', '금칙어/과장광고 필터', '발송 전 사람 승인'],
      owner: '비즈마케팅부문', reviewer: '법무팀', consulted: ['XI Lab'], accountable: 'CAIO',
      heat: { likelihood: 3, impact: 3 },
      regTags: ['EU AI Act', 'AI 표시'],
      model: {
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
        risks: ['저작권', '투명성', '환각']
      },
      evidence: [
        evi('AI 서비스 설명서', '목적·사용자·사용 범위', 'done'),
        evi('모델 정보', '모델명·제공사·버전·외부 API 여부', 'done'),
        evi('데이터 범위', '입력 데이터·개인정보 여부·보존 기간', 'done'),
        evi('위험평가 결과', '점수·등급·강제 트리거', 'done'),
        evi('법무 검토', 'EU AI Act Article 50 표시 의무', 'progress'),
        evi('보안 검토', 'DLP·접근권한·로그', 'review'),
        evi('승인 이력', '담당자·승인자·승인일', 'wait'),
        evi('운영 로그', '사용량·오류·이상징후', 'collect'),
        evi('사고 대응 이력', '조치 요청·재검토·종료', 'progress')
      ]
    },
    {
      id: 'gemini', name: 'Gemini for Workspace', org: 'internal', scope: 'internal',
      scopeLabel: '사내 도구', lifecycle: '기획 심사 중', dataLabel: '업무 문서 전반',
      score: 68,
      breakdown: { dataSensitivity: 18, decisionImpact: 8, externalExposure: 8, generativeRisk: 12, securityAccess: 14, regulatoryExposure: 8 },
      forced: ['모델 접근권한·데이터 보존·로그 정책이 불명확'],
      keyFactors: [
        { metric: '사내 금지 데이터 입력 가이드 미확정', threshold: 'DLP 정책 승인 필요', note: '전사 확대 전 통제 부재' },
        { metric: '벤더 관리형 프롬프트', threshold: '데이터 처리 조항 검토', note: '부서 단위 파일럿 권장' }
      ],
      controls: ['DLP 정책 연동 검토', '벤더 데이터 처리 조항 검토', '임직원 사용 가이드 승인', '부서 단위 파일럿'],
      owner: '경영지원본부', reviewer: '보안팀', consulted: ['법무팀'], accountable: 'CAIO',
      heat: { likelihood: 3, impact: 4 },
      regTags: ['DLP', '개인정보보호법'],
      model: {
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
        risks: ['데이터 보안', '개인정보', '통제권']
      },
      evidence: [
        evi('AI 서비스 설명서', '목적·사용자·사용 범위', 'done'),
        evi('모델 정보', '모델명·제공사·버전·외부 API 여부', 'done'),
        evi('데이터 범위', '입력 데이터·개인정보 여부·보존 기간', 'review'),
        evi('위험평가 결과', '점수·등급·강제 트리거', 'done'),
        evi('법무 검토', '벤더 데이터 처리 조항', 'wait'),
        evi('보안 검토', 'DLP·접근권한·로그', 'progress'),
        evi('승인 이력', '담당자·승인자·승인일', 'wait'),
        evi('운영 로그', '사용량·오류·이상징후', 'wait'),
        evi('사고 대응 이력', '조치 요청·재검토·종료', 'wait')
      ]
    },
    {
      id: 'aligpt', name: '알리GPT', org: 'group', scope: 'external',
      scopeLabel: '고객 제공', lifecycle: '운영 중', dataLabel: '고객 문의/FAQ',
      score: 60,
      breakdown: { dataSensitivity: 12, decisionImpact: 8, externalExposure: 13, generativeRisk: 12, securityAccess: 10, regulatoryExposure: 5 },
      forced: [],
      keyFactors: [
        { metric: '답변 정확도 이슈 2건', threshold: '정확도 샘플링 기준', note: '환각·신뢰성 관리' },
        { metric: '고객 문의 처리', threshold: 'PII 입력 차단 안내', note: '상담원 전환 버튼 운영' }
      ],
      controls: ['출처 링크 표시', '상담원 전환 버튼', 'PII 입력 차단 안내', '정확도 샘플링'],
      owner: '고객지원본부', reviewer: 'XI Lab', consulted: [], accountable: 'CAIO',
      heat: { likelihood: 2, impact: 3 },
      regTags: ['개인정보보호법', 'AI 고지'],
      model: {
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
        risks: ['환각', '고객정보', '신뢰성']
      },
      evidence: [
        evi('AI 서비스 설명서', '목적·사용자·사용 범위', 'done'),
        evi('모델 정보', '모델명·제공사·버전·외부 API 여부', 'done'),
        evi('데이터 범위', '입력 데이터·개인정보 여부·보존 기간', 'done'),
        evi('위험평가 결과', '점수·등급·강제 트리거', 'done'),
        evi('법무 검토', '개인정보보호법·AI 고지', 'done'),
        evi('보안 검토', 'PII 입력 차단·로그', 'done'),
        evi('승인 이력', '담당자·승인자·승인일', 'done'),
        evi('운영 로그', '사용량·오류·이상징후', 'done'),
        evi('사고 대응 이력', '조치 요청·재검토·종료', 'review')
      ]
    },
    {
      id: 'claude', name: 'Claude Code', org: 'internal', scope: 'internal',
      scopeLabel: '사내 도구', lifecycle: '운영 중', dataLabel: '소스코드',
      score: 40,
      breakdown: { dataSensitivity: 10, decisionImpact: 4, externalExposure: 3, generativeRisk: 6, securityAccess: 14, regulatoryExposure: 3 },
      forced: [],
      keyFactors: [
        { metric: '접근 권한 감사 이상 없음', threshold: '승인 환경에서만 사용', note: '비밀키 탐지 운영' },
        { metric: '코드 리뷰 의무 적용', threshold: '접근 로그 감사', note: '책임성 통제 양호' }
      ],
      controls: ['승인 환경에서만 사용', '비밀키 탐지', '코드 리뷰 의무', '접근 로그 감사'],
      owner: '서비스개발본부', reviewer: '보안팀', consulted: [], accountable: 'CAIO',
      heat: { likelihood: 2, impact: 2 },
      regTags: ['보안정책', '접근권한'],
      model: {
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
        risks: ['소스코드', '보안', '책임성']
      },
      evidence: [
        evi('AI 서비스 설명서', '목적·사용자·사용 범위', 'done'),
        evi('모델 정보', '모델명·제공사·버전·외부 API 여부', 'done'),
        evi('데이터 범위', '입력 데이터·개인정보 여부·보존 기간', 'done'),
        evi('위험평가 결과', '점수·등급·강제 트리거', 'done'),
        evi('법무 검토', '보안정책·접근권한', 'done'),
        evi('보안 검토', '비밀키 탐지·접근 로그', 'done'),
        evi('승인 이력', '담당자·승인자·승인일', 'done'),
        evi('운영 로그', '사용량·오류·이상징후', 'done'),
        evi('사고 대응 이력', '조치 요청·재검토·종료', 'done')
      ]
    }
  ];

  /* ── KPI 카탈로그 ───────────────────────────── */
  // tone: blue/high/mid/low/purple — k-ico 색상 + alert 여부
  var kpiCatalog = {
    highRiskOpen:     { title: '고위험 AI 미조치',      val: '3',     unit: '건',   foot: '<b class="down">Critical 1</b> · High 2',           icon: 'risk',       tone: 'high',   alert: true,  href: '#actionRequired' },
    evidenceReadiness:{ title: '증빙 준비율',           val: '64',    unit: '%',    foot: 'Evidence Pack 기준 · 고위험 3건 중 1건 완료',       icon: 'scale',      tone: 'blue',   href: '#evidencePack' },
    gateQueue:        { title: 'AI Gate 심사 대기',     val: '3',     unit: '건',   foot: '평균 처리 <b>6.2일</b> · SLA 10일 이내',            icon: 'gate',       tone: 'mid',    href: '#actionRequired' },
    regulatoryTargets:{ title: '규제 적용 대상',         val: '5',     unit: '건',   foot: 'AI 기본법 3 · EU AI Act 2',                         icon: 'scale',      tone: 'purple', href: '#riskHeatmap' },
    riskReduction:    { title: '리스크 감소 추세',       val: '-18',   unit: '%',    foot: '<b class="up">지난 30일</b> 조치 후 잔여 리스크',   icon: 'monitoring', tone: 'low',    href: '#riskHeatmap' },
    inventory:        { title: '등록 AI 시스템',         val: '7',     unit: '개',   foot: '제품 탑재 5 · 임직원 도구 2',                       icon: 'inventory',  tone: 'blue',   href: '#aiInventory' },
    slaCompliance:    { title: 'AI Gate SLA 준수율',    val: '82',    unit: '%',    foot: '평균 처리 <b>6.2일</b> · SLA 10일',                 icon: 'gate',       tone: 'low',    href: '#actionRequired' },
    educationRate:    { title: 'AI 리터러시 이수율',     val: '78',    unit: '%',    foot: '<b class="warn-t">미이수 142명</b> · 기본법 의무',  icon: 'education',  tone: 'low',    href: '#aiInventory' },
    apiCost:          { title: 'AI API 비용',           val: '1,840', unit: '만원', foot: '월 예산 74% 사용 · <b class="warn-t">토큰 급증 2건</b>', icon: 'monitoring', tone: 'purple', href: '#aiInventory' },

    // 관계사 AX 관리자
    localInventory:    { title: '소속 AI 시스템',        val: '1',  unit: '개', foot: '커머스 서비스 영역',                  icon: 'inventory', tone: 'blue',  href: '#aiInventory' },
    affiliateOpenActions:{ title: '소속 미조치 리스크',  val: '1',  unit: '건', foot: '<b class="down">사방넷 추천 편향성 D-2</b>', icon: 'risk', tone: 'high', alert: true, href: '#actionRequired' },
    affiliateEducation:{ title: '소속 교육 이수율',      val: '71', unit: '%',  foot: '<b class="warn-t">미이수 18명</b>',   icon: 'education', tone: 'mid',   href: '#aiInventory' },
    slaBreaches:       { title: 'SLA 임박/초과',         val: '1',  unit: '건', foot: 'D-2 임박 1건 · CAIO 보고 대상',       icon: 'gate',      tone: 'mid',   href: '#actionRequired' },

    // 법무팀
    legalReviews:     { title: '법무 검토 대기',         val: '2',  unit: '건', foot: '<b class="down">고영향 AI 1</b> · 표시 의무 1', icon: 'scale', tone: 'high', alert: true, href: '#actionRequired' },
    highImpactPending:{ title: '고영향 AI 검토',         val: '1',  unit: '건', foot: 'HR AI 채용·인사 기능',                icon: 'risk',  tone: 'high',  href: '#actionRequired' },
    article50Targets: { title: 'EU AI Act 표시 의무',    val: '1',  unit: '건', foot: '뿌리오 생성 문자 · <b>2026.08.02</b>', icon: 'scale', tone: 'mid',   href: '#riskHeatmap' },
    privacyMappings:  { title: '규제 매핑률',            val: '86', unit: '%',  foot: '개인정보보호법 연계 완료',            icon: 'pie',   tone: 'low',   href: '#aiInventory' },

    // 보안팀
    piiMaskingIssues: { title: '개인정보 마스킹 미흡',   val: '3',  unit: '건', foot: '<b class="down">메일 요약 출력 단계</b>', icon: 'risk', tone: 'high', alert: true, href: '#actionRequired' },
    dlpAlerts:        { title: 'DLP 위반 경보',          val: '2',  unit: '건', foot: '<b class="warn-t">Gemini 입력 가이드 미확정</b>', icon: 'risk', tone: 'mid', alert: true, href: '#actionRequired' },
    accessReviewDue:  { title: '접근권한 감사 예정',     val: '4',  unit: '건', foot: '이번 분기 점검 대상',                 icon: 'scale', tone: 'blue',  href: '#aiInventory' },
    externalApiUsage: { title: '외부 API 사용',          val: '5',  unit: '개', foot: '벤더 데이터 처리 조항 점검',          icon: 'monitoring', tone: 'purple', href: '#aiInventory' },

    // 서비스개발팀
    devActions:       { title: '제품별 조치 요청',       val: '3',  unit: '건', foot: '<b class="down">사방넷 · 메일 · HR</b>', icon: 'risk', tone: 'high', alert: true, href: '#actionRequired' },
    preDeployBlocks:  { title: '배포 전 차단',           val: '1',  unit: '건', foot: '사방넷 추천 A/B 승인 대기',           icon: 'gate',  tone: 'mid',   href: '#actionRequired' },
    reviewPending:    { title: '재검토 대기',            val: '2',  unit: '건', foot: 'XI Lab 재검토 큐',                    icon: 'gate',  tone: 'mid',   href: '#actionRequired' },

    // XI Lab
    avgProcessDays:   { title: '평균 심사 처리일',       val: '6.2', unit: '일', foot: 'SLA 10일 이내',                      icon: 'gate',  tone: 'low',   href: '#actionRequired' },
    modelCardRate:    { title: '모델카드 완성률',        val: '71', unit: '%',  foot: '7건 중 5건 완료',                     icon: 'inventory', tone: 'low', href: '#aiInventory' }
  };

  /* ── 역할별 화면 정의 ───────────────────────── */
  var roles = [
    { id: 'caio',     label: 'CAIO',           desc: '전사 AI 리스크와 고위험 승인 현황을 봅니다. 전체를 세부적으로 보는 것이 아니라, 지금 막아야 할 고위험과 지연 조치를 봅니다.', kpis: ['highRiskOpen', 'evidenceReadiness', 'gateQueue', 'regulatoryTargets', 'riskReduction'], actions: 'all',      defaultOrg: 'all' },
    { id: 'affiliate',label: '관계사 AX 관리자', desc: '소속 관계사의 AI 조치 항목과 교육·SLA를 봅니다. 전체가 아니라 소속 서비스의 미조치 리스크만 봅니다.',                       kpis: ['localInventory', 'affiliateOpenActions', 'affiliateEducation', 'slaBreaches'], actions: 'affiliate', defaultOrg: 'commerce' },
    { id: 'xilab',    label: 'XI Lab',         desc: 'AI Gate 운영과 위험평가·모델카드 검토를 봅니다.',                                                                  kpis: ['gateQueue', 'avgProcessDays', 'modelCardRate', 'highRiskOpen'], actions: 'xilab', defaultOrg: 'all' },
    { id: 'legal',    label: '법무팀',          desc: '규제 매핑, 고영향 AI 검토, 표시 의무 적용 대상을 봅니다.',                                                          kpis: ['legalReviews', 'highImpactPending', 'article50Targets', 'privacyMappings'], actions: 'legal', defaultOrg: 'all' },
    { id: 'security', label: '보안팀',          desc: '개인정보, DLP, 접근권한, 외부 API 리스크를 봅니다.',                                                               kpis: ['piiMaskingIssues', 'dlpAlerts', 'accessReviewDue', 'externalApiUsage'], actions: 'security', defaultOrg: 'all' },
    { id: 'devteam',  label: '서비스개발팀',     desc: '제품별 조치 요청, 배포 전 차단, 재검토 대기를 봅니다.',                                                            kpis: ['devActions', 'preDeployBlocks', 'reviewPending', 'highRiskOpen'], actions: 'devteam', defaultOrg: 'all' },
    { id: 'exec',     label: '경영진',          desc: '사업 영향, 글로벌 규제 노출, 리스크 추세를 봅니다.',                                                               kpis: ['highRiskOpen', 'riskReduction', 'regulatoryTargets', 'evidenceReadiness'], actions: 'all', defaultOrg: 'all' }
  ];

  /* ── 조치 워크플로우 항목 ───────────────────── */
  // status: 단계 인덱스 (0:감지 1:배정 2:개선 3:재검토 4:종료)
  var workflowStages = [
    { key: 'Detected',   label: '감지' },
    { key: 'Assigned',   label: '담당 배정' },
    { key: 'Mitigation', label: '개선 조치' },
    { key: 'Review',     label: '재검토' },
    { key: 'Closed',     label: '종료' }
  ];

  var actions = [
    {
      id: 'sabangnet-bias', systemId: 'sabangnet',
      title: '사방넷 AI 추천 알고리즘 — 편향성 지표 기준치 초과',
      desc: '특정 판매자 상품 노출 비중 42%로 내부 기준 30% 초과. 상품 추천 공정성 재점검 필요.',
      severity: 'High', sevCls: 'critical', dday: 'D-2', ddayCls: 'red',
      owner: '서비스개발본부', reviewer: 'XI Lab', consulted: ['법무팀'], accountable: 'CAIO',
      status: 1, riskFactor: '공정성·설명가능성',
      metric: '특정 판매자 상품 노출 비중 42%', threshold: '내부 기준 30%',
      nextAction: '추천 로직 편향성 테스트 및 노출 분포 리포트 제출', sla: '10일 이내 · 지연 시 CAIO 보고',
      scope: 'external', org: 'commerce', regLabel: '공정성·설명가능성',
      roles: ['caio', 'exec', 'affiliate', 'xilab', 'devteam']
    },
    {
      id: 'mail-pii', systemId: 'daouoffice',
      title: '다우오피스 메일 요약 — 개인정보 마스킹 출력 단계 미흡',
      desc: '권한 기반 문서 검색은 정상이나, 요약 결과 내 개인정보 마스킹 샘플 점검에서 3건 미흡.',
      severity: 'High', sevCls: 'critical', dday: '긴급', ddayCls: 'red',
      owner: '서비스개발본부 · 보안팀', reviewer: '보안팀', consulted: ['법무팀'], accountable: 'CAIO',
      status: 2, riskFactor: '개인정보보호',
      metric: '출력 결과 마스킹 미흡 3건', threshold: '허용 기준 0건',
      nextAction: '출력 전 PII 마스킹 룰 재검토 및 샘플 100건 검수', sla: '긴급 · 보안팀 승인 전 배포 제한',
      scope: 'external', org: 'hq', regLabel: '개인정보보호법',
      roles: ['caio', 'exec', 'security', 'devteam']
    },
    {
      id: 'gemini-dlp', systemId: 'gemini',
      title: 'Gemini 업무 활용 — 사내 금지 데이터 입력 가이드 미확정',
      desc: '전사 확대 전 DLP 정책과 임직원 사용 가이드 승인 필요.',
      severity: 'Moderate', sevCls: 'warn', dday: 'D-7', ddayCls: 'amber',
      owner: '경영지원본부', reviewer: '보안팀', consulted: ['법무팀'], accountable: 'CAIO',
      status: 0, riskFactor: '데이터 보안',
      metric: 'DLP 정책·사용 가이드 미승인', threshold: '전사 확대 전 승인 필요',
      nextAction: 'DLP 정책 연동 및 임직원 사용 가이드 승인', sla: '10일 이내',
      scope: 'internal', org: 'internal', regLabel: '데이터 보안',
      roles: ['caio', 'security']
    },
    {
      id: 'hr-highimpact', systemId: 'hr',
      title: '다우오피스 HR AI — 고영향 AI 판단 및 법무 검토',
      desc: '채용·인사 데이터 자동 분석으로 강제 고위험 트리거 해당. 고영향 AI 체크리스트와 설명가능성 리포트 필요.',
      severity: 'Critical', sevCls: 'critical', dday: 'D-4', ddayCls: 'red',
      owner: '서비스개발본부', reviewer: '법무팀', consulted: ['XI Lab', '보안팀'], accountable: 'CAIO',
      status: 3, riskFactor: '고영향·설명가능성',
      metric: '채용·인사 자동 의사결정', threshold: '강제 고위험 트리거 해당',
      nextAction: '고영향 체크리스트 · 편향성 테스트 · 설명가능성 리포트 후 CAIO 승인', sla: '고영향 절차 · 법무 검토 필수',
      scope: 'external', org: 'hq', regLabel: 'AI 기본법·개인정보보호법',
      roles: ['caio', 'exec', 'legal', 'devteam']
    },
    {
      id: 'ppurio-article50', systemId: 'ppurio',
      title: '뿌리오 AI — EU AI Act Article 50 표시 의무 대응',
      desc: 'AI 생성 문자에 대한 표시 기준과 검증 로그를 2026.08.02 적용 전 준비해야 함.',
      severity: 'High', sevCls: 'warn', dday: 'D-49', ddayCls: 'amber',
      owner: '비즈마케팅부문', reviewer: '법무팀', consulted: ['XI Lab'], accountable: 'CAIO',
      status: 1, riskFactor: '투명성·표시 의무',
      metric: 'AI 생성물 표시 미적용', threshold: '2026.08.02 적용',
      nextAction: 'AI 생성 표시 기준·검증 로그 준비 및 법무 확인', sla: '적용일 전 완료',
      scope: 'external', org: 'messaging', regLabel: 'EU AI Act',
      roles: ['caio', 'legal']
    }
  ];

  /* ── 전역 노출 ──────────────────────────────── */
  window.DASH = {
    riskModel: riskModel,
    orgs: orgs,
    systems: systems,
    kpiCatalog: kpiCatalog,
    roles: roles,
    actions: actions,
    workflowStages: workflowStages,
    // 헬퍼
    systemById: function (id) {
      for (var i = 0; i < systems.length; i++) { if (systems[i].id === id) return systems[i]; }
      return null;
    },
    orgLabel: function (id) {
      for (var i = 0; i < orgs.length; i++) { if (orgs[i].id === id) return orgs[i].label; }
      return id;
    },
    // Evidence 준비율(%) = 완료 1.0 / 진행·검토·수집 0.5 / 대기 0
    evidenceReadiness: function (sys) {
      var w = { done: 1, review: 0.5, progress: 0.5, collect: 0.5, wait: 0 };
      var sum = 0;
      sys.evidence.forEach(function (e) { sum += (w[e.status] || 0); });
      return Math.round((sum / sys.evidence.length) * 100);
    }
  };
})();
