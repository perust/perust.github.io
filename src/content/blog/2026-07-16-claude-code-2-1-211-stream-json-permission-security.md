---
title: "Claude Code 2.1.211 업데이트 정리: stream-json subagent 출력과 권한 미리보기 보안"
description: "Claude Code 2.1.211 공식 변경점 기준 stream-json subagent 출력, 권한 미리보기 보안, hooks, MCP, Vertex·Bedrock 실행 안정성을 정리했습니다."
date: "2026-07-16T17:01:32+09:00"
category: "AI"
tags: ["ClaudeCode", "Claude", "Anthropic", "AI코딩", "개발도구", "릴리스노트", "MCP"]
---

Anthropic이 Claude Code v2.1.211을 2026년 7월 15일 공개했습니다. 이번 버전은 새 모델 발표가 아니라 Claude Code를 자동화·원격 세션·사내 실행 환경에 붙여 쓰는 사람에게 직접 영향을 주는 안정성 릴리스입니다. 핵심은 `stream-json`에서 subagent의 텍스트와 thinking을 전달하는 새 옵션, 채팅 채널로 전달되는 권한 미리보기의 문자 위장 방지, unsandboxed Bash를 다루는 `PreToolUse` hook 판단 보강입니다.

전날 v2.1.210이 worktree 격리와 `claude attach` 안정성을 고쳤다면, v2.1.211은 출력 파이프라인, 권한 승인 화면, MCP 재연결, Vertex·Bedrock 모델 설정, Chrome 연동처럼 “여러 환경을 오가며 Claude Code를 계속 돌릴 때” 드러나는 문제를 더 많이 다룹니다.

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

공식 GitHub release 기준 Claude Code v2.1.211의 공개 시각은 2026년 7월 15일 23:02 UTC입니다. 한국 시간으로는 7월 16일 오전에 해당합니다. 같은 주에 v2.1.208, v2.1.209, v2.1.210이 이어졌기 때문에 이번 업데이트는 하나의 큰 기능 발표라기보다 빠른 안정화 흐름의 다음 패치로 보는 편이 정확합니다.

<dl class="routine-kv">
  <div><dt>버전</dt><dd>Claude Code v2.1.211</dd></div>
  <div><dt>공개 시각</dt><dd>2026년 7월 15일 23:02 UTC</dd></div>
  <div><dt>주요 범위</dt><dd>stream-json, permission preview, PreToolUse hook, MCP reconnect, Vertex·Bedrock, Chrome extension</dd></div>
  <div><dt>우선 확인 대상</dt><dd>`claude -p`, subagent 자동화, chat-channel approval, plugin MCP, Vertex·Bedrock 실행 환경을 쓰는 사용자</dd></div>
</dl>

## stream-json 자동화에서 달라진 부분

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

## v2.1.210과 구분해서 볼 지점

전날 공개된 v2.1.210은 `isolation: 'worktree'` subagent, `claude attach`, hook timeout, plugin MCP 재동기화처럼 background agent 운영의 큰 예외를 손봤습니다. v2.1.211은 그 다음 단계로 볼 수 있습니다. 같은 “안정성 릴리스”지만 초점은 출력 전달, 승인 메시지 보안, idle 이후 재연결, 명시적 model 설정 유지, Chrome 확장과 파일 업로드입니다.

<dl class="routine-kv">
  <div><dt>v2.1.210 중심</dt><dd>worktree 격리, attach 전환, hook timeout, background worker, permission rule warning</dd></div>
  <div><dt>v2.1.211 중심</dt><dd>stream-json subagent 출력, permission preview 문자 위장 방지, PreToolUse ask 보존, MCP idle reconnect, Vertex·Bedrock startup</dd></div>
  <div><dt>겹치는 흐름</dt><dd>Claude Code를 여러 세션·subagent·hook·MCP로 장시간 돌리는 사용 패턴</dd></div>
</dl>

## 투자자로서의 관점

v2.1.211은 모델 성능이나 가격 발표가 아니므로 매출 효과를 직접 단정할 수는 없습니다. 다만 Claude Code가 개인용 코드 보조 도구에서 팀 단위 자동화 도구로 이동할 때 필요한 영역을 보여줍니다. `stream-json`, chat-channel approval, hooks, MCP, Vertex·Bedrock, Chrome extension은 모두 단순 채팅보다 깊은 사용을 전제로 합니다.

투자 관점에서 볼 지점은 “새 모델이 더 똑똑한가”보다 “개발 워크플로에 오래 붙어 있을 만큼 안정적인가”입니다. 권한 승인 화면의 보안, model override 유지, idle session 재연결, 로그아웃 안정성은 화려하지 않지만 기업 도입에서 반복 사용과 지원 비용을 좌우합니다. 반대로 이런 수정이 계속 나온다는 것은 실제 사용 패턴이 복잡해지는 만큼 운영 리스크도 같이 늘어난다는 뜻입니다.

## 마지막으로

Claude Code v2.1.211은 headline용 대형 기능 발표가 아닙니다. 하지만 `claude -p` 결과를 파이프라인에 연결하거나, subagent를 여러 모델로 나눠 쓰거나, MCP와 hook을 붙여 사내 워크플로를 만드는 사람에게는 실용적인 패치입니다.

이번 버전을 볼 때는 “무엇이 새로 생겼나”보다 “내 자동화에서 어느 경로가 조용히 안정화됐나”를 기준으로 보는 편이 좋습니다. 특히 `stream-json` 출력, 채팅 채널 승인, unsandboxed Bash hook, plugin MCP, Vertex·Bedrock을 쓰고 있다면 v2.1.211 changelog를 직접 읽어볼 만합니다.

## 참고한 자료

- [Claude Code GitHub release: v2.1.211](https://github.com/anthropics/claude-code/releases/tag/v2.1.211)
- [Claude Code 공식 changelog: 2.1.211](https://code.claude.com/docs/en/changelog#2-1-211)
- [Claude Code changelog Markdown](https://code.claude.com/docs/en/changelog.md)
- [Claude Code 공식 문서: CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Code 공식 문서: Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code 공식 문서: MCP](https://code.claude.com/docs/en/mcp)
