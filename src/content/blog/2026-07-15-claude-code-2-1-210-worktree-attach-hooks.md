---
title: "Claude Code 2.1.210 업데이트 정리: worktree 격리와 attach 안정성"
description: "Claude Code 2.1.210 공식 변경점 기준 worktree subagent, claude attach, hook timeout, 플러그인 MCP 안정성 변화를 정리했습니다."
date: "2026-07-15T17:00:46+09:00"
category: "AI"
tags: ["ClaudeCode", "Claude", "Anthropic", "AI코딩", "개발도구", "릴리스노트", "Subagent"]
---

Anthropic이 7월 14일 Claude Code v2.1.210을 공개했습니다. 전날 정리한 v2.1.209가 백그라운드 세션의 `/model` 대화창 문제를 빠르게 고친 릴리스였다면, v2.1.210은 장시간 에이전트 작업에서 더 위험한 부분을 넓게 손본 업데이트입니다. `isolation: 'worktree'` subagent가 메인 체크아웃에서 git 변경 명령을 실행할 수 있던 문제, `claude attach` 전환 실패, hook timeout 오판, 플러그인 MCP 재연결, worktree lock 정리 문제가 함께 수정됐습니다.

Claude Code를 단순 코드 생성 도구가 아니라 여러 subagent와 백그라운드 세션으로 굴리는 사람에게는 작지 않은 릴리스입니다. 특히 자동화·리뷰·플러그인·회사 내부 래퍼를 붙여 쓰는 팀이라면 “새 기능”보다 “잘못된 위치에서 명령이 실행되지 않는가”와 “사람을 기다리며 멈추지 않는가”가 더 중요합니다.

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">worktree</span>
    <h3>subagent 격리 보완</h3>
    <p class="issue-summary">`isolation: 'worktree'` subagent가 자기 worktree가 아니라 메인 repo checkout에서 git-mutating command를 실행할 수 있던 문제가 수정됐습니다. 여러 에이전트가 같은 저장소를 다루는 흐름에서 가장 먼저 봐야 할 항목입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">attach</span>
    <h3>세션 전환 실패 완화</h3>
    <p class="issue-summary">`claude attach`가 세션 전환 중 “job not found” 또는 “agent is still starting”으로 실패하던 문제가 수정됐습니다. attach는 이제 daemon이 안정될 때까지 기다리고, 느린 attach 중 터미널 resize도 완료 뒤 반영합니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">hooks</span>
    <h3>무인 실행 중단 원인 수정</h3>
    <p class="issue-summary">hook callback timeout이 사용자 거절로 잘못 전달되어 unattended session이 멈추던 문제가 수정됐습니다. hook과 background 작업을 섞는 자동화에서 체감될 수 있습니다.</p>
  </li>
</ul>

## 공개된 버전과 날짜

Claude Code 공식 changelog 기준 v2.1.210의 날짜는 2026년 7월 14일입니다. 같은 날 v2.1.208, v2.1.209가 먼저 공개됐고, v2.1.210은 그 뒤 장시간 작업·background service·subagent·plugin 주변의 예외 처리를 더 촘촘하게 정리한 릴리스로 볼 수 있습니다.

이번 글은 v2.1.210 자체 변경점을 기준으로 정리합니다. v2.1.208·v2.1.209에서 다룬 화면 읽기 모드, JSON 출력, 긴 표 렌더링, 백그라운드 세션 대화창 수정은 앞선 글의 범위이고, v2.1.210에서는 더 운영적인 안정성 문제가 중심입니다.

<dl class="routine-kv">
  <div><dt>버전</dt><dd>Claude Code v2.1.210</dd></div>
  <div><dt>공식 날짜</dt><dd>2026년 7월 14일</dd></div>
  <div><dt>핵심 범위</dt><dd>worktree subagent, attach, hooks, plugin MCP, background worker, permission rule warning</dd></div>
  <div><dt>우선 확인 대상</dt><dd>`claude agents`, subagent worktree, plugin MCP, unattended automation을 쓰는 사용자</dd></div>
</dl>

## worktree subagent에서 중요한 수정

가장 눈에 띄는 항목은 `isolation: 'worktree'` subagent 수정입니다. 공식 changelog에는 worktree 격리 subagent가 자기 isolated worktree가 아니라 main repo checkout에 대해 git-mutating command를 실행할 수 있던 문제가 고쳐졌다고 적혀 있습니다.

이 항목은 단순 UI 버그가 아닙니다. 여러 에이전트가 같은 저장소를 나눠 처리할 때 worktree 격리는 “각자 다른 작업 공간에서 변경한다”는 전제 위에 있습니다. 그런데 git 변경 명령이 메인 체크아웃에서 실행될 수 있다면, 사람이 보고 있는 브랜치나 다른 에이전트의 작업 상태가 의도치 않게 바뀔 수 있습니다.

실무적으로는 v2.1.210 업데이트 뒤 다음 흐름을 다시 보는 편이 좋습니다.

<ul class="issue-list">
  <li class="issue-card"><h3>병렬 subagent 작업</h3><p class="issue-summary">기능 구현, 테스트 수정, 문서 정리를 각각 subagent에 맡기는 경우 worktree 경로와 git status가 예상한 작업 공간을 가리키는지 확인할 만합니다.</p></li>
  <li class="issue-card"><h3>자동 커밋·자동 rebase 스크립트</h3><p class="issue-summary">에이전트가 git 명령을 실행하는 워크플로라면 메인 checkout이 예상 밖으로 바뀌지 않았는지 업데이트 뒤 한 번 더 점검하는 것이 좋습니다.</p></li>
  <li class="issue-card"><h3>삭제된 background session</h3><p class="issue-summary">v2.1.210은 killed background session이 영구적인 `git worktree lock`을 남기는 문제도 수정했습니다. 주기적 sweep이 소유 프로세스가 사라진 lock을 풀도록 바뀌었습니다.</p></li>
</ul>

## attach와 background worker 안정성

`claude attach` 수정도 중요합니다. changelog에 따르면 세션 전환 중 `job not found` 또는 `agent is still starting` 오류로 attach가 실패하던 문제가 수정됐고, 이제 attach는 daemon이 안정될 때까지 기다립니다. attach가 느린 동안 터미널 크기가 바뀌는 경우도 완료 뒤 반영됩니다.

백그라운드 작업을 자주 쓰는 사람에게 attach 실패는 작은 불편이 아닙니다. 긴 작업을 맡겨두고 나중에 붙으려 했는데 세션이 아직 시작 중이라는 이유로 실패하면, 사용자는 에이전트 상태를 다시 추적해야 합니다. v2.1.210은 이 전환 구간의 race condition을 줄이는 쪽에 가깝습니다.

background service 쪽에서는 client가 connection을 reset할 때 background worker가 crash loop에 빠지던 문제도 고쳐졌습니다. 네트워크가 불안하거나 터미널·IDE·원격 세션을 오가며 쓰는 환경에서는 이런 예외 처리가 실제 안정성으로 이어질 수 있습니다.

## hook timeout과 무인 세션

v2.1.210은 hook callback timeout이 모델에게 사용자 거절처럼 잘못 전달되던 문제도 수정했습니다. 공식 설명상 이 오판 때문에 unattended session이 멈추고 기다리는 상태가 될 수 있었습니다.

Claude Code에서 hook은 단순 알림을 넘어서 권한, 검증, 사내 정책, 로그 기록, 후처리 자동화와 연결됩니다. 무인 실행에서 hook timeout은 있을 수 있는 실패입니다. 문제는 timeout 자체보다 그것을 “사용자가 거절했다”로 해석해 작업을 멈추는 동작입니다.

자동 리뷰, nightly 정리, PR 코멘트 처리, 사내 검증 스크립트처럼 사람이 바로 응답하지 않는 흐름에서는 이 수정이 더 중요합니다. hook이 실패했을 때 실패로 남는 것과, 사람이 거절한 것으로 처리되어 모델이 진행을 멈추는 것은 운영상 차이가 큽니다.

## permission rule 경고와 플러그인 MCP

이번 릴리스에는 시작 시 permission rule 경고도 추가됐습니다. `Write(path)`, `NotebookEdit(path)`, `Glob(path)` permission rule을 쓰고 있다면 `Edit(path)` 또는 `Read(path)`를 쓰라는 startup warning이 표시됩니다. 권한 규칙을 오래전 설정해둔 사용자는 v2.1.210 이후 경고를 보고 설정 파일을 정리할 수 있습니다.

플러그인 쪽에서는 MCP server 재동기화 중 plugin-provided MCP server가 torn down 되던 문제가 수정됐습니다. 또한 SDK MCP server가 `initialize` control request로 등록된 뒤 다음 turn까지 기다려야 연결을 시작하던 문제도 고쳐졌습니다.

MCP와 플러그인은 Claude Code를 개인 도구에서 팀 도구로 바꾸는 연결부입니다. 파일 시스템, 이슈 트래커, 내부 API, 배포 도구를 붙여 쓰는 경우 재동기화나 초기화 타이밍 문제가 곧 “왜 지금 도구가 안 보이지?”라는 장애로 이어집니다. v2.1.210은 이런 연결부의 예외 처리를 보강한 릴리스입니다.

## 작지만 체감되는 UI·출력 수정

긴 tool call이 collapsed summary line으로 접혀 있을 때 live elapsed-time counter가 추가된 것도 눈에 띕니다. 장시간 실행되는 도구 호출이 멈춘 것처럼 보이지 않도록 시간이 계속 흐르는 표시를 넣은 변화입니다.

또한 background로 이동된 command 뒤에 Claude가 `cd`가 적용됐다고 가정하던 문제도 수정됐습니다. 이제 tool result는 working directory가 바뀌지 않았다고 명시합니다. 터미널 자동화에서는 현재 디렉터리 착각이 엉뚱한 파일 수정으로 이어질 수 있으므로, 이 항목도 단순 문구 수정 이상으로 볼 수 있습니다.

외부 에디터를 열 때 paste marker가 새어 `È/É` 같은 문자가 붙던 문제, plan approval이 edit 없이 통과됐는데도 “edited by user”로 표시되고 stale snapshot으로 plan file을 덮어쓰던 문제, Grep pagination 끝에서 “No matches found”라고 말하던 문제도 함께 정리됐습니다.

## 투자자로서의 관점

v2.1.210은 모델 성능 발표가 아니라 개발 에이전트의 운영 안정성 릴리스입니다. 투자 관점에서는 이런 업데이트가 Claude Code의 실제 사용 깊이를 보여주는 신호가 될 수 있습니다. 사용자가 단순 채팅보다 background agent, worktree, hooks, MCP, plugin을 쓰기 시작하면 도구는 IDE 보조 기능이 아니라 개발 워크플로의 일부가 됩니다.

다만 이 릴리스만으로 매출 효과를 단정할 수는 없습니다. 볼 지점은 기업 환경에서 Claude Code가 얼마나 자주 장시간 작업, 병렬 subagent, 사내 보안 hook, MCP 연동으로 쓰이는지입니다. 안정성 수정이 많다는 것은 사용 사례가 복잡해졌다는 뜻이기도 하지만, 동시에 운영 비용과 지원 부담이 계속 따라온다는 뜻이기도 합니다.

## 마지막으로

Claude Code v2.1.210은 화려한 기능보다 “에이전트가 엉뚱한 곳에서 명령을 실행하지 않게 하는 것”과 “장시간 세션이 사람을 기다리며 멈추지 않게 하는 것”에 초점이 있습니다. worktree subagent, attach, hook timeout, plugin MCP, background worker를 쓰지 않는 개인 사용자에게는 조용한 버그픽스처럼 보일 수 있습니다.

하지만 Claude Code를 실제 업무 자동화에 넣어두었다면 이번 버전은 건너뛰기보다 바로 읽어볼 만합니다. 특히 subagent가 git 작업을 하거나, background session을 자주 attach하거나, hook과 MCP를 붙여 쓰는 환경이라면 v2.1.210 기준으로 동작을 다시 맞추는 것이 좋습니다.

## 참고한 자료

- [Claude Code 공식 changelog: v2.1.210](https://code.claude.com/docs/en/changelog#2-1-210)
- [Claude Code changelog Markdown](https://code.claude.com/docs/en/changelog.md)
- [Anthropic Claude Platform release notes](https://docs.anthropic.com/en/release-notes/overview)
- [Claude Code 공식 문서: Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code 공식 문서: Hooks](https://code.claude.com/docs/en/hooks)
