---
title: "Claude Code 2.1.208–2.1.211 업데이트 총정리: 백그라운드 에이전트·worktree·stream-json·권한 보안"
description: "7월 14~15일 연달아 나온 Claude Code 2.1.208~2.1.211 공식 변경점을 버전별로 비교 정리했습니다. 백그라운드 에이전트, worktree 격리, stream-json 출력, 권한 미리보기 보안이 핵심입니다."
date: "2026-07-16T17:01:32+09:00"
updated: "2026-07-21T09:00:00+09:00"
category: "AI"
tags: ["ClaudeCode", "Claude", "Anthropic", "AI코딩", "개발도구", "릴리스노트", "MCP"]
---

Anthropic이 2026년 7월 14일부터 15일까지 Claude Code v2.1.208, v2.1.209, v2.1.210, v2.1.211을 연달아 공개했습니다. 네 버전 모두 새 모델 발표가 아니라 Claude Code를 자동화·원격 세션·사내 실행 환경에 붙여 쓰는 사람에게 직접 영향을 주는 안정성 릴리스입니다. 처음에는 버전별로 따로 정리했지만, 같은 주의 연속 패치라 이 글 하나로 합쳐 버전 비교 중심으로 다시 정리했습니다.

흐름은 이렇습니다. v2.1.208·v2.1.209가 백그라운드 세션의 입력 유실과 `/model` 대화창 차단, 접근성, JSON 출력 문제를 고쳤고, v2.1.210이 worktree 격리와 `claude attach`, hook timeout을 손봤으며, 마지막 v2.1.211은 `stream-json`에서 subagent의 텍스트와 thinking을 전달하는 새 옵션, 채팅 채널로 전달되는 권한 미리보기의 문자 위장 방지, unsandboxed Bash를 다루는 `PreToolUse` hook 판단 보강처럼 "여러 환경을 오가며 계속 돌릴 때" 드러나는 문제를 다룹니다.

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">출력</span>
    <h3>subagent text를 stream-json으로 전달</h3>
    <p class="issue-summary">새 `--forward-subagent-text` 플래그와 `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT` 환경 변수가 추가됐습니다. `claude -p`나 자동화 파이프라인에서 subagent가 만든 텍스트와 thinking을 `stream-json` 출력에 포함해야 하는 경우에 쓰입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">보안</span>
    <h3>권한 미리보기 문자 위장 방지</h3>
    <p class="issue-summary">채팅 채널로 전달되는 permission preview가 bidirectional-override, zero-width, look-alike quote 문자를 제대로 중화하지 못하던 문제가 수정됐습니다. 도구 입력이 승인 메시지를 시각적으로 다르게 보이게 만드는 위험을 줄이는 항목입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">hooks</span>
    <h3>unsandboxed Bash ask 판단 보강</h3>
    <p class="issue-summary">auto mode가 unsandboxed Bash에 대한 `PreToolUse` hook의 `ask` 결정을 덮어쓰던 문제가 수정됐습니다. hook이 `ask`를 요구하면 최소한 프롬프트가 뜨도록 바뀌었습니다.</p>
  </li>
</ul>

## 공개된 버전과 날짜

공식 GitHub release 기준 v2.1.208은 7월 14일 01:10 UTC, v2.1.209는 7월 14일 06:36 UTC에 공개됐고, v2.1.210의 changelog 날짜도 7월 14일입니다. 마지막 v2.1.211의 공개 시각은 7월 15일 23:02 UTC로, 한국 시간으로는 7월 16일 오전에 해당합니다. 하나의 큰 기능 발표라기보다 같은 주에 이어진 빠른 안정화 흐름으로 보는 편이 정확합니다.

<dl class="routine-kv">
  <div><dt>v2.1.208 중심</dt><dd>화면 읽기 모드(`--ax-screen-reader`), vim insert remap, 프로세스 래퍼, `claude -p` JSON·stream-json 출력 잘림, 200행 초과 표 렌더링, 백그라운드 세션 답장 유실·attach 실패 수정</dd></div>
  <div><dt>v2.1.209 중심</dt><dd>`claude agents` 백그라운드 세션에서 `/model` 등 대화창이 막히던 문제 수정</dd></div>
  <div><dt>v2.1.210 중심</dt><dd>worktree 격리, attach 전환, hook timeout, background worker, plugin MCP 재동기화, permission rule warning</dd></div>
  <div><dt>v2.1.211 중심</dt><dd>stream-json subagent 출력, permission preview 문자 위장 방지, PreToolUse ask 보존, MCP idle reconnect, Vertex·Bedrock startup</dd></div>
</dl>

## v2.1.208·v2.1.209: 백그라운드 세션과 출력 안정화

앞선 두 버전은 개발자가 매일 겪는 사용성 문제에 가깝습니다. v2.1.208은 배달 실패로 백그라운드 에이전트에 입력한 답장이 사라지던 문제, 업데이트 후 실행 바이너리가 바뀌면서 `Couldn't start the background daemon` 상태로 attach가 계속 실패하던 문제를 고쳤습니다. CLI 자동 업데이트 후 컨텍스트 창 표시가 잠깐 200k로 리셋되어 긴 컨텍스트 세션이 100% 사용처럼 보이던 문제도 함께 수정됐습니다.

자동화 파이프라인 쪽에서는 `claude -p`의 큰 응답에서 stream-json/JSON 출력이 잘리거나 result message가 빠지는 문제가 고쳐졌고, 200행을 넘는 마크다운 표는 처음 200행만 보여주고 "나머지 N행" 알림을 표시하는 방식으로 바뀌었습니다.

접근성과 입력 설정도 이 버전에 들어왔습니다. `claude --ax-screen-reader` 옵션, `CLAUDE_AX_SCREEN_READER=1` 환경변수, `"axScreenReader": true` 설정으로 보조기술 사용자를 위한 plain-text 렌더링을 켤 수 있고, `vimInsertModeRemaps` 설정으로 insert mode에서 `jj`를 Escape처럼 쓸 수 있습니다. 기업 환경에서는 agent view와 background service의 self-spawn이 corporate launcher를 거치게 하는 `CLAUDE_CODE_PROCESS_WRAPPER`가 추가됐습니다.

v2.1.209는 변경점이 한 줄이지만 영향은 작지 않습니다. 바로 앞 버전에서 넓게 적용된 보호 로직 때문에 `claude agents`의 백그라운드 세션에서 `/model` 등 대화창이 막히던 문제를 되돌려 수정했습니다.

## v2.1.210: worktree 격리와 attach·hook 안정화

v2.1.210에서 가장 눈에 띄는 항목은 `isolation: 'worktree'` subagent 수정입니다. 공식 changelog에는 worktree 격리 subagent가 자기 isolated worktree가 아니라 main repo checkout에 대해 git-mutating command를 실행할 수 있던 문제가 고쳐졌다고 적혀 있습니다. 여러 에이전트가 같은 저장소를 나눠 처리하는 흐름에서는 사람이 보고 있는 브랜치나 다른 에이전트의 작업 상태가 의도치 않게 바뀔 수 있던 문제라, 단순 UI 버그가 아닙니다. killed background session이 영구적인 `git worktree lock`을 남기던 문제도 주기적 sweep으로 정리되도록 바뀌었습니다.

`claude attach`는 세션 전환 중 `job not found` 또는 `agent is still starting` 오류로 실패하던 문제가 수정됐고, 이제 daemon이 안정될 때까지 기다립니다. hook 쪽에서는 hook callback timeout이 모델에게 사용자 거절처럼 잘못 전달되어 unattended session이 멈추던 문제가 고쳐졌습니다. 무인 자동화에서 timeout이 "사용자가 거절했다"로 해석되어 작업이 멈추는 것은 운영상 차이가 큰 동작입니다.

이 밖에 `Write(path)`·`NotebookEdit(path)`·`Glob(path)` permission rule에 대한 startup warning, plugin MCP server 재동기화 중 teardown 문제, 긴 tool call의 elapsed-time 표시, background 이동된 command 뒤 working directory 착각 수정이 v2.1.210에 들어 있습니다.

## v2.1.211: stream-json 자동화에서 달라진 부분

가장 새 기능에 가까운 항목은 `--forward-subagent-text`입니다. 공식 changelog에는 이 플래그와 `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT` 환경 변수를 통해 subagent text와 thinking을 `stream-json` output에 포함할 수 있다고 적혀 있습니다.

이 변화는 Claude Code를 터미널에서 대화형으로만 쓰는 사람보다 자동화하는 사람에게 더 중요합니다. 예를 들어 `claude -p` 결과를 CI 로그, 사내 대시보드, 별도 에이전트 오케스트레이터, 리뷰 봇으로 넘기는 구조에서는 “최종 응답”만으로 충분하지 않을 때가 있습니다. subagent가 중간에 어떤 텍스트를 만들었는지까지 받아야 후속 파서나 알림 시스템이 제대로 동작합니다.

다만 이 옵션은 모든 사용자에게 무조건 켜야 하는 설정은 아닙니다. thinking과 subagent text를 더 넓게 전달하면 로그에 남는 정보량도 늘어납니다. 사내 저장소, 고객 데이터, 보안 검토 내용을 다루는 팀은 출력 보관 위치와 접근 권한을 같이 정해야 합니다.

## 권한 승인 화면에서 중요한 보안 수정

v2.1.211에는 permission preview 보안 수정이 포함됐습니다. 공식 설명은 채팅 채널로 전달되는 권한 미리보기가 bidirectional-override, zero-width, look-alike quote 문자를 중화하지 못해 tool input이 approval message를 시각적으로 바꿔 보이게 만들 수 있던 문제를 고쳤다는 내용입니다.

이 항목은 개발자에게 낯선 UI 버그처럼 보일 수 있지만, 실제로는 승인 기반 자동화의 핵심입니다. Claude Code가 외부 채팅, 원격 제어, 에이전트 뷰 같은 경로로 “이 도구를 실행해도 되는가”를 보여줄 때 사용자는 표시된 문자열을 보고 판단합니다. 보이지 않는 문자나 방향 제어 문자가 섞이면 같은 텍스트라도 화면에서는 다른 의미처럼 보일 수 있습니다.

특히 다음 환경에서는 v2.1.211 업데이트 의미가 큽니다.

<ul class="issue-list">
  <li class="issue-card"><h3>채팅 채널 승인</h3><p class="issue-summary">Slack, web, mobile, remote control 같은 경로에서 권한 승인 메시지를 보는 팀은 표시 문자열의 신뢰성이 중요합니다.</p></li>
  <li class="issue-card"><h3>외부 입력이 섞이는 작업</h3><p class="issue-summary">이슈 본문, PR 코멘트, 웹 페이지, 사용자 업로드 파일처럼 외부 텍스트가 tool input에 들어오는 흐름에서는 문자 위장 위험이 더 커집니다.</p></li>
  <li class="issue-card"><h3>보안 hook과 정책 승인</h3><p class="issue-summary">approval preview를 기준으로 hook이나 사람이 실행 여부를 판단한다면, 화면에 보이는 명령과 실제 입력 사이의 차이를 줄이는 수정이 중요합니다.</p></li>
</ul>

## PreToolUse hook과 unsandboxed Bash

또 다른 핵심 수정은 auto mode가 unsandboxed Bash에 대한 `PreToolUse` hook의 `ask` 결정을 덮어쓰던 문제입니다. v2.1.211부터는 hook이 `ask`를 반환하면 그 결정이 최소한 prompt로 이어지도록 바뀌었습니다.

Claude Code의 hook은 단순 편의 기능이 아닙니다. 팀에 따라서는 특정 명령 실행 전 승인, 파일 경로 제한, 배포 명령 차단, 로그 기록, 민감 정보 검사에 hook을 씁니다. 특히 sandbox가 없는 Bash 실행은 파일 변경, 네트워크 호출, 배포 스크립트 실행으로 이어질 수 있으므로 `ask` 판단이 auto mode에 눌리는 것은 운영상 위험한 동작입니다.

이 수정은 “자동화 속도”보다 “사람이 물어보라고 정한 지점은 물어본다”는 쪽에 가깝습니다. Claude Code를 unattended workflow에 넣는 팀이라면 v2.1.211 이후에도 hook이 기대한 지점에서 실제로 prompt를 만드는지 작은 재현 작업으로 확인하는 편이 좋습니다.

## MCP·subagent·원격 세션 안정성

v2.1.211은 MCP와 subagent 주변 수정도 많습니다. plugin MCP server가 idle web session에서 깨어난 뒤 재연결되지 않아 다음 메시지 전까지 MCP call이 실패하던 문제가 수정됐습니다. 명시적으로 model override를 준 subagent가 resume이나 follow-up message 뒤 parent model로 되돌아가던 문제도 고쳐졌습니다.

이 두 항목은 겉으로는 다른 문제지만 공통점이 있습니다. Claude Code를 한 번 실행하고 바로 끝내는 대신, web session, background agent, plugin MCP, model override를 이어서 쓰는 장시간 사용 패턴에서 발생합니다. 에이전트가 쉬었다가 다시 깨어나는 순간, “연결돼 있어야 할 MCP”와 “유지돼야 할 model 설정”이 유지되는지가 중요합니다.

또한 여러 Claude Code 세션이 하나의 credential store를 공유할 때 wake-from-sleep 이후 병렬 세션이 동시에 로그아웃되던 문제도 수정됐습니다. 노트북을 닫았다 열거나, 원격 개발 환경을 절전 상태에서 복구하는 사용자는 이 항목을 체감할 수 있습니다.

## Vertex·Bedrock과 Chrome 연동 수정

클라우드 실행 환경에서는 Vertex와 Bedrock 관련 수정이 들어갔습니다. 공식 changelog에 따르면 Claude Code on Vertex and Bedrock이 명시적으로 모델을 설정했는데도 시작 시 default Opus model을 시도하고 잘못된 fallback notice를 출력하던 문제가 수정됐습니다.

기업 환경에서는 이 문구 하나가 비용·권한·컴플라이언스 오해로 이어질 수 있습니다. 실제로는 다른 모델을 쓰도록 설정했는데 시작 로그가 default Opus 시도나 fallback처럼 보이면, 운영자는 모델 라우팅이 어긋났다고 판단할 수 있습니다. 이번 수정은 실행 결과 자체보다 상태 표시와 초기화 경로의 혼선을 줄이는 쪽입니다.

Chrome 연동도 함께 정리됐습니다. remote와 CLI session에서 Chrome으로 Claude에 파일을 업로드하는 문제가 수정됐고, Claude in Chrome extension이 켜져 있지만 Chrome이 실행 중이 아닐 때 startup hang이 생기던 문제도 고쳐졌습니다. 브라우저와 CLI를 함께 쓰는 사람에게는 작은 마찰을 줄이는 업데이트입니다.

## 버전별로 다시 확인할 사용 흐름

네 버전을 합쳐 보면 "내가 쓰는 실행 방식이 어느 버전에서 안정화됐나"를 기준으로 확인하는 편이 좋습니다.

<div class="routine-template">
  <h3>업데이트 후 바로 살펴볼 사용 흐름</h3>
  <ul>
    <li>`claude agents`에서 기존 백그라운드 세션 attach와 `/model` 대화창 동작 (v2.1.208–209)</li>
    <li>`claude -p`를 파이프로 연결하는 JSON·stream-json 자동화 작업 (v2.1.208, v2.1.211)</li>
    <li>subagent가 git 작업을 하는 병렬 worktree 워크플로의 git status (v2.1.210)</li>
    <li>hook이 `ask`를 요구하는 지점에서 실제로 프롬프트가 뜨는지 (v2.1.210–211)</li>
    <li>회사 래퍼·보안 실행기가 있는 환경의 background service 재시작 흐름 (v2.1.208)</li>
    <li>채팅 채널 승인 화면과 plugin MCP idle 재연결 (v2.1.211)</li>
  </ul>
</div>

## 투자자로서의 관점

v2.1.211은 모델 성능이나 가격 발표가 아니므로 매출 효과를 직접 단정할 수는 없습니다. 다만 Claude Code가 개인용 코드 보조 도구에서 팀 단위 자동화 도구로 이동할 때 필요한 영역을 보여줍니다. `stream-json`, chat-channel approval, hooks, MCP, Vertex·Bedrock, Chrome extension은 모두 단순 채팅보다 깊은 사용을 전제로 합니다.

투자 관점에서 볼 지점은 “새 모델이 더 똑똑한가”보다 “개발 워크플로에 오래 붙어 있을 만큼 안정적인가”입니다. 권한 승인 화면의 보안, model override 유지, idle session 재연결, 로그아웃 안정성은 화려하지 않지만 기업 도입에서 반복 사용과 지원 비용을 좌우합니다. 반대로 이런 수정이 계속 나온다는 것은 실제 사용 패턴이 복잡해지는 만큼 운영 리스크도 같이 늘어난다는 뜻입니다.

## 마지막으로

v2.1.208부터 v2.1.211까지 이어진 이 주의 패치는 headline용 대형 기능 발표가 아니라, 실제 사용 중 걸리던 모래알을 빼는 업데이트 묶음입니다. 백그라운드 세션에서 답장이 사라지거나 모델 대화창이 막히는 문제, worktree 격리가 깨지는 문제, 대형 JSON 출력이 잘리는 문제는 모두 작게 보여도 자동화 작업에서는 시간을 많이 잡아먹습니다.

이번 버전들을 볼 때는 “무엇이 새로 생겼나”보다 “내 자동화에서 어느 경로가 조용히 안정화됐나”를 기준으로 보는 편이 좋습니다. 특히 `claude agents`, `claude -p`, worktree subagent, `stream-json` 출력, 채팅 채널 승인, unsandboxed Bash hook, plugin MCP, Vertex·Bedrock 중 하나라도 쓰고 있다면 v2.1.211 기준으로 동작을 다시 확인할 만합니다.

## 참고한 자료

- [Claude Code GitHub release: v2.1.208](https://github.com/anthropics/claude-code/releases/tag/v2.1.208)
- [Claude Code GitHub release: v2.1.209](https://github.com/anthropics/claude-code/releases/tag/v2.1.209)
- [Claude Code 공식 changelog: 2.1.210](https://code.claude.com/docs/en/changelog#2-1-210)
- [Claude Code GitHub release: v2.1.211](https://github.com/anthropics/claude-code/releases/tag/v2.1.211)
- [Claude Code 공식 changelog: 2.1.211](https://code.claude.com/docs/en/changelog#2-1-211)
- [Claude Code changelog Markdown](https://code.claude.com/docs/en/changelog.md)
- [Claude Code 공식 문서: CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Code 공식 문서: Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code 공식 문서: MCP](https://code.claude.com/docs/en/mcp)
