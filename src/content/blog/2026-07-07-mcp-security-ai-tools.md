---
title: "MCP 뜻과 보안 이슈: AI 도구에 데이터를 연결하기 전에"
description: "MCP는 AI 도구가 파일·업무 앱·데이터베이스에 연결되는 표준입니다. 연결 전 확인해야 할 권한, 토큰, 승인, 보안 체크리스트를 정리했습니다."
date: "2026-07-07"
category: "AI"
tags: ["AI", "MCP", "보안", "AI에이전트", "자동화", "데이터보호", "개발도구"]
---

MCP는 Model Context Protocol의 줄임말입니다. 쉽게 말하면 Claude, ChatGPT, VS Code, Copilot 같은 AI 도구가 외부 데이터와 업무 도구를 연결할 때 쓰는 공통 연결 방식입니다.

검색창에 질문만 하던 AI가 이제는 파일을 읽고, 깃허브 이슈를 보고, 캘린더나 데이터베이스에 접근하고, 필요한 작업을 실행하는 방향으로 움직이고 있습니다. 그래서 MCP는 편리한 기술이지만 “연결해두면 알아서 해주겠지”로 접근하면 위험합니다. AI에게 연결한 도구는 곧 AI가 접근할 수 있는 권한이 되기 때문입니다.

![MCP와 AI 도구 보안 요약 이미지](/images/posts/summary/2026-07-07-mcp-security-ai-tools-summary.svg)

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">뜻</span>
    <h3>AI 도구와 외부 시스템을 잇는 표준</h3>
    <p class="issue-summary">MCP는 AI 앱이 로컬 파일, 업무 앱, 데이터베이스, 검색 도구, 개발 도구에 접근하도록 돕는 공개 표준입니다. 여러 서비스가 각자 다른 방식으로 붙는 혼란을 줄이는 역할을 합니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">변화</span>
    <h3>답변형 AI에서 실행형 AI로 이동</h3>
    <p class="issue-summary">MCP를 쓰면 AI가 단순히 설명하는 것을 넘어 실제 업무 맥락을 읽고 도구를 호출할 수 있습니다. 편의성은 커지지만 권한 관리의 중요성도 커집니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">주의</span>
    <h3>연결 전 권한·토큰·승인 범위 확인</h3>
    <p class="issue-summary">공식 보안 문서는 혼동된 대리자 문제, 토큰 전달, SSRF, 세션 하이재킹, 범위 과다 부여 같은 위험을 다룹니다. 개인도 회사도 “어디까지 허용할지”를 먼저 정해야 합니다.</p>
  </li>
</ul>

## MCP가 필요한 이유

AI 도구가 일을 하려면 맥락이 필요합니다. 예를 들어 “지난주 고객 문의 중 결제 오류만 정리해줘”라고 요청하려면 AI가 고객 문의 데이터, 결제 로그, 내부 문서 중 일부를 읽을 수 있어야 합니다. “이 이슈를 고쳐줘”라고 말하려면 코드 저장소와 이슈, 테스트 명령에 접근해야 합니다.

문제는 연결 대상이 너무 많다는 점입니다. 서비스마다 API 방식이 다르고, 인증 방식도 다르고, AI 도구마다 연결 규칙도 다르면 개발과 운영이 복잡해집니다. MCP는 이 연결 방식을 표준화해 AI 애플리케이션이 외부 시스템을 더 쉽게 붙일 수 있도록 합니다.

<div class="routine-kv">
  <div><dt>기존 방식</dt><dd>서비스마다 별도 플러그인, 별도 API, 별도 인증 구현</dd></div>
  <div><dt>MCP 방식</dt><dd>AI 클라이언트와 MCP 서버 사이에 공통 규칙을 두는 구조</dd></div>
  <div><dt>사용자 이점</dt><dd>파일, 업무 앱, 개발 도구를 AI 안에서 더 자연스럽게 활용</dd></div>
  <div><dt>보안 과제</dt><dd>AI가 읽고 실행할 수 있는 권한이 넓어질수록 사고 영향도 확대</dd></div>
</div>

공식 MCP 문서는 이 표준을 “AI 애플리케이션을 외부 시스템에 연결하는 오픈소스 표준”으로 설명합니다. 또 Google Calendar, Notion, Figma, 데이터베이스, 3D 도구 같은 예시를 들며 AI가 정보를 읽고 작업을 수행하는 구조를 강조합니다.

## 무엇이 달라지나

가장 큰 변화는 AI 도구의 위치입니다. 이전에는 사용자가 정보를 복사해 AI에게 붙여넣고, 다시 사람이 결과를 옮겼습니다. MCP가 확산되면 AI가 필요한 도구를 직접 호출하는 흐름이 많아집니다.

GitHub는 MCP 서버를 통해 Copilot, VS Code, Claude Desktop 같은 도구가 이슈, 풀리퀘스트, 코드 파일 등 GitHub 맥락에 접근할 수 있다고 설명합니다. 원격 MCP 서버는 로컬 설치 없이 인증 후 사용할 수 있고, OAuth 2.0을 권장한다고 안내합니다.

<div class="routine-grid">
  <section class="routine-card">
    <h3>업무 자동화</h3>
    <p>문서, 캘린더, CRM, 메신저, 노션 같은 업무 도구를 AI가 참고할 수 있습니다. 반복 요약과 정리에는 도움이 되지만, 민감한 고객 정보 접근 범위가 문제가 될 수 있습니다.</p>
  </section>
  <section class="routine-card">
    <h3>개발 환경</h3>
    <p>AI 코딩 도구가 저장소, 이슈, 빌드 로그, 테스트 결과를 읽고 다음 작업을 제안할 수 있습니다. 편해지는 만큼 명령 실행과 파일 수정 권한을 나눠야 합니다.</p>
  </section>
  <section class="routine-card">
    <h3>개인 생산성</h3>
    <p>개인 일정, 메모, 파일을 연결하면 맞춤형 비서처럼 쓸 수 있습니다. 다만 개인 계정 하나가 여러 서비스의 열쇠가 될 수 있어 연결 앱 관리를 습관화해야 합니다.</p>
  </section>
  <section class="routine-card">
    <h3>기업 운영</h3>
    <p>사내 지식 검색, 데이터 분석, 고객지원 자동화에 활용할 수 있습니다. 권한, 감사 로그, 데이터 보존, 외부 전송 정책이 함께 준비되어야 합니다.</p>
  </section>
</div>

## 보안 이슈의 핵심

MCP 자체가 위험한 기술이라는 뜻은 아닙니다. 문제는 MCP가 AI 도구에 “더 많은 연결점”을 열어준다는 데 있습니다. 연결점이 많아지면 공격자가 노릴 수 있는 표면도 넓어집니다.

공식 MCP 보안 문서는 MCP 구현에서 봐야 할 공격과 완화책을 별도로 정리합니다. 대표적으로 혼동된 대리자 문제, 토큰 패스스루, 서버 사이드 요청 위조, 세션 하이재킹, 로컬 MCP 서버 침해, OAuth 승인 URL 검증, 범위 최소화가 언급됩니다.

<ul class="issue-list">
  <li class="issue-card"><h3>혼동된 대리자 문제</h3><p class="issue-summary">MCP 프록시 서버가 제3자 API와 연결될 때 사용자 동의가 제대로 분리되지 않으면 악성 클라이언트가 권한 흐름을 악용할 수 있습니다. 특히 정적 클라이언트 ID와 동적 등록이 함께 쓰일 때 주의가 필요합니다.</p></li>
  <li class="issue-card"><h3>토큰 전달 위험</h3><p class="issue-summary">다른 서비스용 토큰을 MCP 서버가 그대로 받아들이거나 전달하면 권한 경계가 흐려질 수 있습니다. 토큰이 어느 대상에게 발급됐는지 확인하는 audience 검증이 중요합니다.</p></li>
  <li class="issue-card"><h3>권한 범위 과다</h3><p class="issue-summary">처음부터 파일 전체, 데이터베이스 전체, 관리자 권한을 열어두면 토큰 하나가 유출됐을 때 피해가 커집니다. 필요한 작업에 맞춰 작게 허용해야 합니다.</p></li>
  <li class="issue-card"><h3>로컬 서버와 명령 실행</h3><p class="issue-summary">로컬 MCP 서버는 사용자의 컴퓨터나 개발 환경에 가까이 있습니다. 설치 출처, 실행 권한, 네트워크 요청, 자동 업데이트 방식을 확인해야 합니다.</p></li>
</ul>

## 누가 영향을 받나

MCP는 개발자만의 주제가 아닙니다. AI 도구가 업무 앱과 개인 데이터를 연결하는 방식이기 때문에, 실제 영향은 더 넓습니다.

<div class="routine-grid">
  <section class="routine-card">
    <h3>바이브코더와 1인 창업자</h3>
    <p>AI로 앱을 빠르게 만들 때 GitHub, 배포 계정, 데이터베이스를 연결하는 경우가 많습니다. 계정 토큰과 환경변수 파일을 먼저 정리해야 합니다.</p>
  </section>
  <section class="routine-card">
    <h3>비개발 실무자</h3>
    <p>캘린더, 문서, 드라이브, CRM을 연결하면 생산성이 올라갈 수 있습니다. 대신 고객 정보와 사내 문서가 어디까지 읽히는지 확인해야 합니다.</p>
  </section>
  <section class="routine-card">
    <h3>개발팀과 보안팀</h3>
    <p>MCP 서버 목록, 승인 정책, 로그, 네트워크 접근, 토큰 저장 방식을 관리해야 합니다. 개인별 임의 설치를 방치하면 나중에 추적이 어렵습니다.</p>
  </section>
  <section class="routine-card">
    <h3>플랫폼 사업자</h3>
    <p>AI 도구와 연결되는 공식 MCP 서버를 제공하면 사용성이 좋아집니다. 동시에 OAuth, 권한 범위, 감사 기능, 기업 관리 기능이 경쟁력이 됩니다.</p>
  </section>
</div>

## 투자자로서의 관점

MCP는 AI 앱, 개발 도구, 클라우드, 보안, SaaS 플랫폼이 만나는 지점입니다. 특정 종목을 사야 한다는 신호로 볼 일은 아니지만, 어떤 회사가 AI 에이전트 시대의 연결 계층을 장악하는지는 지켜볼 만합니다.

<div class="routine-grid">
  <section class="routine-card">
    <span class="issue-badge">1순위</span>
    <h3>플랫폼의 공식 MCP 서버와 생태계 장악력</h3>
    <p>GitHub처럼 개발자 데이터와 워크플로를 가진 플랫폼은 MCP 서버를 통해 AI 도구 안에서 더 자주 호출될 수 있습니다. 연결 표준이 넓어질수록 플랫폼의 데이터 접근성과 워크플로 락인이 중요해집니다.</p>
    <p>확인할 신호는 공식 MCP 서버 출시, 원격 서버 지원, OAuth 기반 권한 관리, VS Code·Copilot·ChatGPT·Claude 같은 주요 클라이언트 연동입니다. 단순히 “MCP 지원” 문구만으로 매출 기여를 바로 단정하기는 이릅니다.</p>
  </section>
  <section class="routine-card">
    <span class="issue-badge">2순위</span>
    <h3>보안·거버넌스 도구 수요</h3>
    <p>AI가 업무 도구와 데이터를 직접 연결하면 기업은 승인, 감사 로그, 비밀키 탐지, DLP, 권한 최소화 기능을 요구하게 됩니다. AI 도입이 늘수록 보안 예산의 일부가 에이전트 거버넌스로 이동할 수 있습니다.</p>
    <p>볼 지표는 엔터프라이즈 관리 기능, 감사 로그 제공, 보안 인증, 정책 기반 차단, SaaS 연결 관리입니다. 보안 위험을 과장한 마케팅과 실제 고객 도입은 구분해야 합니다.</p>
  </section>
  <section class="routine-card">
    <span class="issue-badge">3순위</span>
    <h3>클라우드와 AI 추론 사용량</h3>
    <p>MCP는 AI가 더 많은 도구를 호출하고 더 긴 맥락을 처리하게 만듭니다. 에이전트형 작업이 늘면 추론 비용, API 호출, 로그 저장, 네트워크 사용량도 함께 늘 수 있습니다.</p>
    <p>확인할 신호는 AI 에이전트 사용량, 토큰 가격, 캐시 정책, 클라우드 매출 내 AI 워크로드 비중입니다. 다만 MCP 확산이 곧바로 높은 이익률로 연결된다고 보는 것은 성급합니다.</p>
  </section>
</div>

## 연결 전에 확인할 것

MCP를 쓸 때는 “설치할까 말까”보다 “어떤 권한으로 연결할까”가 더 중요합니다. 처음에는 최소 권한으로 시작하고, 실제로 필요한 작업이 확인될 때만 범위를 넓히는 방식이 안전합니다.

<div class="routine-template">
  <h3>MCP 연결 체크리스트</h3>
  <ul>
    <li>공식 MCP 서버인지, 커뮤니티 서버인지 출처를 확인합니다.</li>
    <li>읽기 권한과 쓰기 권한을 분리합니다.</li>
    <li>계정 전체 권한 대신 저장소·폴더·프로젝트 단위 권한을 우선 사용합니다.</li>
    <li>OAuth를 지원하면 장기 개인 액세스 토큰보다 OAuth 흐름을 우선 검토합니다.</li>
    <li>API 키, 환경변수, 고객 로그가 AI 도구에 노출되지 않도록 제외합니다.</li>
    <li>명령 실행, 파일 삭제, 외부 전송은 자동 승인하지 않습니다.</li>
    <li>회사에서는 MCP 서버 목록과 승인자를 문서로 만들어놔야 합니다.</li>
  </ul>
</div>

<div class="routine-kv">
  <div><dt>개인 사용자</dt><dd>캘린더·드라이브·GitHub 연결 앱 목록을 정기적으로 확인</dd></div>
  <div><dt>개발자</dt><dd>로컬 MCP 서버의 실행 권한, 토큰 저장 위치, 네트워크 요청 확인</dd></div>
  <div><dt>팀 관리자</dt><dd>허용 MCP 서버, 금지 데이터, 감사 로그, 사고 대응 기준 마련</dd></div>
  <div><dt>기업 보안</dt><dd>OAuth 범위, 세션 관리, DLP, 비밀키 탐지, 공급망 검토 연결</dd></div>
</div>

## 주의할 점

MCP가 표준이라는 이유만으로 모든 서버가 안전하다는 뜻은 아닙니다. 표준은 연결 방식을 맞추는 역할을 하지만, 실제 보안 수준은 구현과 운영 방식에 따라 달라집니다.

특히 커뮤니티 MCP 서버를 설치할 때는 더 조심해야 합니다. 로컬에서 실행되는 서버가 파일 시스템, 브라우저, 터미널, 내부 네트워크에 접근한다면 일반 앱을 설치하는 것보다 더 큰 권한을 줄 수도 있습니다. 스타가 많은 저장소라는 이유만으로 충분하지 않습니다.

<ul class="issue-list">
  <li class="issue-card"><h3>무분별한 전체 권한</h3><p class="issue-summary">처음부터 모든 저장소, 모든 파일, 모든 업무 앱을 연결하면 편하지만 사고 범위도 커집니다. 최소 권한을 기본값으로 잡아야 합니다.</p></li>
  <li class="issue-card"><h3>개인 토큰 장기 사용</h3><p class="issue-summary">개인 액세스 토큰을 오래 쓰면 회수와 추적이 어렵습니다. 가능하면 OAuth, 짧은 만료 기간, 제한된 scope를 사용해야 합니다.</p></li>
  <li class="issue-card"><h3>자동 실행 과신</h3><p class="issue-summary">AI가 도구를 호출할 수 있다고 해서 모든 호출을 자동 승인하면 안 됩니다. 쓰기·삭제·전송·결제·배포 작업은 사람이 확인해야 합니다.</p></li>
  <li class="issue-card"><h3>로그와 학습 데이터 혼동</h3><p class="issue-summary">AI 도구가 어떤 요청을 저장하고, 어떤 데이터가 서비스 제공자에게 전송되는지 확인해야 합니다. 회사 데이터는 약관과 관리 설정을 따로 봐야 합니다.</p></li>
</ul>

## 좋은 사용 방식

MCP를 안전하게 쓰는 핵심은 연결을 작게 시작하는 것입니다. 한 번에 사내 모든 데이터를 붙이지 말고, 특정 저장소나 특정 문서 폴더처럼 범위를 좁혀 검증해야 합니다.

<div class="routine-grid">
  <section class="routine-card">
    <h3>1단계: 읽기 전용 연결</h3>
    <p>처음에는 AI가 정보를 읽고 요약하는 수준으로 제한합니다. 이 단계에서 어떤 데이터가 프롬프트와 로그에 들어가는지 확인합니다.</p>
  </section>
  <section class="routine-card">
    <h3>2단계: 제한된 쓰기 권한</h3>
    <p>문서 초안 작성, 이슈 댓글 작성, 브랜치 생성처럼 되돌릴 수 있는 작업부터 허용합니다. 삭제와 배포는 분리합니다.</p>
  </section>
  <section class="routine-card">
    <h3>3단계: 감사 가능한 자동화</h3>
    <p>승인자, 로그, 알림, 롤백 방법이 있는 작업만 자동화합니다. 개인 계정이 아니라 팀 관리 계정과 정책을 활용해야 합니다.</p>
  </section>
</div>

비개발자라면 더 간단하게 기억해도 됩니다. AI에게 어떤 앱을 연결할 때 “무엇을 읽을 수 있는가”, “무엇을 바꿀 수 있는가”, “문제가 생기면 어떻게 끊을 수 있는가”를 확인하면 됩니다. 이 세 가지가 분명하지 않으면 연결을 미루는 편이 안전합니다.

## 마지막으로

MCP는 AI가 실제 업무 도구와 연결되는 시대의 중요한 표준입니다. 잘 쓰면 반복 업무와 개발 작업을 크게 줄일 수 있습니다. 하지만 AI에게 연결한 데이터와 도구는 곧 권한입니다.

앞으로 AI 도구를 고를 때는 모델 성능만 보면 부족합니다. 어떤 MCP 서버를 지원하는지, 권한을 얼마나 세밀하게 나눌 수 있는지, 토큰과 로그를 어떻게 관리하는지, 기업용 감사 기능이 있는지까지 함께 봐야 합니다. 빠른 연결보다 안전한 연결이 먼저입니다.

## 참고한 자료

- [Model Context Protocol 공식 문서: What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Model Context Protocol 공식 문서: Security Best Practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
- [Model Context Protocol 공식 사양: Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [GitHub Changelog: Remote GitHub MCP Server public preview](https://github.blog/changelog/2025-06-12-remote-github-mcp-server-is-now-available-in-public-preview/)
- [GitHub Changelog: github-mcp-server public preview](https://github.blog/changelog/2025-04-04-github-mcp-server-public-preview/)
- [VS Code 공식 문서: Add and manage MCP servers](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [Google News 검색: MCP 보안 이슈 국내 보도 흐름](https://news.google.com/search?q=MCP%20%EB%B3%B4%EC%95%88%20%EC%9D%B4%EC%8A%88%20AI%20%EB%8F%84%EA%B5%AC%20%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%97%B0%EA%B2%B0&hl=ko&gl=KR&ceid=KR%3Ako)
