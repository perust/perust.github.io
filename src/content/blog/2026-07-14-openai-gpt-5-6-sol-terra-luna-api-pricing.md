---
title: "OpenAI GPT-5.6 API 정리: Sol·Terra·Luna 모델 ID와 가격"
description: "OpenAI 개발자 문서 기준 GPT-5.6 Sol·Terra·Luna의 모델 ID, 컨텍스트, 출력 한도, 토큰 가격, 실제 선택 기준을 정리했습니다."
date: "2026-07-14T06:01:36+09:00"
category: "AI"
tags: ["OpenAI", "GPT-5.6", "API", "AI모델", "개발도구", "AI비용", "투자관점"]
---

OpenAI 개발자 문서에서 GPT-5.6 계열이 Sol, Terra, Luna로 나뉘어 정리됐습니다. 이제 단순히 “GPT-5.6이 열렸나”보다 어떤 모델 ID를 쓰고, 100만 토큰당 비용이 얼마이며, 긴 컨텍스트 작업에서 어떤 모델을 고를지가 더 중요해졌습니다.

이번 글은 OpenAI 공식 API 문서에 공개된 모델 페이지를 기준으로 GPT-5.6 Sol·Terra·Luna의 용도, 모델 ID, 컨텍스트, 출력 한도, 가격 차이를 한 번에 정리했습니다. ChatGPT 앱의 계정별 모델 선택 화면이 아니라 개발자가 API와 자동화 도구에서 모델을 고를 때 보는 기준입니다.

## 핵심 요약

<ul class="issue-list">
  <li class="issue-card">
    <span class="issue-badge">모델 구성</span>
    <h3>Sol·Terra·Luna 3단계</h3>
    <p class="issue-summary">OpenAI Models 문서는 GPT-5.6 Sol을 복잡한 추론과 코딩용 플래그십, Terra를 지능과 비용의 균형형, Luna를 대량 처리용 비용 절감형으로 안내합니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">공통 스펙</span>
    <h3>105만 컨텍스트와 12만8천 출력</h3>
    <p class="issue-summary">각 모델 페이지에는 1,050,000 context window, 128,000 max output tokens, text·image 입력, text 출력, reasoning token support가 표시되어 있습니다.</p>
  </li>
  <li class="issue-card">
    <span class="issue-badge">가격 차이</span>
    <h3>출력 토큰 기준 Sol이 Luna의 5배</h3>
    <p class="issue-summary">공식 문서 기준 100만 토큰당 출력 가격은 Sol 30달러, Terra 15달러, Luna 6달러입니다. 긴 에이전트 작업에서는 모델 이름보다 반복 호출 비용이 먼저 체감될 수 있습니다.</p>
  </li>
</ul>

## 무엇이 바뀌었나

지난주에는 GPT-5.6이 일부 프리뷰 또는 출시 보도와 함께 언급되는 단계였습니다. 지금 OpenAI API 모델 문서에서는 GPT-5.6 계열이 구체적인 모델 페이지로 나뉘어 있고, 각 페이지에 모델 설명, 컨텍스트 길이, 출력 한도, 가격이 표시됩니다.

가장 중요한 변화는 모델명이 하나가 아니라는 점입니다. OpenAI는 최신 모델 선택 안내에서 GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna를 서로 다른 비용·성능 포지션으로 설명합니다. API를 쓰는 사람에게는 “최신 모델을 쓴다”가 아니라 “작업별로 어느 등급을 고른다”가 실제 선택지가 됩니다.

<div class="routine-kv">
  <div><dt>GPT-5.6 Sol</dt><dd>복잡한 전문 작업, 추론, 코딩 중심의 플래그십 모델</dd></div>
  <div><dt>GPT-5.6 Terra</dt><dd>성능과 비용을 함께 보는 균형형 모델</dd></div>
  <div><dt>GPT-5.6 Luna</dt><dd>비용 민감도가 높은 대량 처리용 모델</dd></div>
  <div><dt>API 기준</dt><dd>Responses API와 Client SDK에서 최신 모델을 선택하는 흐름</dd></div>
</div>

## 모델 ID와 용도

OpenAI 모델 페이지에서 확인한 모델 ID는 각각 `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`입니다. Sol 페이지에는 `gpt-5.6` alias가 GPT-5.6 Sol로 라우팅된다는 설명도 있습니다.

이 차이는 자동화 코드에서 중요합니다. 예를 들어 내부 문서 검색, 코드 리뷰, 테스트 실패 분석처럼 한 번의 답변 품질이 중요한 작업은 Sol 후보가 됩니다. 매일 수천 건의 요약, 분류, 태깅을 돌리는 작업은 Luna나 Terra부터 비용을 계산하는 편이 현실적입니다.

<ul class="issue-list">
  <li class="issue-card"><h3>Sol: 실패 비용이 큰 작업</h3><p class="issue-summary">복잡한 코드베이스 이해, 긴 의사결정 문서, 어려운 디버깅, 고난도 추론처럼 한 번 틀렸을 때 사람이 다시 고치는 비용이 큰 작업에 맞습니다.</p></li>
  <li class="issue-card"><h3>Terra: 기본 업무 자동화 후보</h3><p class="issue-summary">문서 요약, 사내 질의응답, 코드 보조, 데이터 정리처럼 품질과 비용을 같이 봐야 하는 업무에서 첫 비교 대상으로 보기 좋습니다.</p></li>
  <li class="issue-card"><h3>Luna: 대량 처리와 비용 제한</h3><p class="issue-summary">짧은 분류, 초안 생성, 반복 태깅, 로그 요약처럼 호출 수가 많고 단가가 중요한 작업에서 먼저 테스트할 만한 등급입니다.</p></li>
</ul>

## 가격과 한도

공식 모델 페이지 기준 세 모델의 입력·캐시 입력·출력 가격은 확실히 다릅니다. 모두 100만 토큰 단위 가격입니다.

<div class="routine-grid">
  <section class="routine-card">
    <span class="issue-badge">Sol</span>
    <h3>입력 5달러 · 출력 30달러</h3>
    <p>캐시 입력은 0.50달러입니다. 복잡한 전문 작업용 모델인 만큼 출력 토큰 비용이 가장 큽니다.</p>
  </section>
  <section class="routine-card">
    <span class="issue-badge">Terra</span>
    <h3>입력 2.50달러 · 출력 15달러</h3>
    <p>캐시 입력은 0.25달러입니다. Sol의 절반 수준 단가로 성능과 비용의 균형을 노리는 포지션입니다.</p>
  </section>
  <section class="routine-card">
    <span class="issue-badge">Luna</span>
    <h3>입력 1달러 · 출력 6달러</h3>
    <p>캐시 입력은 0.10달러입니다. 대량 호출과 비용 제한이 있는 서비스에서 먼저 계산해볼 수 있는 단가입니다.</p>
  </section>
</div>

세 모델 모두 모델 페이지에 1,050,000 context window와 128,000 max output tokens가 표시되어 있습니다. 긴 문서나 큰 코드베이스를 다루기 쉬워졌다는 뜻이지만, 컨텍스트를 크게 넣으면 비용도 같이 커집니다.

또 공식 문서에는 272K를 넘는 입력 프롬프트에 대해 전체 요청의 입력 2배, 출력 1.5배 가격이 적용된다는 안내가 있습니다. 긴 컨텍스트가 가능하다는 말과 긴 컨텍스트를 매번 쓰는 것이 싸다는 말은 다릅니다.

## 개발자가 바로 바꿔야 할 부분

가장 먼저 할 일은 모델 이름을 하드코딩한 위치를 찾는 것입니다. 기존 코드가 `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini` 같은 모델명을 직접 넣고 있다면 작업별 라우팅으로 바꿀 수 있습니다.

<div class="routine-template">
  <h3>모델 라우팅 기준</h3>
  <ul>
    <li>고난도 추론·코딩·긴 계획: `gpt-5.6-sol` 후보</li>
    <li>일반 문서 요약·코드 보조·업무 자동화: `gpt-5.6-terra`부터 비교</li>
    <li>대량 분류·태깅·짧은 초안: `gpt-5.6-luna`부터 비용 검증</li>
    <li>긴 컨텍스트 요청: 272K 초과 과금 구간을 별도 계산</li>
    <li>반복 문서 처리: 캐시 입력 단가와 캐시 적중률을 함께 기록</li>
  </ul>
</div>

제품에 바로 붙이는 경우에는 모델 하나만 바꾸지 말고 로그 항목도 같이 바꿔야 합니다. 요청당 입력 토큰, 출력 토큰, 캐시 입력, 모델 ID, 지연시간, 실패율을 함께 남겨야 실제 비용 차이를 볼 수 있습니다.

## ChatGPT 사용자와 API 사용자의 차이

이 글의 기준은 OpenAI API 개발자 문서입니다. ChatGPT 앱에서 모든 사용자에게 같은 모델명이 바로 보인다는 뜻은 아닙니다. ChatGPT의 모델 선택, 지역, 요금제, 워크스페이스 정책은 API 모델 페이지와 다르게 운영될 수 있습니다.

일반 사용자는 “내 ChatGPT 화면에 Sol·Terra·Luna가 보이는가”를 확인하게 됩니다. 개발자와 팀은 “내 API 키에서 모델 ID가 호출되는가, 가격이 예산 안에 들어오는가, 기존 프롬프트가 같은 품질로 동작하는가”를 봐야 합니다.

## 투자자로서의 관점

이번 문서 업데이트는 모델 성능 뉴스보다 가격표와 제품 포지셔닝에 가깝습니다. 투자 관점에서는 OpenAI가 고성능 모델 하나만 밀기보다 플래그십·균형형·저비용형으로 수요를 나누고 있다는 점이 중요합니다.

<ul class="issue-list">
  <li class="issue-card"><h3>API 매출의 층화</h3><p class="issue-summary">Sol은 고가 전문 작업, Terra는 일반 자동화, Luna는 대량 처리 수요를 겨냥합니다. 같은 GPT-5.6 계열 안에서도 고객의 예산과 작업 난이도에 따라 매출 단가가 달라질 수 있습니다.</p></li>
  <li class="issue-card"><h3>추론 비용과 마진</h3><p class="issue-summary">105만 컨텍스트와 12만8천 출력은 사용량을 키울 수 있지만 추론 비용 부담도 큽니다. 캐시 입력 가격과 긴 프롬프트 할증은 원가 관리 장치로 볼 수 있습니다.</p></li>
  <li class="issue-card"><h3>경쟁 모델 가격 압박</h3><p class="issue-summary">Anthropic, Google, xAI, 오픈소스 모델이 동시에 가격과 성능을 조정하면 기업 고객은 모델을 바꿔가며 씁니다. 실제 경쟁력은 벤치마크뿐 아니라 가격, 안정성, SDK, 도구 연동에서 갈립니다.</p></li>
</ul>

## 마지막으로

GPT-5.6을 둘러싼 관심은 이제 출시 여부에서 실제 사용 비용으로 넘어왔습니다. OpenAI 공식 문서 기준으로 Sol·Terra·Luna는 같은 계열이지만 가격과 용도가 다릅니다.

개발자와 바이브코더가 바로 가져갈 결론은 단순합니다. 중요한 작업은 Sol로 품질을 비교하고, 기본 자동화는 Terra를 기준으로 잡고, 대량 호출은 Luna에서 비용을 먼저 계산하는 방식이 현실적입니다. 긴 컨텍스트는 강력하지만 272K 초과 과금 구간과 출력 토큰 비용까지 함께 봐야 합니다.

## 참고한 자료

- [OpenAI API 문서: Models](https://developers.openai.com/api/docs/models)
- [OpenAI API 문서: Model guidance / Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI API 문서: GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [OpenAI API 문서: GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra)
- [OpenAI API 문서: GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna)
