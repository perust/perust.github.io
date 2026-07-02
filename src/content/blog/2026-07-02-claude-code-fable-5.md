---
title: "Claude Code Fable 5 사용법: /model fable 설정 전 확인할 5가지"
description: "Claude Code에서 Claude Fable 5를 /model fable로 선택하기 전 확인할 모델 ID, 버전, 비용, usage credits, 거절 응답 주의사항을 정리했다."
date: "2026-07-02T10:11:00+09:00"
updated: "2026-07-02T22:20:00+09:00"
category: "AI"
tags: ["Claude Code", "Claude Fable 5", "AI Coding", "Developer Tools", "Anthropic"]
---

Claude Code에서 Claude Fable 5, 즉 클로드 페이블5를 쓸 수 있다는 이야기는 단순한 모델 추가 소식으로 끝나지 않는다. Claude Code는 저장소를 읽고, 파일을 고치고, 테스트 실행까지 이어가는 개발 도구에 가깝기 때문이다. 어떤 모델을 붙일 수 있는지는 속도, 비용, 안정성, 거절 응답 처리 방식까지 함께 바꾼다.

확인한 범위에서 핵심은 이렇다. 공식 Claude Code 문서는 `fable` alias를 Claude Fable 5로 안내하고, “Fable 5는 기본 모델이 아니며 `/model fable`로 선택한다”고 설명한다. Anthropic 모델 문서의 API 모델 ID는 `claude-fable-5`다. 다만 실제 사용 가능 여부는 Claude Code 버전, 계정 플랜, 조직 정책, zero data retention 설정, 예산 제한에 따라 달라질 수 있다.

![Claude Code 모델 설정을 확인하는 코딩 작업 사진 1](/images/posts/2026-07-02-claude-code-fable-5-01.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">모델명</span>
    <h3>공식 ID는 <code>claude-fable-5</code></h3>
    <p class="issue-summary">Anthropic의 모델 문서에는 Claude Fable 5가 <code>claude-fable-5</code>라는 API 모델 ID로 정리되어 있다.</p>
    <p class="issue-meta">출처: Anthropic Models 문서</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">Claude Code</span>
    <h3><code>/model fable</code>로 선택</h3>
    <p class="issue-summary">공식 Claude Code 모델 설정 문서는 Fable 5가 기본 모델은 아니며, 세션 안에서 <code>/model fable</code>로 선택한다고 안내한다.</p>
    <p class="issue-meta">출처: Claude Code model configuration 문서</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">가격</span>
    <h3>Sonnet보다 비싼 상위 모델</h3>
    <p class="issue-summary">Anthropic 가격표 기준 Fable 5는 입력 100만 토큰당 10달러, 출력 100만 토큰당 50달러로 안내된다.</p>
    <p class="issue-meta">출처: Anthropic Pricing 문서</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">버전</span>
    <h3>Claude Code v2.1.170 이상 필요</h3>
    <p class="issue-summary">Claude Code 문서는 Fable 5가 v2.1.170 이상에서 표시되며, 오래된 버전에서는 모델 선택기에 나타나지 않는다고 설명한다.</p>
    <p class="issue-meta">출처: Claude Code model configuration / changelog</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">주의점</span>
    <h3>일시 중단 후 7월 1일 복구</h3>
    <p class="issue-summary">Anthropic은 6월 12일 Fable 5 접근을 일시 중단했다가, 7월 1일 Claude Platform, Claude.ai, Claude Code, Claude Cowork에서 접근을 복구했다고 밝혔다.</p>
    <p class="issue-meta">출처: Anthropic Redeploying Fable 5 발표</p>
  </li>
</ul>

![Claude Code 모델 설정을 확인하는 코딩 작업 사진 2](/images/posts/2026-07-02-claude-code-fable-5-02.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 모델 정보

Anthropic은 [Claude Fable 5와 Claude Mythos 5 소개 문서](https://docs.anthropic.com/en/docs/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)에서 Fable 5를 “가장 까다로운 추론과 장기 에이전트 작업을 위한, 널리 배포된 가장 강력한 모델”로 설명한다. API 모델 ID는 `claude-fable-5`다.

같은 문서에서 Mythos 5도 함께 언급되지만 둘은 접근성이 다르다. Fable 5는 일반 제공 모델로 안내되고, Mythos 5는 Project Glasswing을 통한 제한 제공 모델로 설명된다. Claude Code를 일상적으로 쓰는 바이브코더가 먼저 신경 써야 할 쪽은 Mythos 5보다 Fable 5다.

스펙도 눈에 띈다. Anthropic 문서 기준 Fable 5는 기본 1M 토큰 컨텍스트와 요청당 최대 128k 출력 토큰을 제공한다. 저장소 전체 맥락, 긴 로그, 여러 문서, 큰 리팩터링 계획을 함께 다루는 코딩 에이전트 작업에 유리할 수 있는 구조다.

다만 “강력하다”는 말만으로 바로 기본 모델을 바꿀 이유는 부족하다. 실제 개발 작업에서는 모델 성능보다 비용, 지시 준수, 파일 변경의 보수성, 테스트 실패를 해석하는 방식이 더 중요할 때가 많다.

![Claude Code 모델 설정을 확인하는 코딩 작업 사진 3](/images/posts/2026-07-02-claude-code-fable-5-03.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 복구 이력

Fable 5는 2026년 6월 9일 공개됐지만, 곧바로 안정적으로 쭉 제공된 것은 아니다. Anthropic은 [Redeploying Fable 5 발표](https://www.anthropic.com/news/redeploying-fable-5)에서 6월 12일 미국 정부의 export controls 때문에 Fable 5와 Mythos 5 접근을 일시 중단했다고 설명했다.

이후 7월 1일 업데이트에서 “Access to Claude Fable 5 and Mythos 5 is now restored”라고 밝혔고, Fable 5가 Claude Platform, Claude.ai, Claude Code, Claude Cowork에서 글로벌 사용자에게 제공된다고 안내했다. 그래서 지금 글을 쓸 때는 “출시됐다”보다 “일시 중단 후 복구됐다”는 맥락까지 같이 보는 편이 정확하다.

다만 클라우드 프로바이더나 조직 계정에서는 재활성화 시점이 다를 수 있다. AWS, Google Cloud, Microsoft Foundry 같은 경로로 쓰는 경우에는 해당 계정에서 실제 모델 선택 가능 여부를 따로 확인해야 한다.

![Claude Code 모델 설정을 확인하는 코딩 작업 사진 4](/images/posts/2026-07-02-claude-code-fable-5-04.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 설정 방법

Claude Code에서 가장 직접적인 방법은 세션 안에서 모델을 바꾸는 것이다. 공식 [Claude Code 모델 설정 문서](https://code.claude.com/docs/en/model-config)는 Fable 5가 기본 모델은 아니며, 다음 명령으로 선택한다고 설명한다.

```text
/model fable
```

터미널에서 새 세션을 시작할 때는 `--model` 옵션을 쓸 수도 있다. 로컬에서 확인한 Claude Code 2.1.197 도움말에는 `--model`이 `fable`, `opus`, `sonnet` 같은 alias 또는 `claude-fable-5` 같은 전체 모델명을 받을 수 있다고 표시된다.

```bash
claude --model fable
claude --model claude-fable-5
```

버전 조건도 있다. Claude Code 문서는 Fable 5가 Claude Code v2.1.170 이상을 필요로 하며, 오래된 버전에서는 모델 선택기에 표시되지 않거나 선택할 수 없다고 설명한다. 보이지 않는다면 먼저 버전을 확인하고 업데이트하는 편이 맞다.

```bash
claude --version
claude update
```

또 하나의 제한은 데이터 보관 설정이다. 같은 문서는 Fable 5가 zero data retention 환경에서는 사용할 수 없고, `/model` 선택기에서 빠지거나 비활성화될 수 있다고 안내한다. 회사 계정이나 조직 계정에서는 이 설정 때문에 개인 계정보다 먼저 막힐 수 있다.

![Claude Code 모델 설정을 확인하는 코딩 작업 사진 5](/images/posts/2026-07-02-claude-code-fable-5-05.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 사용 이유

Claude Code에서 모델 선택은 일반 챗봇의 답변 취향을 고르는 것과 다르다. 모델은 코드를 읽고, 변경 범위를 판단하고, 명령을 실행하고, 실패한 테스트를 다시 해석한다.

Fable 5가 의미 있을 수 있는 작업은 이런 쪽이다.

- 여러 파일에 걸친 리팩터링 계획 세우기
- 오래된 코드베이스의 구조 파악하기
- 긴 로그와 테스트 실패를 함께 읽고 원인 좁히기
- 문서, 이슈, 코드 변경을 한 번에 연결하기
- 단순 생성보다 “어디까지 바꿔야 하는지” 판단이 중요한 작업

특히 1M 토큰 컨텍스트는 큰 장점이 될 수 있다. 기존에는 필요한 파일을 잘라서 넣거나, 여러 번 나눠 설명해야 했던 작업에서 더 많은 배경을 한 번에 줄 수 있기 때문이다.

하지만 모든 코딩 작업에 Fable 5가 필요한 것은 아니다. 작은 수정, 단순 테스트 보정, 문서 수정에는 Sonnet 계열이나 더 저렴한 모델이 충분할 수 있다. 상위 모델은 “항상 켜두는 기본값”보다 “어려운 판단이 필요할 때 쓰는 카드”에 가깝게 보는 편이 안전하다.

## 비용 구조

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

## 거절 응답

Fable 5에서 새로 봐야 할 지점은 거절 응답이다. Anthropic 문서는 Fable 5가 안전 분류기에 의해 특정 요청을 거절할 수 있고, 이때 Messages API는 HTTP 오류가 아니라 `stop_reason: "refusal"`이 포함된 정상 응답을 반환할 수 있다고 설명한다.

일반 블로그 독자에게는 작은 차이처럼 보일 수 있지만, 개발 도구 통합에서는 중요하다. 자동화 파이프라인이 “응답이 왔으니 성공”이라고만 판단하면, 실제로는 작업이 수행되지 않았는데 다음 단계로 넘어갈 수 있기 때문이다.

Claude Code를 사람이 직접 쓰는 경우라면 화면에서 거절 여부를 확인할 수 있다. 하지만 API나 자동화 스크립트에 Fable 5를 붙인다면 다음을 처리해야 한다.

- `stop_reason: "refusal"`을 별도 상태로 분리하기
- 다른 Claude 모델로 재시도할 fallback 경로 두기
- 거절된 요청과 재시도 요청의 비용 처리 이해하기
- 보안·정책 관련 작업은 모델별 응답 차이를 기록하기

Anthropic은 서버 측 fallback, SDK middleware 기반 client-side fallback, 수동 fallback 방식을 함께 안내한다. Fable 5를 제품이나 내부 자동화에 붙일 계획이라면, 모델 성능보다 이 응답 처리부터 설계하는 것이 먼저다.

## 사용 순서

Fable 5를 Claude Code에서 쓸 수 있다면, 처음부터 큰 저장소를 통째로 맡기기보다 작은 검증 작업부터 시작하는 편이 좋다.

### 1. 읽기 전용 분석부터 시작

먼저 파일 수정 없이 구조 파악만 맡긴다.

```text
이 저장소의 인증 흐름을 읽고, 실제 변경 없이 위험한 지점 5가지만 정리해줘.
```

이 단계에서는 모델이 파일을 과하게 건드리려 하지 않는지, 근거 파일을 제대로 짚는지 볼 수 있다.

### 2. 작은 버그 하나만 위임

다음은 범위가 분명한 버그 수정이다.

```text
이 테스트 하나가 실패하는 원인을 찾고, 가장 작은 변경으로 고쳐줘. 관련 없는 리팩터링은 하지 마.
```

좋은 코딩 모델은 문제를 크게 만들지 않는다. 실패한 테스트를 고치기 위해 주변 구조를 불필요하게 갈아엎는다면 실무 기본 모델로 쓰기 어렵다.

### 3. 긴 컨텍스트 작업으로 검증

Fable 5의 장점은 긴 맥락과 장기 에이전트 작업에 있다. 따라서 검증도 이런 작업에서 해야 한다.

```text
이 기능 요청, 기존 구현, 테스트 파일을 함께 읽고 구현 계획을 먼저 세워줘. 아직 코드는 수정하지 마.
```

계획이 납득되면 그때 작은 단위로 구현을 맡긴다. Claude Code에서는 모델 능력만큼이나 권한 설정, 테스트 실행, 리뷰 흐름이 중요하다.

## 최종정리

Claude Code에서 Fable 5를 선택할 수 있다는 것은 바이브코더에게도 의미 있는 변화다. 공식 문서 기준으로 Fable 5는 `claude-fable-5` 모델 ID를 가진 상위 모델이고, Claude Code의 모델 설정 흐름에서도 `fable` alias 또는 전체 모델명 지정이 가능하다.

다만 바로 모든 작업의 기본값으로 바꾸기에는 비용과 응답 처리 이슈가 있다. 입력 100만 토큰당 10달러, 출력 100만 토큰당 50달러라는 가격은 장기 코딩 작업에서 부담이 될 수 있고, Fable 5의 거절 응답은 자동화 통합에서 별도 처리가 필요하다.

지금 가장 좋은 접근은 전면 전환이 아니라 선택적 검증이다. 작은 버그 수정, 읽기 전용 분석, 긴 컨텍스트 설계 작업 순서로 시험해보고, 내 프로젝트에서 실제로 더 나은 결과를 내는지 확인하는 것이 먼저다. 모델 이름보다 중요한 것은 결국 변경 범위를 통제하고, 테스트로 확인하고, 사람이 리뷰할 수 있는 흐름을 유지하는 것이다.

## 참고문서

- [Claude Code model configuration](https://code.claude.com/docs/en/model-config)
- [Claude Code changelog](https://code.claude.com/docs/en/changelog)
- [Anthropic Models overview](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Introducing Claude Fable 5 and Claude Mythos 5](https://docs.anthropic.com/en/docs/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
- [Anthropic Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [Redeploying Fable 5](https://www.anthropic.com/news/redeploying-fable-5)
