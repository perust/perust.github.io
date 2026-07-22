---
title: "GitHub Copilot 7월 14일 업데이트: JetBrains BYOK와 Visual Studio 사용량 알림"
description: "GitHub Copilot의 7월 14일 공식 업데이트 중 JetBrains BYOK custom endpoint, local sandbox, Visual Studio 사용량 알림과 MCP 신뢰 검증을 정리했습니다."
date: "2026-07-16T06:02:09+09:00"
category: "AI/IT 정보"
tags: ["GitHubCopilot", "AI코딩", "JetBrains", "VisualStudio", "BYOK", "MCP", "릴리스노트"]
---

GitHub가 7월 14일 Copilot 관련 업데이트를 여러 건 공개했습니다. 이미 보안 리뷰 기능으로 따로 정리한 내용은 제외하고, 개발자가 IDE 안에서 바로 체감할 가능성이 큰 두 가지를 골랐습니다. JetBrains IDE에서는 OpenAI 호환 custom endpoint로 BYOK 사용 범위가 넓어졌고, Visual Studio 2026에서는 Copilot 사용량 알림과 MCP 서버 신뢰 검증이 전면에 나왔습니다.

둘 다 “새 모델이 더 똑똑해졌다”보다 운영 방식에 가까운 변화입니다. 회사 API 키나 자체 모델 엔드포인트를 Copilot 작업 흐름에 붙일 수 있는지, 사용량 기반 과금이 IDE 안에서 보이는지, MCP 서버 설정이 바뀌었을 때 실행 전에 멈춰 세우는지가 핵심입니다.

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">JetBrains</span>
    <h3>BYOK custom endpoint 확대</h3>
    <p class="issue-summary">GitHub Copilot for JetBrains IDEs에서 OpenAI 호환 custom endpoint와 API key를 설정해 자체 모델을 쓸 수 있다고 안내됐습니다. GitHub는 이 업데이트가 all tiers에 적용된다고 설명했습니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">JetBrains</span>
    <h3>Claude agent provider와 local sandbox</h3>
    <p class="issue-summary">customizations에서 Claude agent provider를 지원하고, custom agents·skills·instructions를 설정할 수 있습니다. Claude agent provider는 Copilot Pro 이상에서 public preview이고, local sandbox도 public preview입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">Visual Studio</span>
    <h3>사용량 알림과 MCP 신뢰 검증</h3>
    <p class="issue-summary">Visual Studio 2026의 Copilot Usage 창은 usage-based billing 기준 사용량을 실시간으로 보여주고, MCP 서버 설정·asset fingerprint가 바뀌면 실행 전 신뢰 확인 대화상자를 표시합니다.</p>
  </li>
</ul>

## JetBrains BYOK custom endpoint

7월 14일 GitHub Changelog의 JetBrains 업데이트에서 가장 중요한 문장은 “OpenAI-compatible custom endpoints with API keys”입니다. 기존 BYOK 흐름이 GitHub가 정한 공급자 선택에 가깝게 느껴졌다면, 이번 업데이트는 OpenAI 호환 엔드포인트를 설정해 자체 모델을 Copilot 작업에 연결하는 쪽으로 한 단계 넓어졌습니다.

이 변화는 JetBrains 계열 IDE를 쓰는 팀에 특히 큽니다. IntelliJ IDEA, PyCharm, WebStorm처럼 JetBrains 환경에 오래 머문 팀은 VS Code 확장이나 별도 CLI로 이동하지 않고도 모델 공급자 구성을 더 세밀하게 가져갈 수 있습니다. 다만 “아무 모델이나 Copilot 전체 기능을 대체한다”는 의미는 아닙니다. 엔드포인트가 OpenAI 호환이어야 하고, 조직 정책·플랜·Copilot 기능별 지원 범위가 함께 맞아야 합니다.

<dl class="routine-kv">
  <div><dt>공식 날짜</dt><dd>2026년 7월 14일</dd></div>
  <div><dt>대상</dt><dd>GitHub Copilot for JetBrains IDEs</dd></div>
  <div><dt>핵심 기능</dt><dd>Bring your own key custom endpoint support</dd></div>
  <div><dt>엔드포인트 조건</dt><dd>OpenAI-compatible custom endpoints with API keys</dd></div>
</dl>

개인 개발자에게는 “Copilot을 쓰면서도 특정 모델 실험을 JetBrains 안에서 이어갈 수 있는가”가 포인트입니다. 기업 팀에는 조금 더 실무적인 의미가 있습니다. 사내 승인 모델, 별도 과금 계정, 프록시를 통한 접근, 데이터 처리 정책을 IDE 안의 Copilot 흐름과 맞출 여지가 커집니다.

## customizations와 local sandbox

같은 JetBrains 업데이트에는 customizations 쪽 변화도 함께 들어갔습니다. GitHub는 plugin management 경험이 더 완성됐고, marketplace나 source repository에서 플러그인을 둘러보고 설치할 수 있다고 설명했습니다. 설정 화면을 옮겨 다니지 않고 팀별 workflow에 맞게 Copilot을 구성하는 방향입니다.

Claude agent provider customizations도 추가됐습니다. GitHub 설명 기준으로 custom agents, skills, instructions를 설정할 수 있으며, Copilot Pro 이상 플랜에서 public preview로 제공됩니다. Claude를 별도 창에서 쓰는 것이 아니라 Copilot의 agent/customization 흐름 안으로 넣는 업데이트라서, 팀이 이미 Claude 기반 지시문이나 skill을 갖고 있다면 JetBrains IDE 안에서 재사용할 여지가 생깁니다.

local sandbox도 public preview로 들어왔습니다. GitHub Docs의 cloud and local sandboxes 설명은 Copilot agent가 도구를 실행할 때 격리된 환경을 쓰는 개념을 다룹니다. JetBrains 플러그인에 local sandbox 설정과 구성 흐름이 추가됐다는 것은, 에이전트가 로컬 개발 환경에서 작업할 때 실행 범위와 위험을 더 명시적으로 관리하려는 방향입니다.

<ul class="issue-list">
  <li class="issue-card"><h3>plugin management</h3><p class="issue-summary">customizations 안에서 marketplace 또는 source repository 기반 플러그인 설치 흐름을 다룹니다.</p></li>
  <li class="issue-card"><h3>Claude agent provider</h3><p class="issue-summary">custom agents, skills, instructions 설정을 지원합니다. GitHub는 Copilot Pro 이상에서 public preview라고 밝혔습니다.</p></li>
  <li class="issue-card"><h3>local sandbox</h3><p class="issue-summary">JetBrains 플러그인에 local sandbox 설정과 구성 흐름이 추가됐습니다. 기능 상태는 public preview입니다.</p></li>
  <li class="issue-card"><h3>Copilot CLI debugger skill</h3><p class="issue-summary">Copilot CLI session에 built-in debugger skill이 추가됐습니다. 에이전트가 단계별 디버깅을 돕는 public preview 기능입니다.</p></li>
</ul>

## Visual Studio 2026 사용량 알림

Visual Studio 쪽 공식 업데이트는 “visibility and trust”라는 표현으로 묶였습니다. 먼저 Copilot Usage 창이 사용량 기반 과금 모델을 반영해 실시간 업데이트를 보여줍니다. 한도에 가까워졌을 때, 한도에 도달했을 때, 초과 사용이 활성화됐을 때 proactive alert를 띄운다고 설명됐습니다.

이 기능은 Copilot을 개인적으로 쓰는 사람보다 팀·회사 계정에서 더 중요합니다. 사용량 기반 과금이 붙으면 “이번 달에 왜 비용이 늘었는지”를 나중에 billing 화면에서 보는 것보다, IDE 안에서 경고 기준을 조정하고 한도 근처에서 알림을 받는 편이 운영상 낫습니다. GitHub 설명에 따르면 Copilot badge menu에서 Copilot Usage를 열 수 있고, settings에서 warning threshold를 조정할 수 있습니다.

<dl class="routine-kv">
  <div><dt>실행 위치</dt><dd>Visual Studio 2026 Copilot badge menu → Copilot Usage</dd></div>
  <div><dt>보이는 항목</dt><dd>usage-based billing 기준 실시간 사용량</dd></div>
  <div><dt>알림 조건</dt><dd>한도 접근, 한도 도달, overages 활성화</dd></div>
  <div><dt>설정</dt><dd>warning threshold 조정 가능</dd></div>
</dl>

## MCP 서버 신뢰 검증과 C++ modernization agent

Visual Studio 2026 업데이트에서 두 번째로 볼 부분은 MCP server trust validation입니다. Visual Studio는 시작 시 MCP 서버의 configuration과 asset fingerprint를 신뢰된 baseline과 비교합니다. 달라진 내용이 있으면 서버가 실행되기 전에 trust dialog가 뜨고, 사용자가 변경 사항을 검토하고 승인해야 합니다.

MCP 서버는 파일, 브라우저, 사내 API, 배포 도구처럼 실제 작업 환경과 연결될 수 있습니다. 그래서 설정이 바뀌었는데도 IDE가 그대로 실행하면 위험합니다. 이번 업데이트는 MCP를 편하게 붙이는 흐름과, 바뀐 도구를 실행 전에 멈춰 세우는 안전장치를 함께 가져가는 변화로 볼 수 있습니다. GitHub는 이 기능이 기본적으로 켜져 있고, Tools → Options → GitHub → Copilot → Copilot Chat의 관련 옵션에서 다룬다고 설명했습니다.

C++ 쪽에서는 GitHub Copilot modernization agent의 MSVC upgrade scenarios가 preview를 벗어나 generally available 상태가 됐습니다. 자동으로 끝까지 진행하는 Automated mode와, assessment·plan·execution을 단계별로 검토하는 Guided mode를 제공한다고 안내됐습니다. C++ 레거시 프로젝트를 유지하는 팀이라면 “대화형 코드 생성”보다 MSVC 업그레이드 계획과 실행을 IDE 안에서 묶는 쪽이 더 직접적인 변화입니다.

## 실제 워크플로 변화

이번 업데이트를 한 줄로 줄이면 “Copilot이 IDE 안의 보조 채팅에서 팀 운영 도구로 더 가까워지는 변화”입니다. JetBrains에서는 자체 엔드포인트·플러그인·Claude agent provider·sandbox가 한꺼번에 들어오고, Visual Studio에서는 사용량과 MCP 신뢰 검증이 IDE 표면으로 올라왔습니다.

개인 사용자에게는 모델 선택과 비용 체감이 더 중요해집니다. BYOK custom endpoint를 쓴다면 응답 품질뿐 아니라 API key 관리, 별도 과금, 엔드포인트 안정성이 함께 따라옵니다. Visual Studio 사용자라면 Copilot Usage 창을 통해 사용량 한도와 overage 알림이 어떻게 뜨는지 먼저 익숙해지는 편이 좋습니다.

팀 사용자에게는 정책과 책임 경계가 더 중요합니다. local sandbox, MCP trust dialog, custom provider 설정은 편의 기능이지만 동시에 “누가 어떤 도구와 모델을 승인했는가”를 남기는 운영 포인트입니다. 특히 Business·Enterprise 환경에서는 관리자 정책, 모델 허용 목록, AI Credits 또는 usage-based billing 정책과 연결됩니다.

## 투자자로서의 관점

투자 관점에서 이번 업데이트는 모델 성능 경쟁보다 개발 도구의 배포면 확대를 보여줍니다. GitHub Copilot이 VS Code 바깥의 JetBrains와 Visual Studio에서 BYOK, sandbox, MCP, 사용량 알림을 강화하면, 기업 고객이 기존 IDE를 바꾸지 않고 AI 코딩 도구를 도입할 수 있는 표면이 늘어납니다.

수익 측면에서는 두 신호가 중요합니다. 하나는 usage-based billing과 AI Credits처럼 사용량을 과금 단위로 연결하는 장치가 IDE 안에 더 노출된다는 점입니다. 다른 하나는 BYOK와 custom endpoint가 Copilot을 단일 모델 상품이 아니라 개발 워크플로 제어면으로 만들 수 있다는 점입니다. 다만 BYOK가 늘어난다고 GitHub의 모델 사용 매출이 곧바로 커진다고 단정할 수는 없습니다. 일부 추론 비용과 매출은 외부 모델 공급자나 고객 자체 계정으로 이동할 수 있습니다.

경쟁 구도에서는 JetBrains, Microsoft Visual Studio, VS Code, Cursor, Claude Code 같은 도구가 모두 “에이전트가 실제 명령을 실행하는 환경”을 붙잡으려 합니다. 따라서 핵심 지표는 단순 다운로드 수보다 기업 플랜 전환, 사용량 기반 과금 채택, MCP·sandbox 같은 관리 기능 사용, 그리고 실제 PR·리뷰·디버깅 흐름에 Copilot이 얼마나 들어가는지입니다.

## 공식 출처

<ul class="issue-list">
  <li class="issue-card"><h3>GitHub Copilot for JetBrains expands BYOK capabilities</h3><p class="issue-summary"><a href="https://github.blog/changelog/2026-07-14-github-copilot-for-jetbrains-expands-byok-capabilities">GitHub Changelog</a>에서 BYOK custom endpoint, Claude agent provider, local sandbox, Copilot CLI debugger skill, 플러그인 관리 개선을 확인했습니다.</p></li>
  <li class="issue-card"><h3>GitHub Copilot in Visual Studio — June update</h3><p class="issue-summary"><a href="https://github.blog/changelog/2026-07-14-github-copilot-in-visual-studio-june-update">GitHub Changelog</a>에서 Copilot Usage, MCP server trust validation, C++ modernization agent GA, PR context 기능을 확인했습니다.</p></li>
  <li class="issue-card"><h3>Cloud and local sandboxes for GitHub Copilot</h3><p class="issue-summary"><a href="https://docs.github.com/copilot/concepts/about-cloud-and-local-sandboxes">GitHub Docs</a>에서 Copilot cloud/local sandbox 개념과 관련 문서 위치를 확인했습니다.</p></li>
</ul>
