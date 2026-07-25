---
title: "Claude Opus 5 출시 정리: 가격·100만 토큰·Claude Code 설정"
description: "Claude Opus 5의 출시일, API 가격, 100만 토큰 컨텍스트, Claude Code 최소 버전과 모델·effort 설정, 주요 성능 변화를 공식 문서 기준으로 정리했습니다."
date: "2026-07-25"
category: "AI/IT 정보"
tags: ["Claude", "ClaudeCode", "AI에이전트", "AI모델", "릴리스노트"]
editorialReview: true
valueType: "verified-guide"
---

Anthropic이 2026년 7월 24일 Claude Opus 5를 공개했습니다. Opus 4.8과 같은 API 가격을 유지하면서 100만 토큰 컨텍스트와 12만8천 토큰 최대 출력을 제공하고, Claude Code에서는 2.1.219부터 사용할 수 있습니다.

이번 글에서는 공식 발표와 Claude 문서를 기준으로 가격, 제공 범위, Claude Code 설정, 이전 모델과 달라진 동작을 정리했습니다. 풍동과 3D 동물세포 영상은 Opus 5의 시각적 결과물을 보여주는 공식 참고자료로 함께 첨부했습니다.

![Claude Opus 5 공식 발표의 대표 이미지](/images/posts/2026-07-25-claude-opus-5/opus-5-launch-visual.webp)

<small>출처: [Anthropic, Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)</small>

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">출시</span>
    <h3>2026년 7월 24일 공개</h3>
    <p class="issue-summary">Claude 앱, Claude API와 주요 클라우드 플랫폼에서 제공됩니다. API 모델 ID는 <code>claude-opus-5</code>입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">컨텍스트</span>
    <h3>100만 토큰·최대 출력 12만8천 토큰</h3>
    <p class="issue-summary">100만 토큰이 기본이자 최대 컨텍스트입니다. 별도의 작은 컨텍스트 모델은 없습니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">API 가격</span>
    <h3>입력 5달러·출력 25달러</h3>
    <p class="issue-summary">100만 토큰 기준이며 Opus 4.8과 같습니다. Fable 5의 입력 10달러·출력 50달러와 비교하면 절반입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">Claude Code</span>
    <h3>2.1.219 이상에서 사용</h3>
    <p class="issue-summary"><code>claude update</code>로 업데이트한 뒤 <code>/model opus</code>로 선택할 수 있습니다.</p>
  </li>
</ul>

## Claude Code 설정

Claude Code에서 `opus` 별칭이 Opus 5를 가리키려면 2.1.219 이상이 필요합니다. 이전 버전에서는 같은 별칭이 Opus 4.8이나 더 이전 모델을 가리킵니다.

- 버전 업데이트: `claude update`
- 모델 선택: `/model opus`
- 특정 모델 고정: `claude-opus-5`
- effort 변경: `/effort`

Opus 5가 지원하는 effort 단계는 `low`, `medium`, `high`, `xhigh`, `max`입니다. 기본값은 `high`이며, 짧고 단순한 작업은 낮추고 복잡한 원인 분석이나 여러 파일을 수정하는 작업은 높일 수 있습니다. `max`는 현재 세션에만 적용되며 토큰 사용량이 많고 과도하게 생각하는 경우도 있어 모든 작업의 기본값으로 쓰기보다는 필요한 작업에서 선택하는 방식이 적절합니다.

Max와 Team Premium 등에서는 Opus 5가 기본 모델입니다. Pro와 Team Standard의 기본 모델은 Sonnet 5이지만, Opus 5를 직접 선택해 사용할 수 있습니다. 조직의 모델 제한이나 공급자 설정에 따라 실제 선택 가능 모델은 달라질 수 있습니다.

## thinking과 동작 변화

Opus 5는 thinking이 기본으로 켜져 있습니다. API에서는 모델이 작업마다 필요한 추론량을 판단하고, effort 설정으로 깊이를 조절합니다. thinking을 끄려면 effort가 `high` 이하여야 하며, `xhigh`나 `max`에서 비활성화하면 400 오류가 발생합니다.

이전 모델에서 사용하던 프롬프트도 손볼 부분이 있습니다. Anthropic은 Opus 5가 지시하지 않아도 스스로 결과를 검증하는 편이므로, "마지막에 다시 검증해라" 또는 "별도 에이전트로 검증해라" 같은 지시를 그대로 두면 과잉 검증이 발생할 수 있다고 설명합니다.

기본 응답과 문서 결과물은 Opus 4.8보다 길어졌고, 에이전트 세션에서는 진행 상황을 더 자주 설명합니다. 여러 에이전트를 사용하는 작업에서는 하위 에이전트에게 더 적극적으로 일을 나누는 경향도 있습니다.

## 가격과 Fast mode

기본 API 가격은 100만 토큰당 입력 5달러, 출력 25달러입니다. 프롬프트 캐시 읽기는 0.50달러이며, 배치 API를 사용하면 입력과 출력 가격이 각각 50% 할인됩니다.

Fast mode는 기본 속도의 약 2.5배로 동작하고 가격은 입력 10달러·출력 50달러입니다. 현재 연구 프리뷰이며 Claude API에서 제공됩니다. Claude Code에서는 사용 크레딧으로 이용할 수 있지만 Claude Platform on AWS, Amazon Bedrock, Google Cloud와 Microsoft Foundry에서는 지원하지 않습니다.

## 공식 벤치마크

Anthropic은 Opus 5가 코딩, 장기 에이전트 작업, 지식 업무와 컴퓨터 사용에서 Opus 4.8보다 개선됐다고 발표했습니다.

- Frontier-Bench v0.1에서는 Opus 4.8 성능의 두 배를 넘었고 작업당 비용은 더 낮았습니다.
- CursorBench 3.2에서는 max effort 기준 Fable 5 최고 점수와 0.5% 이내였고, 작업당 비용은 절반이었습니다.
- Zapier AutomationBench에서는 같은 작업당 비용을 기준으로 차순위 모델보다 약 1.5배 높은 통과율을 기록했습니다.

![AutomationBench 작업당 비용과 통과율 비교](/images/posts/2026-07-25-claude-opus-5/automationbench-cost-performance.webp)

<small>출처: [Anthropic, Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5) · Anthropic이 공개한 effort 단계별 작업당 비용과 통과율</small>

위 수치는 Anthropic이 직접 공개한 평가입니다. 독립 기관이 모든 모델을 동일한 조건에서 검증한 순위는 아닙니다. 다만 토큰 단가 외에 작업을 끝낼 때까지 사용한 비용을 함께 공개했다는 점은 참고할 만합니다. 같은 요청을 여러 번 반복하면 실제 비용과 시간도 함께 늘어나기 때문입니다.

## 사이버보안과 생물학의 제한

Anthropic은 Opus 5에 사이버보안 작업을 의도적으로 학습시키지 않았다고 밝혔습니다. 취약점을 찾는 능력은 Mythos 5에 근접했지만, 발견한 취약점을 실제 공격 코드로 만드는 능력은 Mythos 5보다 크게 낮았습니다.

생물학의 장기 자율 연구에서도 Mythos 5가 더 강합니다. 따라서 Opus 5를 모든 전문 분야에서 가장 높은 성능을 내는 모델로 해석하기보다는, 일반적인 코딩·지식 업무와 장기 에이전트 작업을 위한 모델로 보는 편이 공식 설명에 가깝습니다.

## 공식 데모 참고자료

Anthropic은 Opus 5가 만든 시각적 결과물로 풍동 시뮬레이션과 단순화된 3D 동물세포를 공개했습니다. 프론트엔드와 시각 결과물 생성 능력을 보여주는 공식 예시이며, 아래 영상에서 결과물을 확인할 수 있습니다.

<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/4WQd-8d5j4k" title="Claude Opus 5 builds a working wind tunnel" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

<small>영상: [Claude 공식 YouTube, &quot;Claude Opus 5 builds a working wind tunnel&quot;](https://youtu.be/4WQd-8d5j4k)</small>

<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/2eiKnt9Hi6I" title="Claude Opus 5 builds a 3D interactive animal cell" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

<small>영상: [Claude 공식 YouTube, &quot;Claude Opus 5 builds a 3D interactive animal cell&quot;](https://youtu.be/2eiKnt9Hi6I)</small>

## 마지막으로

Claude Opus 5는 Opus 4.8과 같은 가격에 100만 토큰 컨텍스트를 기본으로 제공하고, effort 단계에 따라 속도와 추론 깊이를 조절할 수 있게 됐습니다. Claude Code 사용자는 2.1.219 이상으로 업데이트한 뒤 `/model opus`로 선택할 수 있습니다.

기존 프롬프트를 그대로 사용하는 경우에는 thinking 기본 활성화와 자가 검증 방식의 변화를 함께 반영할 필요가 있습니다. 반복적인 검증 지시를 줄이고, 작업 난도에 맞게 effort를 조절하는 것이 이번 업데이트에서 실제 사용 방식과 가장 직접적으로 연결되는 부분입니다.

## 참고 자료

- [Anthropic, Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)
- [Claude Platform Docs, What&#39;s new in Claude Opus 5](https://platform.claude.com/docs/en/about-claude/models/whats-new-opus-5)
- [Claude Platform Docs, Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude Code Docs, Model configuration](https://code.claude.com/docs/en/model-config)
- [Claude Opus 5 builds a working wind tunnel](https://youtu.be/4WQd-8d5j4k)
- [Claude Opus 5 builds a 3D interactive animal cell](https://youtu.be/2eiKnt9Hi6I)
