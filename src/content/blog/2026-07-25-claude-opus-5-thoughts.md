---
title: "Claude Opus 5 출시: 풍동과 3D 동물세포 데모"
description: "Claude Opus 5의 가격, 100만 토큰, Claude Code 지원과 풍동·3D 동물세포 데모를 살펴보고 실제 작업에서 기대하는 점을 정리했습니다."
date: "2026-07-25"
category: "AI/IT 정보"
tags: ["Claude", "ClaudeCode", "AI에이전트", "AI모델", "투자관점"]
editorialReview: true
valueType: "original-analysis"
---

Anthropic이 2026년 7월 24일 Claude Opus 5를 공개했습니다. 새로운 모델이 나오면 벤치마크 점수부터 보게 되는데, 이번에는 두 개의 데모 영상이 더 궁금했습니다.

하나는 물체 주변의 공기 흐름을 바꿔볼 수 있는 풍동 시뮬레이션이고, 다른 하나는 3D 동물세포를 살펴보는 인터랙티브 결과물입니다. 완성된 이미지를 보여주는 데서 끝나지 않고 직접 조작할 수 있는 화면을 만들었다는 점이 인상적이었습니다.

Claude Code를 작업에 자주 사용하다 보니 궁금한 부분도 자연스럽게 달라졌습니다. 답변이 조금 더 똑똑해졌는지보다, 내가 설명한 일을 중간에 놓치지 않고 실제 결과물까지 만들 수 있는지가 더 궁금했습니다.

![Claude Opus 5 공식 발표의 대표 이미지](/images/posts/2026-07-25-claude-opus-5/opus-5-launch-visual.webp)

<small>출처: [Anthropic, Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)</small>

## 먼저 정리한 정보

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">출시</span>
    <h3>2026년 7월 24일 공개</h3>
    <p class="issue-summary">Claude 앱, Claude API와 주요 클라우드 플랫폼에서 제공됩니다. API 모델 ID는 <code>claude-opus-5</code>입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">길이</span>
    <h3>100만 토큰 컨텍스트</h3>
    <p class="issue-summary">기본·최대 컨텍스트가 100만 토큰이고, 최대 출력은 12만8천 토큰입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">가격</span>
    <h3>입력 5달러·출력 25달러</h3>
    <p class="issue-summary">100만 토큰 기준이며 Opus 4.8과 같은 가격입니다. Fable 5의 입력 10달러·출력 50달러와 비교하면 절반입니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">Claude Code</span>
    <h3><code>/model opus</code>로 선택</h3>
    <p class="issue-summary">Claude Code 2.1.219 이상이 필요합니다. Max와 Team Premium 등에서는 기본 모델이며, Pro와 Team Standard의 기본 모델은 Sonnet 5입니다.</p>
  </li>
</ul>

Opus 5는 thinking이 기본으로 켜져 있습니다. 작업의 난도에 따라 추론량을 조절하고, 사용자는 effort 단계로 속도와 비용의 균형을 바꿀 수 있습니다. 문서 한 줄을 고치는 일과 여러 파일을 오가는 디버깅에 같은 양의 추론을 쓸 필요는 없기 때문입니다.

Fast mode도 있습니다. 기본 모드보다 약 2.5배 빠르고 가격은 입력 10달러·출력 50달러입니다. 현재는 연구 프리뷰이며 Claude API에서만 제공되고, AWS·Google Cloud·Microsoft Foundry에서는 지원하지 않습니다.

## 풍동 시뮬레이션

첫 번째 영상은 작동하는 풍동 시뮬레이션입니다. Anthropic 공식 발표에서는 여러 설정을 바꾸며 물체 주변의 공기 흐름을 살펴볼 수 있다고 소개했습니다.

<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/4WQd-8d5j4k" title="Claude Opus 5 builds a working wind tunnel" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

<small>영상: [Claude 공식 YouTube, &quot;Claude Opus 5 builds a working wind tunnel&quot;](https://youtu.be/4WQd-8d5j4k)</small>

이 영상을 보면서 프론트엔드 결과물의 기준이 많이 올라갔다는 생각이 들었습니다. 예전에는 AI가 만든 화면을 보면 기능은 있어도 어딘가 밋밋하거나, 조금만 수정하면 전체가 틀어지는 경우가 많았습니다. 이번에는 시각적인 표현과 상호작용을 한 화면 안에 담았습니다.

공식 발표에 실을 만큼 잘 나온 사례를 골랐다는 점은 감안해야 합니다. 기존 코드, 브라우저 호환성, 성능 문제까지 들어오는 실제 프로젝트는 훨씬 복잡합니다. 그래도 코드 파일을 만들었다는 설명만 듣는 것과 직접 조작하는 결과물을 보는 것은 느낌이 달랐습니다.

## 3D 동물세포

두 번째 영상은 3D 동물세포를 직접 살펴볼 수 있는 결과물입니다. Anthropic 발표문에서는 이를 단순화된 인터랙티브 세포 일러스트라고 설명합니다.

<div class="video-embed">
  <iframe src="https://www.youtube-nocookie.com/embed/2eiKnt9Hi6I" title="Claude Opus 5 builds a 3D interactive animal cell" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

<small>영상: [Claude 공식 YouTube, &quot;Claude Opus 5 builds a 3D interactive animal cell&quot;](https://youtu.be/2eiKnt9Hi6I)</small>

여기서는 교육용 콘텐츠가 떠올랐습니다. 글과 그림으로 보던 내용을 돌려보고, 세포의 요소를 선택해 설명과 연결할 수 있다면 공부할 때도 재미있을 것 같습니다.

바로 수업에 배포할 수 있는 과학 자료라는 뜻은 아닙니다. 구조와 설명이 정확한지는 전문가의 검토가 필요합니다. 다만 교사나 연구자가 아이디어를 설명하고 개발자와 함께 수정할 수 있는 초안을 빠르게 만드는 데에는 충분히 쓸모가 있어 보였습니다.

## 공식 벤치마크

Anthropic은 코딩, 장기 에이전트 작업, 지식 업무, 컴퓨터 사용에서 Opus 4.8보다 성능이 크게 좋아졌다고 설명했습니다. CursorBench 3.2에서는 max effort 기준 Fable 5 최고 점수와 0.5% 이내였고, 작업당 비용은 절반이었다고 발표했습니다.

Zapier AutomationBench에서는 같은 작업당 비용을 기준으로 Opus 5의 통과율이 다음 모델의 약 1.5배였습니다. 가장 낮은 effort에서도 비교 모델의 최고 통과율을 넘어섰습니다.

![AutomationBench 작업당 비용과 통과율 비교](/images/posts/2026-07-25-claude-opus-5/automationbench-cost-performance.webp)

<small>출처: [Anthropic, Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5) · Anthropic이 공개한 effort 단계별 작업당 비용과 통과율</small>

이 그래프는 Anthropic이 직접 공개한 평가입니다. 독립 기관이 모든 모델을 같은 조건에서 비교한 순위표는 아닙니다. 그래도 토큰 단가만 표시하지 않고 작업당 비용을 함께 제시한 점은 현실적이었습니다. 한 번에 끝내지 못하고 같은 요청을 반복하면 시간과 비용이 같이 늘어나기 때문입니다.

Opus 5가 모든 분야에서 가장 강한 모델인 것도 아닙니다. Anthropic은 사이버보안 작업에서는 Mythos 5에 뒤처진다고 밝혔습니다. 이번 모델은 매일 사용하는 코딩과 지식 업무, 장기 에이전트 작업에 무게를 둔 것으로 보입니다.

## 실제 작업에서 기대하는 점

Opus 5는 생각과 판단이 오래 이어져야 하는 작업에 먼저 사용해보고 싶습니다.

<div class="routine-kv">
  <div><dt>복잡한 구현</dt><dd>여러 파일과 기존 규칙을 함께 읽고 기능을 완성하는 작업</dd></div>
  <div><dt>원인 분석</dt><dd>긴 로그와 테스트 실패를 연결해 근본 원인을 좁히는 작업</dd></div>
  <div><dt>비판적 검토</dt><dd>초안의 허점, 과장, 빠진 조건을 찾아 다시 고치는 작업</dd></div>
  <div><dt>프로토타입</dt><dd>설명만 하던 아이디어를 실제 조작 가능한 화면으로 바꾸는 작업</dd></div>
</div>

첫 답변이 화려한 것보다 요구사항을 놓치지 않는 것이 좋습니다. 실패한 테스트의 원인을 다시 찾고, 수정한 뒤 직접 검증하는 과정까지 이어진다면 실제 작업 시간이 많이 줄어듭니다. Anthropic 문서에도 Opus 5가 이전 모델보다 스스로 검증하는 경향이 강해졌다고 적혀 있습니다.

100만 토큰 컨텍스트도 기대되는 부분입니다. 하지만 많은 내용을 넣을 수 있다는 것과 중요한 내용을 정확히 기억한다는 것은 같지 않습니다. 자료를 무작정 쌓기보다 목표, 바꾸면 안 되는 조건, 완료 기준을 처음에 분명하게 정리하는 습관은 계속 필요합니다.

얼마 전 바이브 코딩 책을 읽으며 &quot;딸깍 한 번이 손쓸 수 없이 커지는 불길이 될 수도 있다&quot;고 적었습니다. Opus 5에서도 이 생각은 같습니다. 모델이 더 많은 일을 할 수 있으면 잘못된 방향으로 더 오래 달릴 수도 있습니다. 작업을 작게 나누고, 테스트하고, 결과를 다시 읽는 과정이 사라지지는 않을 것 같습니다.

## 투자자로서의 관점

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">1순위</span>
    <h3>작업당 비용과 반복 사용</h3>
    <p class="issue-summary">토큰 단가가 같아도 한 작업을 몇 번 만에 끝내는지에 따라 기업의 실제 비용은 달라집니다. Anthropic도 AutomationBench를 작업당 비용 축으로 공개했습니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">2순위</span>
    <h3>Claude Code와 유료 플랜</h3>
    <p class="issue-summary">Opus 5가 Max의 기본 모델이 된 만큼 실제 사용량, 상위 플랜 유지율, Claude Code의 반복 사용이 사업 성과와 연결됩니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">3순위</span>
    <h3>클라우드 유통과 추론 비용</h3>
    <p class="issue-summary">AWS, Google Cloud, Microsoft Foundry에서도 제공됩니다. 사용량이 늘면 클라우드 매출도 커질 수 있지만 빠른 추론을 위한 인프라 비용도 함께 늘어납니다.</p>
  </li>
</ul>

Anthropic은 비상장 기업입니다. Opus 5 발표가 특정 상장사의 실적으로 바로 이어지는 것은 아닙니다. 기업 고객의 반복 사용, API 호출량, 유료 플랜 유지, 클라우드에서 발생하는 매출이 실제 근거가 될 것입니다.

## 마지막으로

이번 발표에서 가장 재미있게 본 것은 풍동과 동물세포였습니다. 벤치마크 숫자는 모델의 위치를 이해하는 데 필요하지만, 직접 만져볼 수 있는 결과물이 내가 이 모델로 무엇을 만들 수 있을지 더 쉽게 상상하게 했습니다.

사람이 할 일도 분명합니다. 풀 문제를 정하고, 사실관계를 검증하고, 결과가 목적에 맞는지 판단해야 합니다. 모델이 강해질수록 코드를 한 줄씩 작성하는 시간은 줄어들 수 있지만, 방향을 정하고 결과를 책임지는 역할은 더 커질 것 같습니다.

Opus 5가 내 작업에 얼마나 도움이 되는지는 결국 직접 써보면서 알게 될 것 같습니다. 복잡한 구현과 긴 원인 분석에서 실패와 재시도가 실제로 줄어드는지부터 천천히 사용해볼 생각입니다.

## 참고 자료

- [Anthropic, Introducing Claude Opus 5](https://www.anthropic.com/news/claude-opus-5)
- [Claude Platform Docs, What&#39;s new in Claude Opus 5](https://platform.claude.com/docs/en/about-claude/models/whats-new-opus-5)
- [Claude Code Docs, Model configuration](https://code.claude.com/docs/en/model-config)
- [Claude Opus 5 builds a working wind tunnel](https://youtu.be/4WQd-8d5j4k)
- [Claude Opus 5 builds a 3D interactive animal cell](https://youtu.be/2eiKnt9Hi6I)
