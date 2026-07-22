---
title: "GitHub Copilot 보안 리뷰 업데이트: /security-review와 agentic autofix"
description: "GitHub Copilot 앱의 /security-review 공개 프리뷰와 code scanning agentic autofix를 공식 변경 로그 기준으로 정리했습니다."
date: "2026-07-15T06:00:59+09:00"
category: "AI/IT 정보"
tags: ["GitHubCopilot", "AI코딩", "보안리뷰", "개발도구", "코드스캔", "릴리스노트", "투자관점"]
---

GitHub가 7월 14일 Copilot 앱에 `/security-review` 명령을 공개 프리뷰로 추가했습니다. 작업 중인 코드 변경분을 Copilot 앱 안에서 바로 보안 리뷰할 수 있고, 7월 10일에는 code scanning alert를 Copilot에게 맡겨 수정 PR까지 만들게 하는 agentic autofix도 공개 프리뷰로 열렸습니다.

이번 변화는 "AI가 코드를 잘 짜는가"보다 조금 더 실무적인 업데이트입니다. 개발자가 PR을 올린 뒤 보안 도구가 잡아주는 구조에서, 작업 도중 Copilot 앱·CLI·code scanning alert 흐름 안으로 보안 점검이 앞당겨지고 있습니다.

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">7월 14일</span>
    <h3>Copilot 앱의 /security-review 공개 프리뷰</h3>
    <p class="issue-summary">GitHub Copilot 앱에서 작업 중인 코드 변경분을 대상으로 보안 리뷰를 실행할 수 있습니다. Free, Pro, Business, Enterprise 사용자에게 공개 프리뷰로 제공된다고 안내됐습니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">7월 10일</span>
    <h3>code scanning alert용 agentic autofix</h3>
    <p class="issue-summary">code scanning alert를 Copilot에게 배정하면 관련 파일을 탐색하고 수정안을 만들며 CodeQL 재실행으로 수정 여부를 검증한 뒤 초안 PR을 엽니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">주의점</span>
    <h3>가벼운 리뷰와 조직용 자동수정의 구분</h3>
    <p class="issue-summary">/security-review는 Copilot 앱에서 바로 쓰는 온디맨드 리뷰이고, agentic autofix는 GitHub Code Security 또는 Advanced Security와 Copilot cloud agent 조건이 붙는 조직용 흐름입니다.</p>
  </li>
</ul>

## /security-review 공개 프리뷰

GitHub 공식 변경 로그에 따르면 `/security-review`는 Copilot 앱에서 현재 작업 중인 코드 변경분을 분석하는 슬래시 명령입니다. 기존 Copilot CLI에 있던 AI 기반 취약점 스캔을 Copilot 앱의 일상적인 코딩 흐름으로 가져온 업데이트라고 설명합니다.

결과는 세 가지 축으로 제공됩니다. 보안 발견 항목에는 심각도와 신뢰도가 붙고, 바로 적용할 수 있는 제안이 함께 나오며, 사용자가 다시 검증할 수 있는 흐름을 남깁니다. GitHub는 이 스캔이 injection flaw, cross-site scripting, insecure data handling, path traversal, weak cryptography 같은 흔한 고위험 취약점 유형을 잡도록 조정됐다고 밝혔습니다.

<dl class="routine-kv">
  <div><dt>실행 위치</dt><dd>GitHub Copilot 앱</dd></div>
  <div><dt>명령어</dt><dd><code>/security-review</code></dd></div>
  <div><dt>상태</dt><dd>public preview</dd></div>
  <div><dt>대상 플랜</dt><dd>Copilot Free, Pro, Business, Enterprise</dd></div>
</dl>

개인 개발자에게는 PR을 올리기 전 가벼운 보안 점검을 한 번 더 거치는 기능에 가깝습니다. 팀에서는 기존 GitHub code scanning, Dependabot, secret scanning을 대체한다기보다, 코드가 올라가기 전 로컬 작업 단계에서 잡을 수 있는 문제를 줄이는 보조 레이어로 보는 편이 안전합니다.

## agentic autofix와 다른 점

7월 10일 공개된 agentic autofix는 훨씬 조직용 기능에 가깝습니다. code scanning alert를 Copilot에게 배정하면 Copilot이 코드베이스의 관련 파일을 살펴보고, 수정안을 만들고, CodeQL을 다시 실행해 alert가 닫히는지 확인한 뒤 초안 PR을 엽니다. GitHub는 보통 수정 생성에 2분에서 4분 정도 걸린다고 설명했습니다.

이 기능은 무료 "Generate Fix" 버튼을 대체하는 흐름으로 안내됐습니다. alert 목록에서 하나 이상을 골라 Copilot에게 맡기거나, security campaign 안에서 여러 alert를 한 PR로 고치게 할 수 있습니다. REST API로는 code scanning alert의 assignees를 `copilot-swe-agent[bot]`으로 설정하는 방식도 언급됐습니다.

<ul class="issue-list">
  <li class="issue-card"><h3><code>/security-review</code></h3><p class="issue-summary">작업 중인 변경분을 Copilot 앱에서 바로 훑어보는 공개 프리뷰입니다. 빠른 사전 점검에 가깝고, Copilot Free 사용자도 프리뷰 기간에는 접근 대상으로 안내됐습니다.</p></li>
  <li class="issue-card"><h3>agentic autofix</h3><p class="issue-summary">이미 올라온 code scanning alert를 Copilot cloud agent가 수정 PR로 연결하는 흐름입니다. GitHub Code Security 또는 Advanced Security와 Copilot 라이선스 조건이 붙습니다.</p></li>
  <li class="issue-card"><h3>기존 보안 도구</h3><p class="issue-summary">CodeQL, code scanning, Dependabot, secret scanning은 여전히 기준선 역할을 합니다. Copilot 기능은 작업 중 리뷰와 자동수정 보조를 추가하는 위치입니다.</p></li>
</ul>

## 실제 개발 흐름의 변화

작은 프로젝트에서는 `/security-review`가 커밋 전 습관이 될 수 있습니다. 로그인 처리, 결제 콜백, 파일 업로드, 관리자 페이지, 외부 API 토큰을 다루는 변경분에서 Copilot에게 한 번 더 보게 하는 방식입니다. 사람이 이미 알고 있는 "보안 조심"이 아니라, 현재 diff를 대상으로 취약점 유형과 수정 제안을 받는 점이 다릅니다.

회사 환경에서는 agentic autofix 쪽이 더 큰 변화입니다. 기존에는 code scanning alert가 쌓이고, 담당자가 맥락을 다시 읽고, 수정 PR을 직접 만들어야 했습니다. 이제 일부 alert는 Copilot에게 배정해 초안 PR과 검증 기록을 먼저 받아볼 수 있습니다. 다만 Copilot이 만든 PR은 그대로 병합할 대상이 아니라 리뷰할 초안입니다. 보안 수정은 동작 변경과 권한 범위 변경을 같이 만들 수 있기 때문입니다.

## 비용과 접근 조건

`/security-review`는 공식 변경 로그에서 Copilot Free, Pro, Business, Enterprise 사용자에게 공개 프리뷰로 제공된다고 밝혔습니다. 반면 agentic autofix는 조직이 GitHub Code Security 또는 GitHub Advanced Security를 쓰고, Copilot 라이선스와 Copilot cloud agent가 활성화되어 있어야 합니다. 또한 GitHub는 agentic autofix가 Copilot cloud agent를 사용하므로 AI Credits를 차감한다고 안내했습니다.

따라서 개인 사용자는 먼저 Copilot 앱에서 `/security-review`를 시험해보는 흐름이 현실적입니다. 조직 관리자는 agentic autofix를 켜기 전에 어떤 저장소에서 cloud agent를 허용할지, CodeQL 재실행과 PR 생성 권한을 누가 리뷰할지, AI Credits 사용량을 어떻게 볼지부터 정해야 합니다.

## 투자자로서의 관점

GitHub Copilot의 이번 업데이트는 AI 코딩 도구가 "코드 생성"에서 "개발 프로세스 안의 보안·운영 자동화"로 이동하는 신호입니다. 단순 채팅 기능보다 기업이 비용을 지불하기 쉬운 영역은 보안 alert 처리, 정책 준수, PR 품질 관리, 감사 가능한 자동화입니다.

볼 지점은 세 가지입니다. 첫째, Copilot Business·Enterprise에서 cloud agent와 보안 기능이 실제 사용량을 만들 수 있는지입니다. 둘째, GitHub Advanced Security 또는 GitHub Code Security와 Copilot이 묶여 판매될 때 보안 제품 매출에 어떤 영향을 주는지입니다. 셋째, AI Credits 기반 기능이 조직 예산 안에서 반복 사용될 만큼 신뢰를 얻는지입니다. 아직은 공개 프리뷰 단계이므로 매출 효과를 단정하기보다 사용량과 정식 출시 범위를 보는 것이 맞습니다.

## 바로 써볼 때의 기준

개인 개발자라면 보안상 민감한 변경분에서 `/security-review`를 먼저 써보면 됩니다. 특히 사용자 입력을 SQL·명령어·파일 경로에 연결하는 코드, 인증 쿠키와 세션 처리, 업로드 파일 검증, 암호화·해시·토큰 저장 로직은 리뷰 대상으로 적합합니다.

팀에서는 자동수정 결과를 바로 믿기보다 PR 템플릿과 리뷰 규칙을 함께 정하는 편이 좋습니다. Copilot이 만든 설명, CodeQL 재실행 결과, 테스트 변경, 권한 변경 여부를 사람이 확인해야 합니다. 이 기능의 가치는 "보안 리뷰를 생략"하는 것이 아니라 "반복 alert의 첫 수정안을 빠르게 받는 것"에 있습니다.

## 출처

<ul class="issue-list">
  <li class="issue-card"><h3>GitHub Changelog: Copilot 앱 보안 리뷰</h3><p class="issue-summary"><a href="https://github.blog/changelog/2026-07-14-security-reviews-now-available-in-the-github-copilot-app">Security reviews now available in the GitHub Copilot app</a>에서 `/security-review`, public preview, 지원 플랜, 취약점 유형 설명을 확인했습니다.</p></li>
  <li class="issue-card"><h3>GitHub Changelog: agentic autofix</h3><p class="issue-summary"><a href="https://github.blog/changelog/2026-07-10-agentic-autofix-for-code-scanning-alerts-in-public-preview">Agentic autofix for code scanning alerts in public preview</a>에서 CodeQL 재실행, 초안 PR, 2–4분 생성 시간, 라이선스 조건, AI Credits 차감 안내를 확인했습니다.</p></li>
  <li class="issue-card"><h3>GitHub Changelog: Copilot feed</h3><p class="issue-summary"><a href="https://github.blog/changelog/label/copilot/">Copilot changelog</a>에서 7월 중순 Copilot 보안·거버넌스 업데이트 흐름을 함께 확인했습니다.</p></li>
</ul>

GitHub Copilot의 보안 리뷰 업데이트는 거창한 모델 발표는 아니지만, 실제 개발자가 매일 겪는 PR 전 점검과 code scanning alert 처리에 바로 닿아 있습니다. 지금은 공개 프리뷰인 만큼, 작은 저장소에서 `/security-review`를 먼저 써보고 팀 단위 자동수정은 권한·비용·리뷰 규칙을 정한 뒤 확대하는 접근이 안전합니다.
