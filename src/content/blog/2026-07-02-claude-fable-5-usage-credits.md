---
title: "Claude Fable 5, 7월 7일까지 구독 사용 허용과 이후 주의사항"
description: "Claude Fable 5는 7월 7일까지 일부 구독 한도에 포함되고 이후 usage credits 기반 사용으로 전환된다. 구독자가 봐야 할 비용·API 키 주의사항을 정리했다."
date: "2026-07-02T14:51:00+09:00"
category: "AI"
tags: ["Claude Fable 5", "Claude Code", "Usage Credits", "AI Coding", "Anthropic"]
---

공식 공지 기준으로 보면, Claude Fable 5는 7월 7일까지 일부 구독 플랜의 주간 사용량 한도 안에서 쓸 수 있고, 그 이후에는 usage credits 기반으로 제공된다.

사용자 입장에서는 차이가 꽤 크다. 월 구독료 안에서 “한도까지 써보는 모델”에 가까웠던 Fable 5가, 7월 7일 이후에는 사용량에 따라 비용을 의식해야 하는 고급 모델로 바뀌는 셈이다. Claude Code로 앱을 만들거나, 블로그를 고치거나, 자동화 작업을 맡기는 바이브코더라면 이 변화를 비용 구조로 이해하는 편이 정확하다.

![Claude 사용량 크레딧과 비용을 확인하는 작업 사진 1](/images/posts/2026-07-02-claude-fable-5-usage-credits-01.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 핵심은 API 전용이 아니라 credits 전환

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">기간</span>
    <h3>7월 7일까지 구독 한도 포함</h3>
    <p class="issue-summary">Anthropic 공지 기준 Pro, Max, Team, select Enterprise 플랜은 Fable 5를 주간 사용량 한도의 최대 50%까지 포함해서 쓸 수 있다.</p>
    <p class="issue-meta">출처: Anthropic Redeploying Fable 5</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">전환</span>
    <h3>7월 7일 이후 usage credits</h3>
    <p class="issue-summary">7월 7일 이후 Fable 5는 구독 포함 사용량이 아니라 usage credits 기반으로 제공된다.</p>
    <p class="issue-meta">구독 한도와 별도 비용 가능성</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">오해</span>
    <h3>API 전용 전환은 아님</h3>
    <p class="issue-summary">Claude Code 안에서 Fable 5를 선택할 수 있더라도, 비용이 credits 기반으로 잡힐 수 있다는 점이 핵심이다.</p>
    <p class="issue-meta">“API만 가능”보다 “사용량 기반 과금”에 가까움</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">주의</span>
    <h3>API 키 설정 시 API 과금</h3>
    <p class="issue-summary">Claude Code에 <code>ANTHROPIC_API_KEY</code>가 잡혀 있으면 구독 포함 한도가 아니라 API usage charges로 처리될 수 있다.</p>
    <p class="issue-meta">출처: Anthropic Help Center</p>
  </li>
</ul>

![Claude 사용량 크레딧과 비용을 확인하는 작업 사진 2](/images/posts/2026-07-02-claude-fable-5-usage-credits-02.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 7월 7일까지는 구독 한도에 포함

Anthropic의 [Redeploying Fable 5](https://www.anthropic.com/news/redeploying-fable-5) 공지는 Fable 5가 7월 1일부터 Claude Platform, Claude.ai, Claude Code, Claude Cowork에서 다시 제공된다고 설명한다. 그리고 Pro, Max, Team, select Enterprise 플랜에 대해 중요한 조건을 붙였다.

> Fable 5 will be included for up to 50% of weekly usage limits through July 7, after which it will be available via usage credits.

이 문장을 풀면 이렇다.

```text
7월 1일–7월 7일
→ 일부 구독 플랜의 주간 사용량 한도 안에서 Fable 5 사용 가능

7월 7일 이후
→ usage credits 기반으로 Fable 5 사용
```

여기서 중요한 표현은 “up to 50% of weekly usage limits”다. 구독자에게 Fable 5가 완전히 무제한으로 풀린 것이 아니라, 주간 사용량 한도의 일부로 포함됐다는 뜻이다. 그래도 사용자는 이 기간 동안 월 구독료 안에서 Fable 5를 체험할 수 있었다.

![Claude 사용량 크레딧과 비용을 확인하는 작업 사진 3](/images/posts/2026-07-02-claude-fable-5-usage-credits-03.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 7월 7일 이후는 구독 포함이 아니라 사용량 기반

7월 7일 이후 변화는 “Fable 5 사용 불가”가 아니다. 더 정확히는 “구독 포함 한도에서 usage credits 기반 사용으로 이동”이다.

이 차이는 일반 사용자에게 크게 느껴진다. 구독료는 고정비다. 이번 달에 Claude를 얼마나 썼는지와 관계없이, 정해진 요금을 내고 한도 안에서 쓴다. 반면 credits는 사용량 기반이다. 긴 작업을 맡기거나, 큰 저장소를 읽히거나, 여러 번 재시도하면 비용이 커질 수 있다.

그래서 7월 7일 이후 Fable 5의 위치는 이렇게 보는 편이 안전하다.

```text
구독 포함 기본 모델
→ 아님

Claude Code에서 선택 가능한 상위 모델
→ 가능성 있음

사용량에 따라 비용을 의식해야 하는 고급 모델
→ 맞음
```

즉 “API로만 써야 한다”라고 단정하기보다는, “월 구독료만으로 부담 없이 쓰던 모델에서 credits 기반 고급 모델로 바뀐다”가 더 정확하다.

![Claude 사용량 크레딧과 비용을 확인하는 작업 사진 4](/images/posts/2026-07-02-claude-fable-5-usage-credits-04.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## 구독제로 쓰던 일반인에게 어려워지는 지점

바이브코더나 일반 구독자 입장에서 가장 큰 문제는 모델 성능이 아니라 비용 예측이다. Fable 5는 긴 컨텍스트와 장기 에이전트 작업에 강점이 있는 모델이다. 그런데 바로 그 긴 작업이 credits를 많이 쓸 수 있다.

월 구독제에서는 이렇게 생각하기 쉽다.

```text
이번 달 구독료를 냈다
→ 한도 안에서 Claude Code를 써본다
→ 비용은 어느 정도 예측 가능
```

credits 기반으로 넘어가면 생각할 것이 늘어난다.

```text
Fable 5를 선택한다
→ 작업이 길어질 수 있다
→ credits가 얼마나 줄어드는지 봐야 한다
→ 조직 계정이면 admin 설정도 확인해야 한다
```

이 구조는 AI 도구에 익숙한 사람에게도 번거롭지만, 일반 사용자에게는 더 큰 장벽이다. 특히 Claude Code로 앱이나 자동화 작업을 빠르게 만들어보려는 사람은 모델 선택, credits, API key, 계정 정책을 매번 이해하기 어렵다.

![Claude 사용량 크레딧과 비용을 확인하는 작업 사진 5](/images/posts/2026-07-02-claude-fable-5-usage-credits-05.jpg)

<small>아이폰 13 12MP 스마트폰 기록사진 느낌으로 생성한 참고 이미지입니다.</small>

## API 사용과 usage credits는 같은 말이 아님

여기서 헷갈리기 쉬운 부분이 있다. 7월 7일 이후 usage credits가 필요하다는 말과 “API만 써야 한다”는 말은 같지 않다.

Claude Code는 구독 로그인으로도 쓸 수 있고, API 키를 통해서도 쓸 수 있다. Anthropic Help Center는 `ANTHROPIC_API_KEY` 환경변수가 설정되어 있으면 Claude Code가 구독 포함 사용량이 아니라 API usage charges로 처리될 수 있다고 안내한다.

구분하면 이렇다.

```text
Claude Code + 구독 로그인
→ Pro/Max/Team/Enterprise의 포함 사용량 한도 소모

Claude Code + ANTHROPIC_API_KEY
→ API usage charges로 처리 가능

Fable 5 after July 7
→ usage credits 기반 사용
```

따라서 확인해야 할 것은 “API를 쓰느냐”만이 아니다. 내가 지금 Claude Code를 어떤 계정 경로로 쓰는지, Fable 5가 구독 포함 한도로 처리되는지, credits가 켜져 있는지가 더 중요하다.

## Claude Code에서 확인할 것

Claude Code를 쓰는 사람이라면 아래 순서로 확인하는 것이 좋다.

### 1. Fable 5가 모델 목록에 보이는지 확인

Claude Code 안에서 모델 선택기를 열어본다.

```text
/model
```

Fable 5를 직접 선택하려면 다음 명령을 쓴다.

```text
/model fable
```

[Claude Code model configuration](https://code.claude.com/docs/en/model-config) 문서는 Fable 5가 기본 모델은 아니며 `/model fable`로 선택한다고 설명한다.

### 2. Claude Code 버전 확인

Fable 5는 Claude Code v2.1.170 이상이 필요하다. 오래된 버전에서는 모델 선택기에 보이지 않거나 선택할 수 없다.

```bash
claude --version
```

필요하면 업데이트한다.

```bash
claude update
```

### 3. API 키 환경변수 확인

터미널에서 `ANTHROPIC_API_KEY`가 잡혀 있으면 의도와 다르게 API 과금 경로를 탈 수 있다. 값을 그대로 노출하지 않도록 주의하면서 존재 여부만 확인하는 편이 낫다.

```bash
printenv ANTHROPIC_API_KEY >/dev/null && echo "API key is set" || echo "API key is not set"
```

구독 포함 사용량으로 쓰려는 사람이라면, Claude Code가 어떤 계정으로 로그인되어 있는지와 API 키 환경변수를 함께 확인해야 한다.

### 4. usage credits 활성화 여부 확인

7월 7일 이후 Fable 5를 계속 쓰려면 credits 설정이 필요할 수 있다. 개인 계정이라면 Console 또는 결제 설정을 확인해야 하고, Team·Enterprise 계정이라면 admin 정책에 따라 막힐 수 있다.

Fable 5가 보이지 않는다고 해서 무조건 버그는 아니다. credits, allowlist, zero data retention 설정 때문에 빠질 수 있다.

## 바이브코더의 현실적인 사용 기준

Fable 5는 강력한 모델이지만, 구독자가 매일 켜두기 좋은 모델은 아닐 가능성이 높다. 7월 7일 이후 credits 기반으로 바뀐다면 더 그렇다.

현실적인 기준은 이 정도다.

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">일상 작업</span>
    <h3>Sonnet 또는 기본 모델</h3>
    <p class="issue-summary">블로그 문장 수정, 작은 코드 변경, 짧은 문서 정리는 더 저렴한 모델로도 충분할 수 있다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">어려운 작업</span>
    <h3>Fable 5 선택</h3>
    <p class="issue-summary">긴 오류 추적, 큰 리팩터링, 복잡한 설계처럼 한 번에 많은 맥락을 봐야 하는 작업에 쓰는 편이 낫다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">비용 관리</span>
    <h3>작업 전 credits 확인</h3>
    <p class="issue-summary">긴 작업을 맡기기 전 credits 잔액과 과금 경로를 확인해야 예상 밖 비용을 줄일 수 있다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">습관</span>
    <h3>작업 후 기본 모델 복귀</h3>
    <p class="issue-summary">Fable 5로 어려운 작업을 끝냈다면 다시 Sonnet이나 기본 모델로 돌려두는 습관이 필요하다.</p>
  </li>
</ul>

Fable 5를 “항상 켜두는 모델”로 생각하면 비용 부담이 커질 수 있다. 오히려 “막히는 작업을 뚫을 때 쓰는 고급 카드”로 두는 편이 일반 사용자에게 현실적이다.

## 결론: 계속 사용 가능하지만, 구독만으로는 부담 증가

정리하면 Fable 5가 사라지는 것은 아니다. Claude Code에서 계속 선택할 수 있고, 공식 문서도 `/model fable`을 안내한다. 하지만 7월 7일 이후에는 일부 구독 한도에 포함되던 기간이 끝나고 usage credits 기반 사용으로 넘어간다.

그래서 구독제로 쓰던 일반인에게는 사용 장벽이 올라간다. 월 구독료 안에서 마음 편하게 쓰던 모델이 아니라, 작업 길이와 사용량에 따라 비용을 신경 써야 하는 모델이 되기 때문이다.

바이브코더에게 필요한 판단은 단순하다. Fable 5는 계속 쓸 수 있지만, 기본 모델처럼 쓰기보다 어려운 작업에만 꺼내 쓰는 편이 낫다. 7월 7일 이후에는 모델 선택보다 먼저 credits, 계정 경로, API 키 환경변수 확인이 필요하다.

## 참고한 문서

- [Anthropic: Redeploying Fable 5](https://www.anthropic.com/news/redeploying-fable-5)
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config)
- [Anthropic Help Center: Using Claude Code with your Pro or Max plan](https://support.anthropic.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
