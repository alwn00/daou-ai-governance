/* ════════════════════════════════════════════
   dashboard.js — 리스크 기반 거버넌스 대시보드
   데이터는 dashboard-data.js(window.DASH)에서 가져옵니다.

   기능
   - 역할별 화면 전환(Role-Based View): KPI·조치 목록·강조 영역 변경
   - 조직(관계사) 필터: 해당 조직 AI 강조
   - 리스크 산정 모달: 위험요인·가중치·임계값·강제 트리거
   - 상세 모달 강화: 점수 분해 바·트리거·관리조치·담당·Evidence·워크플로우
   - 리스크 Heatmap(영향도×발생가능성)
   - AI Evidence Pack: 증빙 준비율·항목 상태
   - 조치 워크플로우: 감지→배정→개선→재검토→종료
   ════════════════════════════════════════════ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var D = window.DASH;
    var css = getComputedStyle(document.documentElement);

    /* ── 상태 ─────────────────────────────────── */
    var state = { role: 'caio', org: 'all', scope: 'all' };

    /* ── 등급 헬퍼 ────────────────────────────── */
    function levelFor(sys) {
      return D.riskModel.levelOf(sys.score, sys.forced);
    }
    function levelClass(score) {
      if (score >= 85) return 'crit';
      if (score >= 70) return 'high';
      if (score >= 50) return 'mod';
      return 'low';
    }
    function levelText(score) {
      if (score >= 85) return 'Critical';
      if (score >= 70) return 'High';
      if (score >= 50) return 'Moderate';
      return 'Low';
    }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    /* ════════════════════════════════════════════
       1. 도넛 차트 (기존 유지)
       ════════════════════════════════════════════ */
    if (window.SVGCharts) {
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
    }

    /* ════════════════════════════════════════════
       2. AI Gate 신청 모달 (기존 유지)
       ════════════════════════════════════════════ */
    UI.initGateModal({
      onSubmit: function (app) {
        UI.toast(app.name + ' 도입 심사 요청이 접수되었습니다.');
      }
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-action="open-gate-modal"]')) UI.openGateModal();
    });

    /* ════════════════════════════════════════════
       3. KPI 렌더 (역할별)
       ════════════════════════════════════════════ */
    var TONE_COLOR = {
      blue:   ['var(--blue-soft)', 'var(--blue)'],
      high:   ['var(--high-bg)', 'var(--high)'],
      mid:    ['var(--mid-bg)', 'var(--mid)'],
      low:    ['var(--low-bg)', 'var(--low)'],
      purple: ['var(--purple-bg)', 'var(--purple)']
    };

    function renderKpis(role) {
      var row = document.getElementById('kpiRow');
      row.style.setProperty('--kpi-cols', role.kpis.length);
      row.innerHTML = role.kpis.map(function (id) {
        var k = D.kpiCatalog[id];
        if (!k) return '';
        var col = TONE_COLOR[k.tone] || TONE_COLOR.blue;
        var cls = 'kpi tone-' + k.tone + (k.alert ? ' kpi--alert' : '');
        return '<a class="' + cls + '" href="' + k.href + '">' +
          '<div class="k-top">' +
            '<span class="k-title">' + k.title + '</span>' +
            '<span class="k-ico" style="background:' + col[0] + ';color:' + col[1] + '" data-icon="' + k.icon + '"></span>' +
          '</div>' +
          '<div class="k-val">' + k.val + '<small>' + k.unit + '</small></div>' +
          '<div class="k-foot">' + k.foot + '</div>' +
        '</a>';
      }).join('');
      if (window.Icons && Icons.mount) Icons.mount(row);
    }

    /* ════════════════════════════════════════════
       4. 조치 목록 렌더 (역할/조직별 + 워크플로우)
       ════════════════════════════════════════════ */
    var SEV_ORDER = { Critical: 0, High: 1, Moderate: 2, Low: 3 };

    function visibleActions(role) {
      var list = D.actions.slice();
      if (role.actions !== 'all') {
        list = list.filter(function (a) { return a.roles.indexOf(role.id) !== -1; });
      }
      // 관계사 AX 관리자: 선택 조직으로 한정
      if (role.actions === 'affiliate' && state.org !== 'all') {
        list = list.filter(function (a) { return a.org === state.org; });
      }
      list.sort(function (a, b) { return (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]); });
      return list;
    }

    function renderActions(role) {
      var wrap = document.getElementById('actionList');
      var list = visibleActions(role);
      if (!list.length) {
        wrap.innerHTML = '<div class="empty-note">현재 역할/조직 기준으로 표시할 조치 항목이 없습니다.</div>';
        return;
      }
      wrap.innerHTML = list.map(function (a, i) {
        var stageLabel = D.workflowStages[a.status].label;
        var btnCls = a.sevCls === 'warn' ? 'btn-ghost' : 'btn-primary';
        return '<div class="action-item ' + a.sevCls + '" data-scope="' + a.scope + '" data-org="' + a.org + '" data-action-id="' + a.id + '">' +
          '<div class="action-rank">' + (i + 1) + '</div>' +
          '<div class="action-body">' +
            '<div class="action-title">' + esc(a.title) + '</div>' +
            '<div class="action-desc">' + esc(a.desc) + '</div>' +
            '<div class="action-meta">' +
              '<span class="dday ' + a.ddayCls + '">' + a.dday + '</span>' +
              '<span>담당: ' + esc(a.owner) + '</span>' +
              '<span>단계: ' + stageLabel + '</span>' +
              '<span>규제: ' + esc(a.regLabel) + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="' + btnCls + ' btn-sm" data-open-workflow="' + a.id + '">조치 워크플로우</button>' +
        '</div>';
      }).join('');
    }

    /* ════════════════════════════════════════════
       5. 역할 스위처 + 조직 필터 UI
       ════════════════════════════════════════════ */
    function renderRoleSeg() {
      document.getElementById('roleSeg').innerHTML = D.roles.map(function (r) {
        return '<button data-role="' + r.id + '"' + (r.id === state.role ? ' class="on"' : '') + '>' + r.label + '</button>';
      }).join('');
    }
    function renderOrgSeg() {
      document.getElementById('orgSeg').innerHTML = D.orgs.map(function (o) {
        return '<button data-org-filter="' + o.id + '"' + (o.id === state.org ? ' class="on"' : '') + '>' + o.label + '</button>';
      }).join('');
    }

    function roleById(id) {
      for (var i = 0; i < D.roles.length; i++) { if (D.roles[i].id === id) return D.roles[i]; }
      return D.roles[0];
    }

    function applyRole(id) {
      state.role = id;
      var role = roleById(id);
      document.getElementById('roleBadge').textContent = role.label + ' 뷰';
      document.getElementById('roleDesc').innerHTML = '<b>' + role.label + '</b> · ' + esc(role.desc);
      document.getElementById('actionHint').textContent = role.label + ' 우선순위 · 감지→배정→개선→재검토→종료';
      // 역할 기본 조직 적용(관계사 관리자 → 커머스)
      if (role.defaultOrg) { state.org = role.defaultOrg; }
      renderRoleSeg();
      renderOrgSeg();
      renderKpis(role);
      renderActions(role);
      refreshFilters();
    }

    function applyOrg(id) {
      state.org = id;
      renderOrgSeg();
      // 관계사 관리자 역할이면 조치 목록도 조직 기준으로 다시 필터
      renderActions(roleById(state.role));
      refreshFilters();
    }

    document.getElementById('roleSeg').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-role]');
      if (btn) applyRole(btn.dataset.role);
    });
    document.getElementById('orgSeg').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-org-filter]');
      if (btn) applyOrg(btn.dataset.orgFilter);
    });

    /* ── 범위(scope) 필터 + 조직 강조 동시 적용 ── */
    var scopeSummary = {
      all: '전체 AI 시스템 7개를 통합 관제 중입니다.',
      external: '고객 제공 서비스 5개를 외부 규제와 고객 영향도 기준으로 관제 중입니다.',
      internal: '사내 임직원용 도구 2개를 보안·권한·사용 가이드 기준으로 관제 중입니다.'
    };

    function refreshFilters() {
      var scope = state.scope, org = state.org;
      var visibleCount = 0;
      document.querySelectorAll('[data-scope]').forEach(function (el) {
        var visible = scope === 'all' || el.dataset.scope === scope;
        el.classList.toggle('is-hidden', !visible);
        // 조직 강조 (숨겨지지 않은 항목 대상)
        var matchOrg = (org === 'all') || (el.dataset.org === org);
        el.classList.toggle('org-dim', visible && org !== 'all' && !matchOrg);
        el.classList.toggle('org-focus', visible && org !== 'all' && matchOrg);
        if (visible && el.matches('#modelCardRows tr')) visibleCount += 1;
      });
      document.querySelectorAll('[data-scope-filter]').forEach(function (btn) {
        btn.classList.toggle('on', btn.dataset.scopeFilter === scope);
      });
      var sEl = document.getElementById('scopeSummary');
      if (sEl) sEl.textContent = scopeSummary[scope];
      var vEl = document.getElementById('visibleSystemCount');
      if (vEl) vEl.textContent = visibleCount;
    }

    document.querySelectorAll('[data-scope-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.scope = btn.dataset.scopeFilter;
        refreshFilters();
      });
    });

    /* ════════════════════════════════════════════
       6. 리스크 산정 기준 모달
       ════════════════════════════════════════════ */
    function renderRiskModel() {
      var rm = D.riskModel;
      var factors = rm.factors.map(function (f) {
        return '<div class="rm-factor">' +
          '<div class="rf-info"><div class="rf-name">' + f.label + '</div>' +
          '<div class="rf-desc">' + f.desc + ' · 예: ' + f.ex + '</div></div>' +
          '<div class="rf-weight">' + f.max + '점</div></div>';
      }).join('');
      var thresholds = rm.thresholds.map(function (t) {
        var range = t.min >= 85 ? '85점 이상' : t.min >= 70 ? '70~84점' : t.min >= 50 ? '50~69점' : '20~49점';
        return '<tr><td><span class="lvl-pill ' + t.cls + '">' + t.level + '</span></td>' +
          '<td>' + range + '</td><td>' + t.action + '</td></tr>';
      }).join('');
      var triggers = rm.forcedTriggers.map(function (t) { return '<li>' + t + '</li>'; }).join('');

      document.getElementById('riskModelBody').innerHTML =
        '<p class="rm-lead">보건통계의 Risk Stratification(위험군 분류)처럼, AI 리스크도 단일 감각으로 판단하지 않고 ' +
        '<b>위험요인 → 가중치 → 임계값 → 고위험군 분류 → 추적 모니터링</b> 순서로 산정합니다.</p>' +
        '<div class="rm-section"><h4>1 · 위험요인과 가중치 (총 100점)</h4>' + factors +
          '<div class="rm-total"><span>합계</span><span>100점</span></div></div>' +
        '<div class="rm-section"><h4>2 · 임계값 기반 등급 분류</h4>' +
          '<table class="rm-thresholds"><thead><tr><th>등급</th><th>점수</th><th>조치</th></tr></thead>' +
          '<tbody>' + thresholds + '</tbody></table></div>' +
        '<div class="rm-section"><h4>3 · 강제 고위험 트리거 (70점 미만이어도 High 이상 상향)</h4>' +
          '<ul class="rm-triggers">' + triggers + '</ul></div>' +
        '<div class="rm-strat-note">리스크 평가는 ‘위험하다/안전하다’의 감각 판단이 아니라, ' +
        '<b>위험요인을 정의하고 가중치를 부여해 고위험군을 분류</b>하는 작업입니다. 그래서 “왜 90점인지”를 점수로 설명할 수 있습니다.</div>';
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-action="open-risk-model"]')) {
        renderRiskModel();
        UI.openModal('riskModelBg');
      }
    });

    /* ════════════════════════════════════════════
       7. 상세 모달 강화 (점수 분해 + 워크플로우 + Evidence)
       ════════════════════════════════════════════ */
    function fillCls(ratio) { return ratio >= 0.7 ? 'f-high' : ratio >= 0.4 ? 'f-mid' : 'f-low'; }

    function renderBreakdown(sys) {
      return D.riskModel.factors.map(function (f) {
        var v = sys.breakdown[f.id] || 0;
        var ratio = v / f.max;
        return '<div class="rb-row">' +
          '<span class="rb-label">' + f.label + '</span>' +
          '<span class="rb-track"><span class="rb-fill ' + fillCls(ratio) + '" style="width:' + Math.round(ratio * 100) + '%"></span></span>' +
          '<span class="rb-val">' + v + '/' + f.max + '</span></div>';
      }).join('');
    }

    function actionForSystem(id) {
      for (var i = 0; i < D.actions.length; i++) { if (D.actions[i].systemId === id) return D.actions[i]; }
      return null;
    }

    function openDetail(id) {
      var sys = D.systemById(id);
      if (!sys) return;
      var cls = levelClass(sys.score), lvl = levelText(sys.score);
      var act = actionForSystem(id);
      var readiness = D.evidenceReadiness(sys);

      var triggers = sys.forced.length
        ? '<div class="rd-section"><h4>강제 고위험 트리거</h4><div class="rd-triggers">' +
            sys.forced.map(function (t) { return '<span class="rd-trigger">' + t + '</span>'; }).join('') + '</div></div>'
        : '';

      var keyFactors = '<div class="rd-section"><h4>주요 위험요인</h4>' +
        sys.keyFactors.map(function (k) {
          return '<div class="rd-factor"><b>' + esc(k.metric) + '</b> · 기준 <span class="rf-th">' + esc(k.threshold) + '</span><br>' +
            '<span class="td-sub">' + esc(k.note) + '</span></div>';
        }).join('') + '</div>';

      var controls = '<div class="rd-section"><h4>관리 조치</h4><ul class="control-list">' +
        sys.controls.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>';

      var owners = '<div class="rd-section"><h4>담당 체계 (RACI)</h4><div class="rd-owners">' +
        '<span class="rd-owner">1차 <b>' + esc(sys.owner) + '</b></span>' +
        '<span class="rd-owner">검토 <b>' + esc(sys.reviewer) + '</b></span>' +
        (sys.consulted.length ? '<span class="rd-owner">협의 <b>' + sys.consulted.map(esc).join(', ') + '</b></span>' : '') +
        '<span class="rd-owner">최종 책임 <b>' + esc(sys.accountable) + '</b></span></div></div>';

      var basic = '<div class="rd-section"><h4>기본 정보</h4>' +
        sys.model.rows.map(function (r) {
          return '<div class="p-kv"><span class="k">' + r[0] + '</span><span class="v">' + esc(r[1]) + '</span></div>';
        }).join('') + '</div>';

      var eviClass = readiness < 60 ? 'c-low' : readiness < 85 ? 'c-mid' : 'c-ok';
      var eviLink = '<div class="rd-section"><h4>Evidence Pack</h4>' +
        '<div class="evi-cardlet" data-open-evi="' + sys.id + '" style="cursor:pointer">' +
          '<div class="ec-top"><span class="ec-name">증빙 준비율</span><span class="ec-pct ' + eviClass + '">' + readiness + '%</span></div>' +
          '<div class="ec-bar"><i class="' + eviClass + '" style="width:' + readiness + '%"></i></div>' +
          '<div class="ec-foot">클릭하면 9개 증빙 항목 상태를 확인합니다.</div></div></div>';

      var wfBtn = act
        ? '<div class="rd-actions-btns"><button class="btn-primary btn-sm" data-open-workflow="' + act.id + '">조치 워크플로우 보기</button>' +
          '<button class="btn-ghost btn-sm" data-open-evi="' + sys.id + '">Evidence Pack</button></div>'
        : '<div class="rd-actions-btns"><button class="btn-ghost btn-sm" data-open-evi="' + sys.id + '">Evidence Pack</button></div>';

      document.getElementById('modelCardTitle').textContent = sys.model.title;
      document.getElementById('modelCardSub').textContent = sys.model.sub;
      document.getElementById('modelCardBody').innerHTML =
        '<div class="model-card-grid">' +
          '<div class="p-section">' +
            '<div class="rd-score-head">' +
              '<span class="rd-score-big ' + cls + '">' + sys.score + '</span>' +
              '<span class="rd-lvl">' + lvl + (sys.forced.length ? ' · 강제 상향' : '') +
                '<small>' + D.riskModel.levelOf(sys.score, sys.forced).action + '</small></span>' +
            '</div>' +
            '<h4 style="font-size:12px;color:var(--sub);font-weight:800;margin-bottom:10px;">리스크 점수 분해</h4>' +
            '<div class="risk-bars">' + renderBreakdown(sys) + '</div>' +
            triggers + keyFactors +
          '</div>' +
          '<div class="p-section">' +
            owners + controls + eviLink + wfBtn +
          '</div>' +
        '</div>' +
        basic;
      document.getElementById('modelCardBg').classList.add('show');
    }

    function closeDetail() { document.getElementById('modelCardBg').classList.remove('show'); }
    document.getElementById('modelCardClose').addEventListener('click', closeDetail);

    /* ════════════════════════════════════════════
       8. 리스크 Heatmap (영향도 × 발생가능성)
       ════════════════════════════════════════════ */
    var SHORT = { hr: 'HR AI', daouoffice: '메일요약', sabangnet: '사방넷', ppurio: '뿌리오', gemini: 'Gemini', aligpt: '알리GPT', claude: 'Claude' };

    function zoneClass(impact, likelihood) {
      var v = impact * likelihood;
      if (v >= 16) return 'z-crit';
      if (v >= 10) return 'z-high';
      if (v >= 5) return 'z-mod';
      return 'z-low';
    }
    function dotClass(score) {
      if (score >= 85) return 'd-crit';
      if (score >= 70) return 'd-high';
      if (score >= 50) return 'd-mod';
      return 'd-low';
    }

    function renderHeatmap() {
      var grid = document.getElementById('hmGrid');
      if (!grid) return;
      var html = '';
      for (var impact = 5; impact >= 1; impact--) {
        for (var like = 1; like <= 5; like++) {
          var dots = D.systems.filter(function (s) { return s.heat.impact === impact && s.heat.likelihood === like; });
          var inner = dots.map(function (s) {
            return '<span class="hm-dot ' + dotClass(s.score) + '" data-open-card="' + s.id + '" title="' +
              esc(s.name) + ' · ' + s.score + '점 / ' + levelText(s.score) + '">' + SHORT[s.id] + '</span>';
          }).join('');
          html += '<div class="hm-cell ' + zoneClass(impact, like) + '">' + inner + '</div>';
        }
      }
      grid.innerHTML = html;
    }

    /* ════════════════════════════════════════════
       9. AI Evidence Pack
       ════════════════════════════════════════════ */
    function eviColor(pct) { return pct < 60 ? 'c-low' : pct < 85 ? 'c-mid' : 'c-ok'; }
    var EVI_STATUS_LABEL = { done: '완료', review: '검토 중', progress: '진행', collect: '수집 중', wait: '대기' };

    function renderEvidenceGrid() {
      var grid = document.getElementById('eviGrid');
      if (!grid) return;
      grid.innerHTML = D.systems.map(function (s) {
        var pct = D.evidenceReadiness(s);
        var done = s.evidence.filter(function (e) { return e.status === 'done'; }).length;
        var c = eviColor(pct);
        return '<div class="evi-cardlet" data-open-evi="' + s.id + '">' +
          '<div class="ec-top"><span class="ec-name">' + esc(s.name) + '</span>' +
            '<span class="ec-pct ' + c + '">' + pct + '%</span></div>' +
          '<div class="ec-bar"><i class="' + c + '" style="width:' + pct + '%"></i></div>' +
          '<div class="ec-foot">증빙 <b>' + done + '/' + s.evidence.length + '</b> 완료 · ' + levelText(s.score) + '</div>' +
        '</div>';
      }).join('');

      // 헤더 KPI: 고위험(High 이상) AI 증빙 평균
      var hi = D.systems.filter(function (s) { return s.score >= 70; });
      var avg = Math.round(hi.reduce(function (a, s) { return a + D.evidenceReadiness(s); }, 0) / hi.length);
      var head = document.getElementById('eviReadiness');
      if (head) head.textContent = avg + '%';
      // KPI 카탈로그 값도 동기화 (역할 전환 시 일관)
      if (D.kpiCatalog.evidenceReadiness) {
        D.kpiCatalog.evidenceReadiness.val = String(avg);
        D.kpiCatalog.evidenceReadiness.foot = 'Evidence Pack 기준 · 고위험 ' + hi.length + '건 증빙 평균';
      }
    }

    function openEvidence(id) {
      var s = D.systemById(id);
      if (!s) return;
      var pct = D.evidenceReadiness(s);
      document.getElementById('eviModalTitle').textContent = s.name + ' — Evidence Pack';
      document.getElementById('eviModalSub').textContent = '증빙 준비율 ' + pct + '% · 승인 근거와 조치 이력을 감사 가능한 형태로 남깁니다.';
      document.getElementById('eviModalBody').innerHTML =
        '<table class="evi-table"><tbody>' +
        s.evidence.map(function (e) {
          return '<tr><td class="et-name">' + esc(e.name) + '</td>' +
            '<td class="et-desc">' + esc(e.desc) + '</td>' +
            '<td style="text-align:right"><span class="evi-status s-' + e.status + '">' + EVI_STATUS_LABEL[e.status] + '</span></td></tr>';
        }).join('') +
        '</tbody></table>';
      // 모델카드 모달이 열려 있으면 닫고 evidence로 전환
      closeDetail();
      UI.openModal('eviModalBg');
    }

    /* ════════════════════════════════════════════
       10. 조치 워크플로우 모달
       ════════════════════════════════════════════ */
    function renderWorkflow(act) {
      var steps = D.workflowStages.map(function (st, i) {
        var cls = i < act.status ? 'done' : (i === act.status ? 'current' : '');
        return '<div class="wf-step ' + cls + '"><div class="wf-dot">' + (i < act.status ? '✓' : (i + 1)) + '</div>' +
          '<div class="wf-name">' + st.label + '</div></div>';
      }).join('');
      var atLast = act.status >= D.workflowStages.length - 1;
      document.getElementById('wfModalTitle').textContent = act.title;
      document.getElementById('wfModalSub').textContent = '감지 → 담당 배정 → 개선 조치 → 재검토 → 종료';
      document.getElementById('wfModalBody').innerHTML =
        '<div class="wf-steps">' + steps + '</div>' +
        '<div class="wf-meta">' +
          '<div class="wm-cell"><span class="wm-k">현재 상태</span><span class="wm-v">' + D.workflowStages[act.status].label + '</span></div>' +
          '<div class="wm-cell"><span class="wm-k">마감</span><span class="wm-v ' + (act.ddayCls === 'red' ? 'red' : '') + '">' + act.dday + ' · ' + esc(act.sla) + '</span></div>' +
          '<div class="wm-cell"><span class="wm-k">위험요인 / 기준</span><span class="wm-v">' + esc(act.metric) + '<br><span class="td-sub">기준: ' + esc(act.threshold) + '</span></span></div>' +
          '<div class="wm-cell"><span class="wm-k">담당 체계</span><span class="wm-v">' + esc(act.owner) + '<br><span class="td-sub">검토 ' + esc(act.reviewer) + ' · 책임 ' + esc(act.accountable) + '</span></span></div>' +
          '<div class="wm-cell" style="grid-column:1/-1"><span class="wm-k">다음 조치</span><span class="wm-v">' + esc(act.nextAction) + '</span></div>' +
        '</div>' +
        '<div class="m-actions">' +
          '<button class="btn-ghost" data-close-modal="wfModalBg">닫기</button>' +
          (atLast
            ? '<button class="btn-primary" disabled style="opacity:.6">종료 처리됨</button>'
            : '<button class="btn-primary" data-advance-wf="' + act.id + '">다음 단계로 진행</button>') +
        '</div>';
    }

    function openWorkflow(id) {
      var act = null;
      for (var i = 0; i < D.actions.length; i++) { if (D.actions[i].id === id) act = D.actions[i]; }
      if (!act) return;
      renderWorkflow(act);
      closeDetail();
      UI.openModal('wfModalBg');
    }

    /* ════════════════════════════════════════════
       11. 전역 이벤트 위임 (상세/Evidence/워크플로우/조치)
       ════════════════════════════════════════════ */
    document.addEventListener('click', function (e) {
      // 닫기 버튼(범용)
      var closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) { UI.closeModal(closeBtn.dataset.closeModal); return; }

      // 워크플로우 단계 진행 (시각 표시 전용)
      var advBtn = e.target.closest('[data-advance-wf]');
      if (advBtn) {
        var aid = advBtn.dataset.advanceWf;
        for (var i = 0; i < D.actions.length; i++) {
          if (D.actions[i].id === aid && D.actions[i].status < D.workflowStages.length - 1) {
            D.actions[i].status += 1;
            renderWorkflow(D.actions[i]);
            renderActions(roleById(state.role));
            refreshFilters();
            UI.toast('“' + D.workflowStages[D.actions[i].status].label + '” 단계로 이동했습니다.');
            break;
          }
        }
        return;
      }

      // 워크플로우 열기
      var wfBtn = e.target.closest('[data-open-workflow]');
      if (wfBtn) { openWorkflow(wfBtn.dataset.openWorkflow); return; }

      // Evidence Pack 열기
      var eviBtn = e.target.closest('[data-open-evi]');
      if (eviBtn) { openEvidence(eviBtn.dataset.openEvi); return; }

      // 상세(모델카드) 열기 — 버튼
      var detailBtn = e.target.closest('[data-open-card]');
      if (detailBtn) { openDetail(detailBtn.dataset.openCard); return; }

      // 인벤토리 행 클릭(버튼 외 영역)
      var rowTarget = e.target.closest('tr[data-card]');
      if (rowTarget && !e.target.closest('button')) { openDetail(rowTarget.dataset.card); return; }

      // 인벤토리 행의 '조치 요청' → 해당 시스템 워크플로우
      var reqBtn = e.target.closest('[data-action="request-action"]');
      if (reqBtn) {
        var row = reqBtn.closest('tr[data-card]');
        var act = row ? actionForSystem(row.dataset.card) : null;
        if (act) { openWorkflow(act.id); }
        else { UI.toast('해당 AI는 현재 진행 중인 조치 항목이 없습니다.'); }
        return;
      }
    });

    /* ════════════════════════════════════════════
       12. 초기 렌더
       ════════════════════════════════════════════ */
    renderHeatmap();
    renderEvidenceGrid();
    renderRoleSeg();
    renderOrgSeg();
    applyRole('caio');
  });
})();
