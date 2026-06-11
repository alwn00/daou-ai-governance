# DAOU AI Governance Platform

다우기술(DAOU Technology) 전사 AI 거버넌스 관리 플랫폼.
한국 AI 기본법(2026.01.22 시행)과 EU AI Act에 대응하기 위한 AI 인벤토리 · 리스크 · 도입 심사 · 모니터링 · 정책 · 교육 · 감사 관리 도구입니다.

## 프로젝트 개요

다우기술은 약 9,000개 기업 고객을 보유한 B2B SaaS·데이터센터 기업으로, 자체 모델 개발 대신 기존 SaaS 제품에 생성형 AI를 탑재하는 전략을 취하고 있습니다. 본 플랫폼은 CAIO 산하 AI 거버넌스 위원회(XI Lab 주관 · 법무팀 · 보안팀 · 서비스개발팀)가 전사 AI 시스템 7건과 규제 의무를 한 화면에서 관리할 수 있도록 설계되었습니다.

핵심 전략: **EU AI Act 기준을 충족하면 한국 AI 기본법 의무가 자동 충족됩니다.** EU 기준이 전사 컴플라이언스 베이스라인입니다.

## 주요 기능

| 페이지 | 설명 |
|---|---|
| 메인 대시보드 | KPI · 즉시 조치 알림 · 규제 컴플라이언스 · 인벤토리 요약을 한 화면에 표시 |
| AI 인벤토리 | 등록 AI 7건의 유형·위험 등급·상태 필터링과 슬라이드인 상세 패널 |
| 리스크 관리 | SVG 리스크 매트릭스와 심각도 순 미조치 리스크 5건의 조치 관리 |
| 도입 심사 (AI Gate) | 4단계 심사 파이프라인 칸반(드래그앤드롭) + 신규 심사 신청 |
| 모니터링 | 시스템별 일별 API 호출량 SVG 라인 차트 · 시스템 헬스 · 이상 징후 로그 |
| 정책 관리 | 임직원 AI 사용 원칙 · 금지 데이터 유형 등 5개 정책 문서 열람 |
| 교육 관리 | AI 리터러시 의무 교육 이수율 게이지 · 부서별 드릴다운 · 알림 발송 |
| 감사 리포트 | 컴플라이언스 점수 게이지(72/58/89) · 규제별 보고서 자동 생성 |

## 화면 구성

```
daou-ai-governance/
├── index.html                  # → pages/dashboard.html 리다이렉트
├── pages/
│   ├── dashboard.html          # 메인 대시보드
│   ├── inventory.html          # AI 인벤토리
│   ├── risk.html               # 리스크 관리
│   ├── gate.html               # AI Gate 도입 심사
│   ├── monitoring.html         # 모니터링
│   ├── policy.html             # 정책 관리
│   ├── education.html          # 교육 관리
│   └── audit.html              # 감사 리포트
├── styles/
│   ├── base.css                # CSS 변수 · 리셋 · 타이포그래피
│   ├── layout.css              # 사이드바 · 톱바 · 그리드 · 반응형
│   ├── components.css          # 카드 · 테이블 · 배지 · 모달 · 차트 프레임
│   └── pages/
│       ├── dashboard.css
│       ├── inventory.css
│       ├── gate.css
│       └── audit.css
├── scripts/
│   ├── icons.js                # 중앙 SVG 아이콘 레지스트리 (data-icon 자동 주입)
│   ├── nav.js                  # 공용 사이드바 주입 + 활성 상태
│   ├── components.js           # 토스트 · 모달 · AI Gate 신청 모달
│   ├── charts.js               # SVG 차트 엔진 (donut/line/gauge/semicircle)
│   └── pages/
│       ├── dashboard.js
│       ├── inventory.js
│       ├── gate.js
│       └── audit.js
├── assets/
│   ├── logo.svg                # DAOU 다우기술 워드마크 (화이트, 다우 블루 배경용)
│   └── icons/                  # 사이드바 아이콘 8종 (24×24, 2px stroke)
├── README.md
└── .gitignore
```

> ⚠ 현재 폴더가 위치한 네트워크 드라이브(N:)는 점(.)으로 시작하는 파일 생성을 차단하므로 `gitignore`라는 이름으로 저장되어 있습니다. **GitHub에 업로드하거나 로컬 디스크로 복사한 뒤 `.gitignore`로 이름을 변경하세요.**

## 실행 방법

빌드·설치 과정이 없습니다. **`index.html`을 브라우저에서 열면 바로 실행됩니다.**

```
1. 저장소를 다운로드(또는 clone)
2. index.html 더블클릭 → 메인 대시보드로 자동 이동
```

## GitHub Pages 배포 방법

1. GitHub에서 새 저장소 생성 (예: `daou-ai-governance`)
2. 프로젝트 전체 파일을 저장소 루트에 업로드 (또는 `git push`)
3. 저장소의 **Settings** 탭 클릭
4. 좌측 메뉴에서 **Pages** 선택
5. **Branch**를 `main`으로 선택하고 폴더는 `/ (root)` 유지
6. **Save** 클릭
7. 1–2분 후 `https://<계정명>.github.io/daou-ai-governance/` 에서 접속 가능

## 기술 스택

- **HTML5** — 시맨틱 마크업, 페이지별 정적 문서
- **CSS3** — CSS 커스텀 프로퍼티 기반 디자인 토큰, BEM 유사 네이밍, 반응형(760px/1100px)
- **Vanilla JS** — 프레임워크·라이브러리 0개, IIFE 모듈 패턴, 이벤트 위임
- **SVG** — 도넛·라인·게이지 차트와 리스크 매트릭스를 순수 SVG로 렌더링 (Chart.js/D3 미사용)
- **Pretendard** — jsDelivr CDN 가변 폰트

## 향후 확장 방향

1. **Backend API 연동** — 현재 정적 데이터를 REST API 기반으로 전환, 인벤토리·리스크 CRUD 영속화
2. **실시간 데이터 연동** — 각 AI 시스템의 호출 로그·이상 징후를 실시간 수집(WebSocket/스트리밍)하여 모니터링 자동화
3. **권한 관리 시스템** — 위원회·부서·일반 임직원 역할별 접근 제어 및 승인 워크플로 권한 분리

## 라이선스

© 2026 DAOU Technology. 내부 프로토타입 — 데이터는 공개 자료 기반의 예시 값입니다.
