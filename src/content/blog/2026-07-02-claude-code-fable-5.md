---
title: "Claude Code에서 Fable 5 사용 가능? 개발자가 먼저 볼 5가지"
description: "Claude Code에서 Claude Fable 5를 선택할 수 있는 흐름을 공식 문서와 CLI 기준으로 정리했다. 모델명, 가격, 설정 방법, 거절 응답, 실무 적용 순서를 확인한다."
date: "2026-07-02T10:11:00+09:00"
category: "AI"
tags: ["Claude Code", "Claude Fable 5", "AI Coding", "Developer Tools", "Anthropic"]
---

Claude Code에서 Claude Fable 5를 쓸 수 있다는 이야기는 단순한 모델 추가 소식으로 끝나지 않는다. Claude Code는 저장소를 읽고, 파일을 고치고, 테스트 실행까지 이어가는 개발 도구에 가깝기 때문이다. 어떤 모델을 붙일 수 있는지는 속도, 비용, 안정성, 거절 응답 처리 방식까지 함께 바꾼다.

확인한 범위에서 핵심은 이렇다. Anthropic 문서에는 Claude Fable 5의 API 모델 ID가 `claude-fable-5`로 안내되어 있고, Claude Code 2.1.197의 도움말에는 `--model` 옵션 예시로 `fable`, `opus`, `sonnet` alias와 `claude-fable-5` 같은 전체 모델명이 표시된다. 다만 실제 사용 가능 여부는 계정, 플랜, 조직 정책, 예산 제한에 따라 달라질 수 있다.

## 먼저 확인할 5가지

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">모델명</span>
    <h3>공식 ID는 <code>claude-fable-5</code></h3>
    <p class="issue-summary">Anthropic의 모델 문서에는 Claude Fable 5가 <code>claude-fable-5</code>라는 API 모델 ID로 정리되어 있다.</p>
    <p class="issue-meta">출처: Anthropic Models 문서</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">Claude Code</span>
    <h3><code>--model</code>에서 alias 또는 전체 모델명을 쓴다</h3>
    <p class="issue-summary">Claude Code 도움말 기준으로 <code>--model</code>은 <code>fable</code> 같은 alias 또는 <code>claude-fable-5</code> 같은 전체 모델명을 받을 수 있다.</p>
    <p class="issue-meta">확인: Claude Code 2.1.197 CLI 도움말</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">가격</span>
    <h3>Sonnet보다 비싼 상위 모델이다</h3>
    <p class="issue-summary">Anthropic 가격표 기준 Fable 5는 입력 100만 토큰당 10달러, 출력 100만 토큰당 50달러로 안내된다.</p>
    <p class="issue-meta">출처: Anthropic Pricing 문서</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">컨텍스트</span>
    <h3>긴 작업에 맞춘 1M 토큰 컨텍스트</h3>
    <p class="issue-summary">Anthropic은 Fable 5와 Mythos 5가 기본 100만 토큰 컨텍스트와 요청당 최대 128k 출력 토큰을 공유한다고 설명한다.</p>
    <p class="issue-meta">출처: Fable 5 / Mythos 5 소개 문서</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">주의점</span>
    <h3>Fable 5에는 거절 응답 처리가 있다</h3>
    <p class="issue-summary">Fable 5는 안전 분류기에 의해 요청을 거절할 수 있고, 이 경우 API는 오류가 아니라 <code>stop_reason: "refusal"</code> 형태의 정상 응답을 돌려줄 수 있다.</p>
    <p class="issue-meta">출처: Anthropic Fable 5 문서</p>
  </li>
</ul>

## Fable 5는 어떤 모델인가

Anthropic은 [Claude Fable 5와 Claude Mythos 5 소개 문서](https://docs.anthropic.com/en/docs/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)에서 Fable 5를 “가장 까다로운 추론과 장기 에이전트 작업을 위한, 널리 배포된 가장 강력한 모델”로 설명한다. API 모델 ID는 `claude-fable-5`다.

같은 문서에서 Mythos 5도 함께 언급되지만 둘은 접근성이 다르다. Fable 5는 일반 제공 모델로 안내되고, Mythos 5는 Project Glasswing을 통한 제한 제공 모델로 설명된다. Claude Code에서 일반 개발자가 먼저 신경 써야 할 쪽은 Mythos 5보다 Fable 5다.

스펙도 눈에 띈다. Anthropic 문서 기준 Fable 5는 기본 1M 토큰 컨텍스트와 요청당 최대 128k 출력 토큰을 제공한다. 저장소 전체 맥락, 긴 로그, 여러 문서, 큰 리팩터링 계획을 함께 다루는 코딩 에이전트 작업에 유리할 수 있는 구조다.

다만 “강력하다”는 말만으로 바로 기본 모델을 바꿀 이유는 부족하다. 실제 개발 작업에서는 모델 성능보다 비용, 지시 준수, 파일 변경의 보수성, 테스트 실패를 해석하는 방식이 더 중요할 때가 많다.

## Claude Code에서는 어떻게 지정하나

Claude Code는 모델을 설정으로 고정하거나, 실행할 때 한 번만 바꿀 수 있다. [Claude Code 설정 문서](https://docs.anthropic.com/en/docs/claude-code/settings)는 `model` 설정을 “Claude Code에서 사용할 기본 모델”로 설명하고, `--model`과 `ANTHROPIC_MODEL`이 한 세션에 대해 이를 덮어쓸 수 있다고 안내한다.

로컬에서 확인한 Claude Code 2.1.197 도움말에도 같은 흐름이 보인다.

```bash
claude --model fable
```

또는 전체 모델명을 직접 지정할 수도 있다.

```bash
claude --model claude-fable-5
```

도움말 문구 기준으로는 `fable`, `opus`, `sonnet` 같은 alias와 `claude-fable-5` 같은 전체 모델명이 모두 모델 지정 방식에 포함된다. 실제 실행 가능 여부는 계정의 사용 권한, 인증 방식, 조직 정책, 예산 제한에 따라 달라질 수 있다.

## 왜 개발자에게 의미가 있나

Claude Code에서 모델 선택은 일반 챗봇의 답변 취향을 고르는 것과 다르다. 모델은 코드를 읽고, 변경 범위를 판단하고, 명령을 실행하고, 실패한 테스트를 다시 해석한다.

Fable 5가 의미 있을 수 있는 작업은 이런 쪽이다.

- 여러 파일에 걸친 리팩터링 계획 세우기
- 오래된 코드베이스의 구조 파악하기
- 긴 로그와 테스트 실패를 함께 읽고 원인 좁히기
- 문서, 이슈, 코드 변경을 한 번에 연결하기
- 단순 생성보다 “어디까지 바꿔야 하는지” 판단이 중요한 작업

특히 1M 토큰 컨텍스트는 큰 장점이 될 수 있다. 기존에는 필요한 파일을 잘라서 넣거나, 여러 번 나눠 설명해야 했던 작업에서 더 많은 배경을 한 번에 줄 수 있기 때문이다.

하지만 모든 코딩 작업에 Fable 5가 필요한 것은 아니다. 작은 수정, 단순 테스트 보정, 문서 수정에는 Sonnet 계열이나 더 저렴한 모델이 충분할 수 있다. 상위 모델은 “항상 켜두는 기본값”보다 “어려운 판단이 필요할 때 쓰는 카드”에 가깝게 보는 편이 안전하다.

## 비용은 먼저 봐야 한다

[Anthropic 가격 문서](https://docs.anthropic.com/en/docs/about-claude/pricing)에 따르면 Claude Fable 5의 기본 가격은 입력 100만 토큰당 10달러, 출력 100만 토큰당 50달러다. 같은 표에서 Claude Sonnet 5는 2026년 8월 31일까지 입력 100만 토큰당 2달러, 출력 100만 토큰당 10달러로 안내된다.

즉 Fable 5는 강력한 만큼 비용 차이도 크다. Claude Code는 저장소 파일, 도구 결과, 테스트 로그가 함께 들어가면 토큰 사용량이 빠르게 커질 수 있다. 긴 컨텍스트를 쓸 수 있다는 점은 장점이지만, 긴 컨텍스트를 자주 쓰면 비용도 같이 커진다.

실무에서는 이렇게 나누는 편이 현실적이다.

```text
작은 수정 / 단순 문서화
→ 기본 모델 또는 저렴한 모델

복잡한 설계 / 큰 리팩터링 / 긴 장애 분석
→ Fable 5 검토

운영 저장소에 직접 적용
→ 작은 브랜치에서 먼저 테스트
```

모델을 바꾸는 것보다 중요한 것은 작업을 잘게 나누는 것이다. 비싼 모델을 큰 작업에 한 번 던지는 것보다, 문제 정의와 검증 기준을 좁혀서 맡기는 쪽이 결과도 비용도 안정적이다.

## 거절 응답과 fallback도 확인해야 한다

Fable 5에서 새로 봐야 할 지점은 거절 응답이다. Anthropic 문서는 Fable 5가 안전 분류기에 의해 특정 요청을 거절할 수 있고, 이때 Messages API는 HTTP 오류가 아니라 `stop_reason: "refusal"`이 포함된 정상 응답을 반환할 수 있다고 설명한다.

일반 블로그 독자에게는 작은 차이처럼 보일 수 있지만, 개발 도구 통합에서는 중요하다. 자동화 파이프라인이 “응답이 왔으니 성공”이라고만 판단하면, 실제로는 작업이 수행되지 않았는데 다음 단계로 넘어갈 수 있기 때문이다.

Claude Code를 사람이 직접 쓰는 경우라면 화면에서 거절 여부를 확인할 수 있다. 하지만 API나 자동화 스크립트에 Fable 5를 붙인다면 다음을 처리해야 한다.

- `stop_reason: "refusal"`을 별도 상태로 분리하기
- 다른 Claude 모델로 재시도할 fallback 경로 두기
- 거절된 요청과 재시도 요청의 비용 처리 이해하기
- 보안·정책 관련 작업은 모델별 응답 차이를 기록하기

Anthropic은 서버 측 fallback, SDK middleware 기반 client-side fallback, 수동 fallback 방식을 함께 안내한다. Fable 5를 제품이나 내부 자동화에 붙일 계획이라면, 모델 성능보다 이 응답 처리부터 설계하는 것이 먼저다.

## 바로 써본다면 이런 순서가 낫다

Fable 5를 Claude Code에서 쓸 수 있다면, 처음부터 큰 저장소를 통째로 맡기기보다 작은 검증 작업부터 시작하는 편이 좋다.

### 1. 읽기 전용 분석부터 시킨다

먼저 파일 수정 없이 구조 파악만 맡긴다.

```text
이 저장소의 인증 흐름을 읽고, 실제 변경 없이 위험한 지점 5가지만 정리해줘.
```

이 단계에서는 모델이 파일을 과하게 건드리려 하지 않는지, 근거 파일을 제대로 짚는지 볼 수 있다.

### 2. 작은 버그 하나만 맡긴다

다음은 범위가 분명한 버그 수정이다.

```text
이 테스트 하나가 실패하는 원인을 찾고, 가장 작은 변경으로 고쳐줘. 관련 없는 리팩터링은 하지 마.
```

좋은 코딩 모델은 문제를 크게 만들지 않는다. 실패한 테스트를 고치기 위해 주변 구조를 불필요하게 갈아엎는다면 실무 기본 모델로 쓰기 어렵다.

### 3. 긴 컨텍스트가 필요한 작업에 써본다

Fable 5의 장점은 긴 맥락과 장기 에이전트 작업에 있다. 따라서 검증도 이런 작업에서 해야 한다.

```text
이 기능 요청, 기존 구현, 테스트 파일을 함께 읽고 구현 계획을 먼저 세워줘. 아직 코드는 수정하지 마.
```

계획이 납득되면 그때 작은 단위로 구현을 맡긴다. Claude Code에서는 모델 능력만큼이나 권한 설정, 테스트 실행, 리뷰 흐름이 중요하다.

## 결론: 기본값 변경보다 “어려운 작업용 카드”로 시작하기

Claude Code에서 Fable 5를 선택할 수 있다는 것은 개발자에게 의미 있는 변화다. 공식 문서 기준으로 Fable 5는 `claude-fable-5` 모델 ID를 가진 상위 모델이고, Claude Code의 모델 설정 흐름에서도 `fable` alias 또는 전체 모델명 지정이 가능하다.

다만 바로 모든 작업의 기본값으로 바꾸기에는 비용과 응답 처리 이슈가 있다. 입력 100만 토큰당 10달러, 출력 100만 토큰당 50달러라는 가격은 장기 코딩 작업에서 부담이 될 수 있고, Fable 5의 거절 응답은 자동화 통합에서 별도 처리가 필요하다.

지금 가장 좋은 접근은 전면 전환이 아니라 선택적 검증이다. 작은 버그 수정, 읽기 전용 분석, 긴 컨텍스트 설계 작업 순서로 시험해보고, 내 프로젝트에서 실제로 더 나은 결과를 내는지 확인하는 것이 먼저다. 모델 이름보다 중요한 것은 결국 변경 범위를 통제하고, 테스트로 확인하고, 사람이 리뷰할 수 있는 흐름을 유지하는 것이다.

## 참고한 문서

- [Anthropic Models overview](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Introducing Claude Fable 5 and Claude Mythos 5](https://docs.anthropic.com/en/docs/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
- [Anthropic Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings)
